import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomContainer from '../../components/CustomContainer';
import CustomTextInput from '../../components/CustomTextInput';
import { AppStrings } from '../../utils/AppStrings';
import CustomPhoneTextInput from '../../components/CustomPhoneTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ImageProps } from '../../types/DataTypes';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import * as  yup from 'yup'
import { NameRegExp } from '../../utils/ScreenUtils';
import { isEmptyArray, useFormik } from 'formik';
import CommonErrorText from '../../components/CommonErrorText';
import CommonDocumentUploadButton from '../../components/CommonDocumentUploadButton';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { useIsFocused } from '@react-navigation/native';
import { useToast } from 'native-base';
import CommonToastContainer from '../../components/CommonToastContainer';
import { setToastData, updateRiderDetials } from '../../redux/slice/authSlice/AuthSlice';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import CommonDropDownComponent from '../../components/CommonDropDownComponent';
import analytics from '@react-native-firebase/analytics';
import { ANALYTICS_ID } from '../../utils/AnalyticsStringID';
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../../localization/TranslationKeys';



interface documentArrays {
    panCard: ImageProps[] | undefined,
    aadhaarCard: ImageProps[] | undefined,

};

// export const genderArray: { id: number, value: string, label: string }[] = [
//     { id: 1, label: 'Male', value: 'MALE' },
//     { id: 2, label: 'Female', value: 'FEMALE' },
//     { id: 3, label: 'Other', value: 'OTHER' },
// ];

