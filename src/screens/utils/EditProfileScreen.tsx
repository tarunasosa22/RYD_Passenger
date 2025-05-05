import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, I18nManager, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import CustomHeader from '../../components/CustomHeader';
import { AppStrings } from '../../utils/AppStrings';
import CustomContainer from '../../components/CustomContainer';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import CustomTextInput from '../../components/CustomTextInput';
import CustomPhoneTextInput from '../../components/CustomPhoneTextInput';
import { useToast } from 'native-base';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import { getAsyncStorageData, handleChooseImageFromGallery, requestCameraPermission, setAsyncStorageData } from '../../utils/HelperFunctions';
import { getDocumentFromServer, riderDetails, setToastData, updateRiderDetials } from '../../redux/slice/authSlice/AuthSlice';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { AppAlert } from '../../utils/AppAlerts';
import { isEmptyArray, useFormik } from 'formik';
import * as  yup from 'yup'
import CommonErrorText from '../../components/CommonErrorText';
import FastImage from 'react-native-fast-image';
import { useIsFocused } from '@react-navigation/native';
import { Asset } from 'react-native-image-picker';
import { ImageProps } from '../../types/DataTypes';
import { NameRegExp } from '../../utils/ScreenUtils';
import CommonDocumentUploadButton from '../../components/CommonDocumentUploadButton';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { Icons } from '../../utils/IconsPaths';
import ReactNativeModal from 'react-native-modal';
import { languageList } from '../auth/SendOtpScreen';
import i18n from '../../localization/i18n';
import { changeChatLanguage } from '../../redux/slice/chatSlice/ChatSlice';
import { Camera } from 'react-native-vision-camera';
import CustomCameraPickerComponent from '../../components/CustomCameraPickerComponent';
import RNRestart from 'react-native-restart'
import { useLanguage } from '../../context/LanguageContext';
import { setGlobalLang } from '../../redux/slice/homeSlice/HomeSlice';


