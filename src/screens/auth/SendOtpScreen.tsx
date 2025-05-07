import React, { useEffect, useState } from 'react';
import { Alert, FlatList, I18nManager, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import CustomHeader from '../../components/CustomHeader';
import { FontSizes } from '../../styles/FontSizes';
import { AppStrings } from '../../utils/AppStrings';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CustomContainer from '../../components/CustomContainer';
import { useFormik } from 'formik';
import { Fonts } from '../../styles/Fonts';
import CustomPhoneTextInput from '../../components/CustomPhoneTextInput';
import CustomPrimaryButton from '../../components/CustomPrimaryButton';
import { PhoneRegExp } from '../../utils/ScreenUtils';
import CommonErrorText from '../../components/CommonErrorText';
import * as yup from 'yup';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
import { getAsyncStorageData, hasLocationPermission, setAsyncStorageData } from '../../utils/HelperFunctions';
import DeviceInfo from 'react-native-device-info';
import { getFcmToken, sendOtp, setCountryCode } from '../../redux/slice/authSlice/AuthSlice';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { Icons } from '../../utils/IconsPaths';
import ReactNativeModal from 'react-native-modal';
import i18n from '../../localization/i18n';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AppAlert } from '../../utils/AppAlerts';
// import PushNotificationIOS from '@react-native-community/push-notification-ios';
import RNRestart from 'react-native-restart'
import { useLanguage } from '../../context/LanguageContext';
import { setGlobalLang } from '../../redux/slice/homeSlice/HomeSlice';
import messaging from '@react-native-firebase/messaging';

export interface sendOtpProps {
    device_id: string,
    phone_number: string | undefined,
};

export const languageList = [
    {
        id: 'en',
        title: "English",
        icon: Icons.ENGLISH_ICON,
    },
    {
        id: 'hi',
        title: "हिंदी",
        icon: Icons.HINDI_ICON,
    },
    {
        id: 'ar',
        title: "عربي",
        icon: Icons.ARABIC_ICON,
    },
]