const UserDetailsScreen = () => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { userDetail, isLoading, useIdentificationDocument, cc } = useAppSelector(state => state.AuthSlice);
    const [userDetailsChange, setUserDetailsChange] = useState<boolean>(false);
    const navigation = useCustomNavigation('AuthStack');
    const focus = useIsFocused();
    const dispatch = useAppDispatch();
    const toast = useToast();
    const userDocumentFound = useIdentificationDocument?.findIndex(item => item?.images?.length !== 0)
    const { appliedCode } = store.getState().ReferralSlice
    const [isBtnDisable, setIsBtnDisable] = useState(false)
    const { t } = useTranslation();

    const showToast = () => {
        // toast.show({
        //     duration: 700,
        //     render: () => {
        //         return <CommonToastContainer title={t(TranslationKeys.profile_updated_successfully)} />
        //     }
        // })
        dispatch(setToastData({
            isShowToast: true,
            message: t(TranslationKeys.profile_updated_successfully)
        }))
    };
    const UserNameValidationSchema = yup.object().shape({
        userName: yup.string().trim().required(t(TranslationKeys.please_enter_name)).matches(NameRegExp, t(TranslationKeys.name_cannot_containe_number)).max(50, t(TranslationKeys.name_not_exceed)),
        email: yup.string().trim().email(t(TranslationKeys.please_enter_valid_email)),
        // required(AppStrings.please_enter_email),
        referralCode: yup.string().trim()
        // gender: yup.string().trim().required(AppStrings.please_select_gender),
        // .required(AppStrings.please_enter_email)
    });

    const {
        handleChange,
        handleSubmit,
        values,
        errors,
        touched,
        resetForm,
        setFieldValue
    } = useFormik({
        initialValues: { userName: userDetail?.name ?? '', email: userDetail?.email ?? '', referralCode: appliedCode },
        enableReinitialize: true,
        validationSchema: UserNameValidationSchema,
        onSubmit: (values) => {
            setIsBtnDisable(true)
            const data = new FormData()
            if (values.userName != userDetail?.name) {
                data.append("name", values?.userName)
            }
            if (values.email != userDetail?.email) {
                data.append("email", values?.email)
            }
            // if (userDetail?.gender !== values.gender) {
            //     data.append("gender", values.gender)
            // }
            if (values.referralCode) {
                data.append("referred_code", values.referralCode)
            }
            const params = {
                rider_id: userDetail?.id,
                formData: data
            }
            if (isEmptyArray(data.getParts())) {
                setIsBtnDisable(false)
                navigation.reset({
                    index: 0,
                    routes: [{
                        name: "DrawerStack"
                    }]
                });
            } else {
                focus && dispatch(updateRiderDetials(params)).unwrap().then((res) => {
                    analytics().logEvent(ANALYTICS_ID.USER_REGISTER_SUCCESSFULLY, {
                        'userDetail': {
                            'id': res?.id,
                            'name': res?.name,
                            'phoneNumber': res?.phoneNumber,
                        }
                    })
                    showToast();
                    setTimeout(() => {
                        navigation.reset({
                            index: 0,
                            routes: [{
                                name: "DrawerStack"
                            }]
                        });
                        setIsBtnDisable(false)
                    }, 800);
                }).catch((error) => {
                    setIsBtnDisable(false)
                })
            }
        }
    });

    useEffect(() => {
        return () => {
            resetForm()
        }
    }, []);

    useEffect(() => {
        // if (!values.userName || (userDetail?.name !== values.userName || (values.email && userDetail?.email !== values.email))) {
        if (!values.userName || (userDetail?.name !== values.userName || (values.email && userDetail?.email !== values.email)) || userDocumentFound != -1) {
            setUserDetailsChange(true)
        } else {
            setUserDetailsChange(false)
        }
    }, [values]);

    return (
        <>
            {isLoading ? <CustomActivityIndicator /> : null}
            <SafeAreaView edges={["top"]} style={GlobalStyle.container}>
                <View style={Styles.headerContainer}>
                    <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between' }]}>
                        <Text style={GlobalStyle.mainTitleStyle}>{t(TranslationKeys.welcome)} !</Text>
                        {/* {!userDetailsChange &&
                            <TouchableOpacity
                                style={Styles.skipBtnStyle}
                                onPress={() => {
                                    navigation.navigate('DrawerStack', { screen: 'HomeScreen' })
                                }}>
                                <Text style={Styles.skipBtnText}>{AppStrings.skip}</Text>
                            </TouchableOpacity>
                        } */}
                    </View>
                </View>
                <KeyboardAwareScrollView showsVerticalScrollIndicator={false} enableAutomaticScroll keyboardOpeningTime={Number.MAX_SAFE_INTEGER}>
                    <CustomContainer>
                        <Text style={Styles.textInputLabelText}>{t(TranslationKeys.name)}</Text>
                        <CustomTextInput maxLength={50} placeholder={t(TranslationKeys.enter_name)} value={values.userName} onChangeText={handleChange('userName')} />
                        {(touched.userName && errors.userName) ? <CommonErrorText title={errors.userName} /> : null}
                        <Text style={Styles.textInputLabelText}>{t(TranslationKeys.email)}<Text style={Styles.optionalTextStyle}>{` (${t(TranslationKeys.optional)})`}</Text></Text>
                        <CustomTextInput placeholder={t(TranslationKeys.enter_email_address)} value={values.email} onChangeText={handleChange('email')} />
                        {(touched.email && errors.email) ? <CommonErrorText title={errors.email} /> : null}
                        <Text style={[Styles.textInputLabelText, { marginBottom: 0 }]}>{t(TranslationKeys.mobileno)}</Text>
                        <CustomPhoneTextInput
                            iscountryshow={true}
                            selectedCountry={cc?.replace('+', '')}
                            textInputStyle={{
                                color: colors.PRIMARY_TEXT
                            }}
                            countryPickerDisable={true}
                            editable={false}
                            value={userDetail?.phoneNumber?.replace('+' + cc, '')}
                        />
                        {/* <CommonDropDownComponent
                            labelField="label"
                            valueField="value"
                            label={AppStrings.gender}
                            placeholder={AppStrings.please_select_gender}
                            placeholderStyle={{ color: colors.PRIMARY_TEXT }}
                            data={genderArray}
                            keyboardAvoiding={true}
                            value={values.gender}
                            onChange={(item: { id: number, value: string, label: string }) => {
                                setFieldValue("gender", item.value);
                            }} />
                        {(errors.gender && touched.gender) ? <CommonErrorText title={errors.gender} /> : null} */}
                        <Text style={Styles.textInputLabelText}>{t(TranslationKeys.referral_code)}<Text style={Styles.optionalTextStyle}>{` (${t(TranslationKeys.optional)})`}</Text></Text>
                        <CustomTextInput
                            placeholder={t(TranslationKeys.referral_code)}
                            value={values.referralCode}
                            onChangeText={handleChange('referralCode')}
                        />
                        {(touched.referralCode && errors.referralCode) ? <CommonErrorText title={errors.referralCode} /> : null}
                        <Text style={[Styles.textInputLabelText, { marginBottom: wp(0) }]}>{t(TranslationKeys.Customer_Identification)}<Text style={Styles.optionalTextStyle}>{` (${t(TranslationKeys.optional)})`}</Text></Text>
                        <CommonDocumentUploadButton
                            title={t(TranslationKeys.Customer_Identification)}
                            titleStyle={Styles.documentUploadTitleText}
                            style={Styles.documentUploadBtnContainer}
                            onPress={() => {
                                navigation.navigate('DocumentListScreen', { documentType: 'Rider Documents', documentTitle: t(TranslationKeys.rider_documents) })
                            }}
                        />
                        <Text style={[Styles.textInputLabelText, { marginBottom: wp(0) }]}>{t(TranslationKeys.emergeny_contacts)}<Text style={Styles.optionalTextStyle}>{` (${t(TranslationKeys.optional)})`}</Text></Text>
                        <CommonDocumentUploadButton
                            title={t(TranslationKeys.emergency_contact)}
                            titleStyle={Styles.documentUploadTitleText}
                            style={Styles.documentUploadBtnContainer}
                            onPress={() => {
                                navigation.navigate('AuthStack', { screen: 'EmergencyContactScreen' })
                            }}
                        />
                    </CustomContainer>
                </KeyboardAwareScrollView>
            </SafeAreaView>
            <CustomBottomBtn
                title={t(TranslationKeys.continue)}
                disabled={isBtnDisable}
                onPress={() => {
                    if (!userDetailsChange) {
                        navigation.navigate('DrawerStack', { screen: 'HomeScreen' })
                    } else {
                        handleSubmit()
                    }
                }}
            />
        </>
    )
};