const EditProfileScreen = () => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const toast = useToast();
    const dispatch = useAppDispatch()
    const navigation = useCustomNavigation('DrawerStack');
    const focus = useIsFocused();
    const { colors } = useAppSelector(state => state.CommonSlice)
    const { isLoading, userDetail, cc } = useAppSelector(state => state.AuthSlice);
    const [selectedImage, setSelectedImage] = useState<ImageProps | null>(null);
    const [imageError, setImageError] = useState<boolean>(false);
    const keyBoardAvoidingRef = useRef<KeyboardAwareScrollView | null>(null);
    const [isShowSwitchLanguageModel, setIsShowSwitchLanguageModel] = useState<boolean>(false)
    const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
    const { t } = useTranslation();
    const [isBtnDisable, setIsBtnDisable] = useState(false)
    const [imageProfilePopup, setImageProfilePopup] = useState<boolean>(false);
    const [isClickOnCamera, setIsClickOnCamera] = useState<boolean>(false)
    const { locale, setLangCode } = useLanguage()

    useEffect(() => {
        if (userDetail?.id) {
            dispatch(riderDetails(userDetail?.id)).unwrap()
                .then((res) => {
                    dispatch(getDocumentFromServer(res?.riderDocument))
                    setSelectedImage({ uri: res?.profilePic ?? '' })
                })
                .catch((error) => {
                });
        }
        else {
            keyBoardAvoidingRef.current?.scrollToPosition(0, 0)
            setImageError(false)
            resetForm()
        }
        getAsyncStorageData(AppStrings.selected_language).then(res => {
            setSelectedLanguage(res)
            i18n.changeLanguage(res)
        })
    }, []);

    const UserNameValidationSchema = yup.object().shape({
        userName: yup.string().trim().required(t(TranslationKeys.please_enter_name)).matches(NameRegExp, t(TranslationKeys.name_cannot_containe_number)).max(50, t(TranslationKeys.name_not_exceed)),
        email: yup.string().trim().
            // required(t(TranslationKeys.enter_email_address)).
            email(t(TranslationKeys.please_enter_valid_email)),

    });
    const showToast = () => {
        // toast.show({
        //     duration: 1500,
        //     render: () => {
        //         return <View style={Styles.bottomToastContainer}>
        //             <Text style={Styles.bottomToastText}>{t(TranslationKeys.profile_updated_successfully)}</Text>
        //         </View>
        //     }
        // })
        dispatch(setToastData({
            isShowToast: true,
            message: t(TranslationKeys.profile_updated_successfully)
        }))
        setTimeout(() => {
            setIsBtnDisable(false)
            navigation.goBack()
        }, 800);
    }

    const changeChatLanguageApiCall = () => {
        getAsyncStorageData(AppStrings.selected_language).then(res => {
            i18n.changeLanguage(res)
            const data = new FormData()
            data.append("language_preference", res)
            dispatch(changeChatLanguage(data)).unwrap().then(res => {
            }).catch(e => { })
        })
    }

    const {
        handleChange,
        handleSubmit,
        values,
        errors,
        touched,
        resetForm
    } = useFormik({
        initialValues: { userName: userDetail?.name ?? '', email: userDetail?.email ?? '' },
        enableReinitialize: true,
        validationSchema: UserNameValidationSchema,
        onSubmit: (values) => {
            setIsBtnDisable(true)
            const data = new FormData()
            if (values.userName != userDetail?.name) {
                data.append("name", values.userName)
            }
            if (values.email != userDetail?.email) {
                data.append("email", values.email)
            }
            if (selectedImage && selectedImage?.uri && selectedImage?.uri !== userDetail?.profilePic) {
                data.append("profile_pic", selectedImage)
            }
            const params = {
                rider_id: userDetail?.id,
                formData: data
            }
            if (isEmptyArray(data.getParts())) {
                // changeChatLanguageApiCall()
                showToast();
            } else {
                focus && dispatch(updateRiderDetials(params)).unwrap().then((res) => {
                    // changeChatLanguageApiCall()
                    showToast();
                }).catch((error) => {
                    setIsBtnDisable(false)
                })
            }
        }
    });

    const handleSwitchLanguage = (id: string) => {
        dispatch(setGlobalLang(id))
        setSelectedLanguage(id)
        setLangCode(id)
        setIsShowSwitchLanguageModel(false)
        setAsyncStorageData(AppStrings.selected_language, id)
        changeChatLanguageApiCall()
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


    const handleChooseImage = async () => {
        const image: Asset | undefined = await handleChooseImageFromGallery();
        if (image) {
            setImageProfilePopup(false)
            const selectedImage: ImageProps = {
                uri: image.uri,
                name: image.fileName,
                type: image.type
            }
            setImageError(false)
            setSelectedImage(selectedImage);
        } else {
            AppAlert(t(TranslationKeys.error_txt), t(TranslationKeys.something_went_wrong))
        }
    };

    return (
        <View style={GlobalStyle.container}>
            {isLoading ? <CustomActivityIndicator /> : null}
            <CustomHeader title={t(TranslationKeys.edit_profile)} onPress={() => {
                if (navigation?.getId() == "DrawerStack") {
                    navigation.openDrawer()
                } else {
                    navigation.goBack()
                }
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
            />
            <KeyboardAwareScrollView ref={keyBoardAvoidingRef} showsVerticalScrollIndicator={false} enableAutomaticScroll keyboardOpeningTime={Number.MAX_SAFE_INTEGER} bounces={false}>
                <CustomContainer>
                    <View style={[GlobalStyle.centerContainer, Styles.profileImageContainerStyle]}>
                        <FastImage source={(selectedImage?.uri && !imageError) ? { uri: selectedImage.uri } : ImagesPaths.EMPTY_IMAGE}
                            style={Styles.profilePictureContainer}
                            resizeMode={'cover'}
                            onError={() => {
                                setImageError(true)
                            }}
                        />
                        <TouchableOpacity style={Styles.editProfileImageBtnStyle} onPress={() => setImageProfilePopup(true)}>
                            <Image source={ImagesPaths.IMAGE_PICKER} style={Styles.ImagePickerIcon} />
                        </TouchableOpacity>
                    </View>
                    <Text style={Styles.textInputLabelText}>{t(TranslationKeys.name)}</Text>
                    <CustomTextInput maxLength={50} value={values.userName} onChangeText={handleChange('userName')} placeholder={t(TranslationKeys.enter_name)} />
                    {(touched.userName && errors.userName) ? <CommonErrorText title={errors.userName} /> : null}
                    <Text style={Styles.textInputLabelText}>{t(TranslationKeys.email)}</Text>
                    <CustomTextInput value={values.email} onChangeText={handleChange('email')} placeholder={`${t(TranslationKeys.enter_email_address)} (${t(TranslationKeys.optional)}) `} />
                    {(touched.email && errors.email) ? <CommonErrorText title={errors.email} /> : null}
                    <Text style={[Styles.textInputLabelText, {
                        marginBottom: 0
                    }]}>{t(TranslationKeys.mobileno)}</Text>
                    <CustomPhoneTextInput
                        iscountryshow={true}
                        selectedCountry={cc?.replace('+', '')}
                        textInputStyle={{
                            color: colors.PRIMARY_TEXT,
                            textAlign: locale ? 'right' : 'left'
                        }}
                        countryPickerDisable={true}
                        editable={false}
                        value={userDetail?.phoneNumber?.replace('+' + cc, '')} />
                    <CommonDocumentUploadButton
                        title={t(TranslationKeys.update_document_details)}
                        label={t(TranslationKeys.documents)}
                        titleStyle={Styles.documentUploadTitleText}
                        style={Styles.documentUploadBtnContainer}
                        onPress={() => {
                            navigation.navigate('DocumentListScreen', { documentType: t(TranslationKeys.update_document_details), documentTitle: t(TranslationKeys.update_document_details) })
                        }}
                    />
                </CustomContainer>
            </KeyboardAwareScrollView>

            <ReactNativeModal
                isVisible={imageProfilePopup}
                animationIn={'slideInLeft'}
                animationOut={'slideOutRight'}
                onBackdropPress={() => setImageProfilePopup(false)}
                onBackButtonPress={() => setImageProfilePopup(false)}>
                <View style={Styles.imagePickOptContainer}>
                    <Text style={Styles.imagePickOptTitle}>{t(TranslationKeys.select_image)}</Text>
                    <TouchableOpacity onPress={() => {
                        setImageProfilePopup(false)
                        if (Platform.OS == 'android') {
                            requestCameraPermission(t).then(async res => {
                                const devices = Camera.getAvailableCameraDevices();
                                if (devices.length === 0) {
                                    Alert.alert(t(TranslationKeys.message), t(TranslationKeys.this_device_not_support_camera));
                                    return;
                                }
                                if (res) {
                                    // if (props?.limit && props?.image?.length >= props?.limit) {
                                    //     AppAlert(t(TranslationKeys.warning), `${t(TranslationKeys.you_can_only_allow_upload)} ${props?.limit} ${t(TranslationKeys.images_at_a_time)}`)
                                    // } else {
                                    //     // handleCapturePhotofromCamera().then(res => {
                                    //     //     props?.setImage([...props?.image, {
                                    //     //         name: res?.fileName ?? '',
                                    //     //         uri: res?.uri ?? " ",
                                    //     //         type: res?.type ?? ''
                                    //     //     }])
                                    setTimeout(() => {
                                        setIsClickOnCamera(true)
                                    }, 200);
                                    // }
                                }
                            })
                        } else {
                            const devices = Camera.getAvailableCameraDevices();
                            if (devices.length === 0) {
                                Alert.alert(t(TranslationKeys.message), t(TranslationKeys.this_device_not_support_camera));
                                return;
                            }
                            // if (props?.limit && props?.image?.length >= props?.limit) {
                            //     AppAlert(t(TranslationKeys.warning), `${t(TranslationKeys.you_can_only_allow_upload)} ${props?.limit} ${t(TranslationKeys.images_at_a_time)}`)
                            // } else {
                            //     // handleCapturePhotofromCamera().then(res => {
                            //     //     props?.setImage([...props?.image, {
                            //     //         name: res?.fileName ?? '',
                            //     //         uri: res?.uri ?? " ",
                            //     //         type: res?.type ?? ''
                            //     //     }])
                            setTimeout(() => {
                                setIsClickOnCamera(true)
                            }, 500);
                            // }
                        }
                    }}>
                        <Text style={Styles.imagePickOptText}>{t(TranslationKeys['take_photo...'])}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                        // setImageProfilePopup(false)
                        handleChooseImage()
                    }}>
                        <Text style={Styles.imagePickOptText}>{t(TranslationKeys.choose_from_gallery)}</Text>
                    </TouchableOpacity>
                </View>

            </ReactNativeModal>
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
            <CustomBottomBtn
                title={t(TranslationKeys.update_changes)}
                disabled={isBtnDisable}
                onPress={() => handleSubmit()}
            />
            <Modal visible={isClickOnCamera} onRequestClose={() => { setIsClickOnCamera(false) }}>
                <CustomCameraPickerComponent
                    isProfile={true}
                    onConfirmCaptureImage={(image) => {
                        const parts = image?.uri?.split('/') ?? "";
                        const fileName = parts[parts?.length - 1];
                        const fileExtension = fileName?.split('.').pop();
                        const selectedImage: ImageProps = {
                            name: image?.uri?.split('/').pop() ?? '',
                            type: `image/${fileExtension}`,
                            uri: image?.uri ?? ''
                        }
                        setImageError(false)
                        setSelectedImage(selectedImage);
                        setIsClickOnCamera(false)
                    }} closeHandler={() => { setIsClickOnCamera(false) }} />
            </Modal>
        </View>
    );
};

