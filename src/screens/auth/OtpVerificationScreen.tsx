import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import CustomContainer from '../../components/CustomContainer';
import CustomHeader from '../../components/CustomHeader';
import { FontSizes } from '../../styles/FontSizes';
import { AppStrings } from '../../utils/AppStrings';
import CustomPrimaryButton from '../../components/CustomPrimaryButton';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
// import OtpInputs, { OtpInputsRef } from 'react-native-otp-inputs';
import { Fonts } from '../../styles/Fonts';
import { OtpRegExp } from '../../utils/ScreenUtils';
import CommonErrorText from '../../components/CommonErrorText';
import { useFormik } from 'formik';
import * as yup from 'yup';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { AuthStackParamList } from '../../types/RootStackType';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import { commonCredentialsApi, getFcmToken, riderDetails, sendOtp, verifyOtp } from '../../redux/slice/authSlice/AuthSlice';
import DeviceInfo from 'react-native-device-info';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
// import OTPInputView from '@twotalltotems/react-native-otp-input'
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { getAsyncStorageData, setAsyncStorageData } from '../../utils/HelperFunctions';
import i18n from '../../localization/i18n';
import { changeChatLanguage } from '../../redux/slice/chatSlice/ChatSlice';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
// import OTPTextInput from "react-native-otp-textinput"
import { OtpInput } from "react-native-otp-entry";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { setGlobalLang } from '../../redux/slice/homeSlice/HomeSlice';