const SendOtpScreen = () => {

    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const navigation = useCustomNavigation("AuthStack");
    const dispatch = useAppDispatch();
    const { isLoading, fcmToken } = useAppSelector(state => state.AuthSlice);
    const [selectCountry, setSelectCountry] = useState("971");
    const [showBackBtn, setShowBackBtn] = useState<boolean>(true);
    const [isShowSwitchLanguageModel, setIsShowSwitchLanguageModel] = useState<boolean>(false)
    const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { t } = useTranslation();
    const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | undefined>();
    const [localLoading, setLocalLoading] = useState<boolean>(false);
    const { setLangCode } = useLanguage()

    useEffect(() => {
        getAsyncStorageData(AppStrings.is_first_time_open).then((res) => {
            setShowBackBtn(res)
        })
        setAsyncStorageData(AppStrings.is_first_time_open, true)
        getAsyncStorageData(AppStrings.selected_language).then(res => {
            setSelectedLanguage(res ?? 'en')
            i18n.changeLanguage(res)
        })
    }, []);

    const SignInValidationSchema = yup.object().shape({
        phoneNumber: yup.string().trim().max(10, t(TranslationKeys.please_enter_valid_phone_number)).min(4, t(TranslationKeys.please_enter_valid_phone_number)).matches(PhoneRegExp, t(TranslationKeys.please_enter_valid_phone_number)).required(t(TranslationKeys.phone_number_is_requried)),
    });

    const {
        handleChange,
        handleSubmit,
        values,
        errors,
        touched,
        resetForm
    } = useFormik({
        initialValues: { phoneNumber: '' },
        enableReinitialize: true,
        validationSchema: SignInValidationSchema,
        onSubmit: async (values) => {
            setLocalLoading(true);
            const deviceId = await DeviceInfo.getUniqueId();
            const data = new FormData()
            data.append('phone_number', '+' + selectCountry + values.phoneNumber)
            data.append('user_type', "rider")
            // data.append('device_id', deviceId)
            // if (fcmToken) {
            //     data.append('fcm_token', fcmToken)
            // }
            // data.append('device_type', Platform.OS)
            sendOtpApiCall(data)
        }
    });

    useEffect(() => {
        messaging().deleteToken()
        dispatch(getFcmToken()).then((res) => {
            hasLocationPermission()
            console.log(res);
        }).catch((error) => {
            console.log(error);
        })
    }, []);

    const sendOtpApiCall = async (params: FormData) => {
        try {
            dispatch(setCountryCode(selectCountry))
            dispatch(sendOtp(params)).unwrap().then(async (res) => {
                if (Platform.OS === 'ios') {
                    // PushNotificationIOS.setApplicationIconBadgeNumber(0)
                }
                //! Don't remove this 'sendOtp' function as this is critical API for creating user first before sending/verifying OTP.

                const confirmation = await auth().signInWithPhoneNumber("+" + selectCountry + values.phoneNumber);
                setConfirm(confirmation);
                const routeParams = {
                    confirmation,
                    phoneNumber: values.phoneNumber,
                    country: selectCountry,
                    type: "Otp"
                }

                resetForm();
                setLocalLoading(false);
                navigation.navigate('AuthStack', {
                    screen: 'OtpVerificationScreen',
                    params: routeParams,
                })
            }).catch((error) => {
                if (!store.getState().AuthSlice.isSendOtpError) {
                    Alert.alert(t(TranslationKeys.send_otp_error), error.toString());
                }
                setLocalLoading(false);
                if (error?.data?.phoneNumber[0] === "The phone number entered is not valid.") {
                    AppAlert(t(TranslationKeys.message), t(TranslationKeys.the_phone_number_entered_is_not_valid))
                }
                console.log("sendOtp error", error);
            })
        } catch (error) {
            setLocalLoading(false);
            console.log("ERROR", { error })
        }
    }

    const handleSwitchLanguage = (id: string) => {
        dispatch(setGlobalLang(id))
        setLangCode(id)
        setSelectedLanguage(id)
        setIsShowSwitchLanguageModel(false)
        i18n.changeLanguage(id)
        setAsyncStorageData(AppStrings.selected_language, id)
        if (selectedLanguage === "ar" && id !== "ar") {
            setTimeout(() => {
                i18n.changeLanguage(id).then(() => {
                    I18nManager.forceRTL(false)
                    RNRestart.Restart()
                })
            }, 500);
        } else {
            i18n.changeLanguage(id).then(() => {
                if (i18n.language === "ar") {
                    I18nManager.forceRTL(true)
                    setTimeout(() => {
                        RNRestart.Restart()
                    }, 500);
                } else {
                    I18nManager.forceRTL(false)
                }
            })

        }
    }


    const renderLanguage = ({ item }: { item: any }) => {
        return (
            <TouchableWithoutFeedback onPress={() => handleSwitchLanguage(item.id)}>
                <View
                    style={[GlobalStyle.rowContainer,
                    Styles.languageItemContainer,
                    item?.id === selectedLanguage
                        ? { backgroundColor: colors.SHADOW_1 }
                        : null,
                    ]}
                >
                    <View
                        style={[Styles.selectedLanguageContainer, item?.id === selectedLanguage ? { backgroundColor: colors.SECONDARY } : null]}
                    />
                    <Image
                        source={
                            item?.icon
                        }
                        style={Styles.languageListContainer}
                    />
                    <Text style={[GlobalStyle.subTitleStyle, { marginLeft: "5%" }]}>{t(item?.title)}</Text>
                </View>
            </TouchableWithoutFeedback>
        )
    }

    return (
        <View style={GlobalStyle.container}>
            {(isLoading || localLoading) ? <CustomActivityIndicator /> : null}
            <CustomHeader
                iconStyle={{
                    tintColor: showBackBtn ? colors.TRANSPARENT : colors.SECONDARY_ICON
                }}
                headerRightComponent={
                    <TouchableOpacity style={[GlobalStyle.rowContainer, Styles.languageSwitchBtnContainer]}
                        onPress={() => {
                            setIsShowSwitchLanguageModel(true)
                        }}
                    >
                        <Image source={Icons.POPUP_ICON} style={[GlobalStyle.commonIconStyle, { tintColor: colors.PRIMARY_ICON }]} />
                        <Text style={Styles.languageSwitchTextStyle}>{t(TranslationKeys.app_language)}</Text>
                    </TouchableOpacity>
                }
                disabled={showBackBtn}
                onPress={() => {
                    navigation.goBack();
                }} />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : StatusBar.currentHeight}
                behavior={Platform.OS === "ios" ? "padding" : "padding"}>
                <ScrollView keyboardShouldPersistTaps={'handled'} bounces={false} contentContainerStyle={{ flex: 1 }}>
                    <CustomContainer>
                        <Text style={Styles.enterNumberTxtStyle}>{t(TranslationKeys.enter_phone_number)}</Text>
                        <Text style={Styles.thisNumberUseTxtStyle}>{t(TranslationKeys.this_number_will_be_used)}</Text>
                        <CustomPhoneTextInput
                            iscountryshow={true}
                            // countryPickerDisable={true}
                            selectedCountry={selectCountry}
                            value={values.phoneNumber}
                            onChangeText={handleChange("phoneNumber")}
                            setSelectCountry={setSelectCountry}
                        />
                        {touched.phoneNumber && errors.phoneNumber ? <CommonErrorText title={errors.phoneNumber} /> : null}
                    </CustomContainer>
                    <CustomPrimaryButton
                        onPress={() => {
                            if (selectCountry) {
                                handleSubmit()
                            } else {
                                Alert.alert(t(TranslationKeys.please_select_country))
                            }
                        }}
                        style={[GlobalStyle.primaryBtnStyle, GlobalStyle.commonBtnStyle]}
                        title={t(TranslationKeys.send_otp)} />
                </ScrollView>
            </KeyboardAvoidingView>
            <ReactNativeModal
                isVisible={isShowSwitchLanguageModel}
                animationIn={'slideInLeft'}
                animationOut={'slideOutRight'}
                onBackdropPress={() => setIsShowSwitchLanguageModel(false)}
                onBackButtonPress={() => setIsShowSwitchLanguageModel(false)}
            >
                <View style={Styles.languageModalContainer}>
                    <Text style={Styles.chooseLanguageText}>{t(TranslationKeys.choose_your_language)}</Text>
                    <Text style={Styles.languageModalSubtitle}>{t(TranslationKeys.select_your_preferred_language_to_use_Ryd)}</Text>
                    <FlatList data={languageList} renderItem={renderLanguage} />
                </View>
            </ReactNativeModal>
        </View>
    );
};