export default EditProfileScreen;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        profilePictureContainer: {
            width: wp(22),
            height: wp(22),
            resizeMode: 'cover',
            borderRadius: wp(22)
        },
        ImagePickerIcon: {
            width: wp(8),
            height: wp(8),
            resizeMode: 'contain',
        },
        imagePickOptContainer: {
            backgroundColor: 'white',
            borderRadius: wp(5),
            paddingHorizontal: wp(4),
            paddingVertical: wp(2)
        },
        imagePickOptText: {
            fontSize: FontSizes.FONT_SIZE_13,
            color: colors.SHADOW_3,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            marginVertical: wp(3),
            textAlign: 'left'
        },
        imagePickOptTitle: {
            fontSize: FontSizes.FONT_SIZE_14,
            color: colors.SHADOW_3,
            fontFamily: Fonts.FONT_POP_BOLD,
            marginVertical: wp(3),
            textAlign: 'left'
        },
        textInputLabelText: {
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
            marginVertical: wp(2),
            textAlign: 'left'
        },
        bottomToastContainer: {
            marginBottom: hp(11),
            backgroundColor: colors.SECONDARY_SHADOW_COLOR,
            padding: wp(2.5),
            borderRadius: wp(3),
            borderColor: colors.TRANSPARENT,
            borderWidth: 1
        },
        bottomToastText: {
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT
        },
        editProfileImageBtnStyle: {
            position: 'absolute',
            right: wp(0),
            top: wp(14),
        },
        profileImageContainerStyle: {
            marginVertical: wp(7),
            width: wp(22),
            height: wp(22),
            borderRadius: wp(22),
            alignSelf: 'center',
            backgroundColor: colors.BOX_PRIMARY_BACKGROUND
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
            marginVertical: wp(2),
            textAlign: 'left'
        },
        languageModalSubtitle: {
            fontSize: FontSizes.FONT_SIZE_13,
            color: colors.SECONDARY_TEXT,
            fontFamily: Fonts.FONT_POP_REGULAR,
            marginBottom: wp(3),
            textAlign: 'left'
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
    });
};