const OtpVerificationScreen = () => {

    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const navigation = useCustomNavigation('AuthStack');
    const dispatch = useAppDispatch();
    const { isLoading, fcmToken } = useAppSelector(state => state.AuthSlice)
    const { colors } = useAppSelector(state => state.CommonSlice);

    type NestedScreenRouteProp = RouteProp<AuthStackParamList, 'OtpVerificationScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const { phoneNumber, country, confirmation } = route.params;
    const [confirmationn, setConfirmationn] = useState(confirmation);

    const otpTextInputRef = useRef<OTPTextInput>(null)
    const [newRequestTime, setNewRequestTime] = useState(45);
    const [localLoading, setLocalLoading] = useState<boolean>(false);
    const [isBtnDisable, setIsBtnDisable] = useState(false)

    useEffect(() => {
        dispatch(getFcmToken()).then((res) => {
            console.log(res);
        }).catch((error) => {
            console.log(error);
        })
    }, []);
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setInterval(() => {
            setNewRequestTime((prevTime) => {
                const updatedTime = prevTime - 1;
                if (updatedTime <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return updatedTime;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [newRequestTime]);

    const OtpVerificationSchema = yup.object().shape({
        otp: yup.string().trim().matches(OtpRegExp, t(TranslationKeys.please_enter_valid_otp)).required(t(TranslationKeys.please_enter_otp))
    });

    const changeChatLanguageApiCall = () => {
        getAsyncStorageData(AppStrings.selected_language).then(res => {
            // setSelectedLanguage(res ?? 'en')
            i18n.changeLanguage(res)
            const data = new FormData()
            data.append("language_preference", res)
            dispatch(changeChatLanguage(data)).unwrap().then(res => {
            }).catch(e => { })
        })
    }

    const changeLangauge = (code: string) => {
        getAsyncStorageData(AppStrings.selected_language).then(res => {
            let c_code = res === null ? code : res
            i18n.changeLanguage(c_code)
            dispatch(setGlobalLang(c_code))
            setAsyncStorageData(AppStrings.selected_language, c_code)
            const data = new FormData()
            data.append("language_preference", c_code)
            dispatch(changeChatLanguage(data)).unwrap().then(res => {
                setLocalLoading(false);
            }).catch(e => {
                setLocalLoading(false);
            })
        })
    }

    const {
        handleChange,
        handleSubmit,
        values,
        errors,
        touched,
        setValues,
        resetForm
    } = useFormik({
        initialValues: { otp: '' },
        enableReinitialize: true,
        validationSchema: OtpVerificationSchema,
        onSubmit: async (values) => {
            const deviceId = await DeviceInfo.getUniqueId();
            try {
                setLocalLoading(true);
                const data = new FormData();
                const user = await confirmationn.confirm(values.otp);
                if (!user?.user) {
                    return null;
                }
                // data.append('otp', values.otp)
                data.append('otp', "123456"); // Back-end API bypass on firebase user auth
                data.append("phone_number", "+" + country + phoneNumber)
                data.append('user_type', "rider")
                data.append('device_type', Platform.OS)
                data.append('device_id', deviceId)
                    if (fcmToken) {
                        data.append('fcm_token', fcmToken)
                    }
                setIsBtnDisable(true)
                dispatch(verifyOtp(data)).unwrap()
                    .then((res) => {
                        dispatch(commonCredentialsApi(null))
                        dispatch(riderDetails(res?.userData?.id)).unwrap().then(() => {
                            // setLocalLoading(false);
                            changeLangauge(res?.userData?.userLanguageCode)
                            setIsBtnDisable(false)
                            // const hasDocument = (Object.keys(res?.userData?.riderDocument?.passport)?.length > 0 || Object.keys(res?.userData?.riderDocument?.aadhaarCard)?.length > 0) ? true : false;
                            if (res?.userData?.name) {
                                navigation.reset({
                                    index: 0,
                                    routes: [{
                                        name: "DrawerStack"
                                    }]
                                });
                            } else {
                                navigation.navigate('AuthStack', { screen: 'UserDetailsScreen' })
                            }
                            Keyboard.dismiss()
                            resetForm()
                        }).catch((error) => {
                            setLocalLoading(false);
                            setIsBtnDisable(false)
                            Keyboard.dismiss()
                            otpTextInputRef?.current?.clear();
                            setValues({
                                otp: ''
                            })
                            console.log("🚀 ~ file: OtpVerificationScreen.tsx:63 ~ dispatch ~ error:", error)
                        })
                        // changeChatLanguageApiCall()
                    }).catch((error) => {
                        setLocalLoading(false);
                        setIsBtnDisable(false)
                        Keyboard.dismiss()
                        otpTextInputRef?.current?.clear();
                        setValues({
                            otp: ''
                        })
                        if (error?.code === 'auth/invalid-verification-code') {
                            Alert.alert(
                                t(TranslationKeys.invalid_otp),
                                t(TranslationKeys.otp_entered_correct)
                            );                        // Handle invalid OTP
                        } else {
                            Alert.alert(t(TranslationKeys.verify_otp_error), error?.toString());
                        }
                    })
            } catch (error) {
                setLocalLoading(false);
                setIsBtnDisable(false)
                Keyboard.dismiss();
                otpTextInputRef?.current?.clear();
                setValues({ otp: '' });
                if (error?.code === 'auth/invalid-verification-code') {
                    Alert.alert(
                        t(TranslationKeys.invalid_otp),
                        t(TranslationKeys.otp_entered_correct)
                    );                        // Handle invalid OTP
                } else {
                    Alert.alert(t(TranslationKeys.verify_otp_error), error?.toString());
                }
            }
        }
    });


    const sendOTP = async () => {
        try {
            const confirmationResend = await auth().signInWithPhoneNumber("+" + country + phoneNumber);
            setConfirmationn(confirmationResend);
        } catch (error) {
            setConfirmationn(null)
            Alert.alert(t(TranslationKeys.error_sending_otp), error.toString());
            console.error(t(TranslationKeys.error_sending_otp), error);
        }
    };

    const resendOtp = async () => {
        // const deviceId = await DeviceInfo.getUniqueId();
        // const data = new FormData()
        // data.append('device_id', deviceId)
        // data.append('phone_number', phoneNumber)
        // if (fcmToken) {
        //     data.append('fcm_token', fcmToken)
        // }
        // data.append('user_type', "rider")
        // data.append('device_type', Platform.OS)
        // dispatch(sendOtp(data)).unwrap().then((res) => {
        setConfirmationn(null)
        await sendOTP()
        Keyboard.dismiss()
        otpTextInputRef?.current?.clear();
        setValues({
            otp: ''
        })
        // }).catch ((error) => {
        //     console.log("sendOtp error", error);
        // });
    };

    return (
        <View style={GlobalStyle.container}>
            {(isLoading || localLoading) ? <CustomActivityIndicator /> : null}
            <CustomHeader title={t(TranslationKeys.otp)} onPress={() => { navigation.goBack() }} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : StatusBar.currentHeight}
                behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView keyboardShouldPersistTaps={'handled'} bounces={false} contentContainerStyle={{ flex: 1 }}>
                    <CustomContainer>
                        <Text style={Styles.enterNumberTxtStyle}>{t(TranslationKeys.otp_verification)}</Text>
                        <Text style={Styles.thisNumberUseTxtStyle}>{`${t(TranslationKeys.code_has_been_sent_to)}\n+${country} ${phoneNumber}`}</Text>
                        <OtpInput
                            ref={otpTextInputRef}
                            numberOfDigits={6}
                            focusColor={colors.PRIMARY}
                            focusStickBlinkingDuration={500}
                            onTextChange={handleChange('otp')}
                            onFilled={(text) => console.log(`OTP is ${text}`)}
                            secureTextEntry
                            textInputProps={{
                                accessibilityLabel: "sms-otp",
                                returnKeyType: 'done',
                                keyboardType: 'number-pad'
                            }}
                            theme={{
                                containerStyle: Styles.otpInputStyle,
                                pinCodeContainerStyle: Styles.otpContainerStyle,
                                pinCodeTextStyle: {
                                    fontFamily: Fonts.FONT_POP_MEDIUM,
                                    fontSize: FontSizes.FONT_SIZE_24,
                                    color: colors.PRIMARY_TEXT,
                                    textAlign: 'center',
                                },
                            }}
                        />
                        {(errors.otp && touched.otp) ? <CommonErrorText title={errors.otp} /> : null}
                        <Text style={Styles.receiveNotOtpTxtStyle}>{t(TranslationKeys.did_not_receive_otp)}</Text>
                        <Text style={Styles.secondTextStyle}>{t(TranslationKeys.you_can_resend_the_otp)} {newRequestTime == 0 ? null : `${t(TranslationKeys.after)} ` + newRequestTime + ` ${t(TranslationKeys.sec)}`}</Text>
                        <TouchableOpacity
                            style={Styles.resendCodeText}
                            disabled={newRequestTime == 0 ? false : true}
                            onPress={async () => {
                                setNewRequestTime(45)
                                resendOtp()
                            }}>
                            <Text style={[Styles.resendOtpTxtStyle, { color: newRequestTime == 0 ? colors.PRIMARY : colors.DISABLE_BUTTON }]}>{t(TranslationKeys.resend_code)}</Text>
                        </TouchableOpacity>
                    </CustomContainer>
                    <CustomPrimaryButton
                        onPress={() => handleSubmit()}
                        disabled={isBtnDisable}
                        style={[GlobalStyle.primaryBtnStyle, GlobalStyle.commonBtnStyle]}
                        title={t(TranslationKeys.verify_otp)} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default OtpVerificationScreen;

const useStyles = () => {

    const GlobalStyle = useGlobalStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            enterNumberTxtStyle: {
                ...GlobalStyle.mainTitleStyle,
                marginTop: wp(5),
                width: wp(80)
            },
            thisNumberUseTxtStyle: {
                ...GlobalStyle.subTitleStyle,
                color: colors.SECONDARY_TEXT,
                fontSize: FontSizes.FONT_SIZE_13,
                marginVertical: wp(2)
            },
            receiveNotOtpTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                opacity: 0.6,
                textAlign: 'center',
                marginTop: wp(7),
                marginBottom: wp(1)
            },
            resendOtpTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.PRIMARY,
                textAlign: 'center',
                textDecorationLine: 'underline',
            },
            otpInputStyle: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: wp(5)
            },
            otpContainerStyle: {
                height: wp(13),
                width: wp(13),
                backgroundColor: colors.BOX_PRIMARY_BACKGROUND,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: wp(2),
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_24,
                color: colors.PRIMARY_TEXT,
                textAlign: 'center',
                padding: 0
            },
            otpInputTxtStyle: {
                width: '100%',
                height: "100%",
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_28,
                color: colors.PRIMARY_TEXT,
                textAlign: 'center',
                padding: 0
            },
            resendCodeText: {
                alignSelf: 'center'
            },
            secondTextStyle: {
                fontSize: FontSizes.FONT_SIZE_13,
                color: colors.PRIMARY_TEXT,
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                alignSelf: 'center',
            }
        })
    );
};