export default SendOtpScreen;

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
            errorTxtStyle: {
                color: colors.ERROR_TEXT,
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_12
            },
            languageSwitchBtnContainer: {
                borderWidth: wp(0.3),
                borderColor: colors.PRIMARY,
                paddingHorizontal: wp(2),
                paddingVertical: wp(1),
                borderRadius: wp(2)
            },
            languageSwitchTextStyle: {
                marginLeft: wp(2),
                fontSize: FontSizes.FONT_SIZE_13,
                color: colors.PRIMARY,
                fontFamily: Fonts.FONT_POP_SEMI_BOLD
            },
            chooseLanguageText: {
                fontSize: FontSizes.FONT_SIZE_17,
                color: colors.PRIMARY_TEXT,
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                marginVertical: wp(2)
            },
            languageModalSubtitle: {
                fontSize: FontSizes.FONT_SIZE_13,
                color: colors.SECONDARY_TEXT,
                fontFamily: Fonts.FONT_POP_REGULAR,
                marginBottom: wp(3)
            },
            languageItemContainer: {
                borderRadius: wp(2),
                marginVertical: "2%",
                padding: "3.5%",
            },
            selectedLanguageContainer: {
                height: "95%",
                width: "2%",
                borderBottomRightRadius: wp(5),
                borderTopRightRadius: wp(5),
                marginLeft: "-4%",
            },
            activeIconContainer: {
                backgroundColor: colors.SECONDARY,
                marginLeft: wp(1.5),
                borderRadius: wp(2),
                paddingVertical: wp(1),
                justifyContent: 'center',
                alignItems: 'center'
            },
            languageListContainer: {
                marginHorizontal: wp(1.5),
                tintColor: undefined,
                width: wp(8),
                height: wp(8)
            },
            languageModalContainer: {
                padding: wp(5),
                backgroundColor: colors.SECONDARY_BACKGROUND,
                borderRadius: wp(3)
            }
        })
    );
};