export default UserDetailsScreen;

const useStyles = () => {

    const GlobalStyle = useGlobalStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            textInputLabelText: {
                fontSize: FontSizes.FONT_SIZE_16,
                fontFamily: Fonts.FONT_POP_MEDIUM,
                color: colors.PRIMARY_TEXT,
                marginVertical: wp(2),
                textAlign: 'left'
            },
            headerContainer: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                padding: wp(6),
            },
            headerSubTitleText: {
                fontSize: FontSizes.FONT_SIZE_18,
                fontFamily: Fonts.FONT_POP_MEDIUM,
                color: colors.SECONDARY_TEXT,
            },
            identificationText: {
                marginVertical: wp(3),
            },
            skipBtnStyle: {
                alignSelf: 'flex-end',
                justifyContent: 'center',
                marginHorizontal: wp(5),
            },
            skipBtnText: {
                color: colors.PRIMARY,
                fontSize: FontSizes.FONT_SIZE_15,
                fontFamily: Fonts.FONT_POP_REGULAR,
            },
            documentUploadBtnContainer: {
                backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
                marginBottom: wp(1),
                paddingVertical: wp(3),
                borderRadius: wp(2),
            },
            documentUploadTitleText: {
                fontSize: FontSizes.FONT_SIZE_16,
                fontFamily: Fonts.FONT_POP_REGULAR,
                color: colors.SECONDARY_TEXT
            },
            optionalTextStyle: {
                ...GlobalStyle.subTitleStyle,
                color: colors.DISABLE_BUTTON,
                fontSize: FontSizes.FONT_SIZE_13
            }
        })
    );
};
