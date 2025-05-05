import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { heightPercentageToDP, heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import useCustomNavigation from '../hooks/useCustomNavigation';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppSelector } from '../redux/Store';
import CustomHeader from './CustomHeader';
import { Icons } from '../utils/IconsPaths';
import CustomContainer from './CustomContainer';
import CommonDocumentPickerView, { serverImageProps } from './CommonDocumentPickerView';
import CustomBottomBtn from './CustomBottomBtn';
import { FontSizes } from '../styles/FontSizes';
import { Fonts } from '../styles/Fonts';
import { ImageProps } from '../types/DataTypes';
import CustomTextInput from './CustomTextInput';
import * as  yup from 'yup'
import { useFormik } from 'formik';
import CommonErrorText from './CommonErrorText';
import { AadharCardRegx, PanNumberRegExp, PassportRegX, UPIIdRegExp } from '../utils/ScreenUtils';
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../localization/TranslationKeys';
import { UserDocobj } from '../utils/Constats';

interface CustomUploadDocumentsTemplateProps {
    disabled: boolean
    data: DocumentListProps | undefined,
    onPress: (images: ImageProps[] | undefined, values: valuesProps, panCardImage?: ImageProps[] | undefined) => void,
}

export interface DescriptionProps {
    id: number;
    title: string;
};

export interface DocumentListProps {
    id: number;
    documentType: string;
    documentTitle: string;
    description: DescriptionProps[];
    attachDocumentTitle: string;
    isSubmit?: boolean;
    rounteName?: string;
    aadhaar_card_number?: string
    passport_number?: string
    images: ImageProps[] | undefined,
    limit: number | undefined,
    driverLicenseNumber?: string,
    dateOfBirth?: string | Date,
    driverLicenseExpiryDate?: string | Date,
    documentListtype?: string,
    type?: string;
    reason?: string,
    upiId?: string,
    bankName?: string,
    accountNumber?: '',
    bankAccountOwnerName?: '',
    bankAccountOwnerAddress?: ''
    ifscCode?: '',
    panCardNo?: '',
    panCardImage?: ImageProps[] | undefined,
};

export interface valuesProps {
    aadhaarCardNumber?: string | undefined;
    passportNumber?: string | undefined;
    upiId?: string | undefined;
    bankName?: string | undefined;
    accountNumber?: string | undefined;
    bankAccountOwnerName?: string | undefined;
    ifscCode?: string | undefined;
    panCardNumber?: string | undefined;
    profile?: string | undefined;
    bankAccountOwnerAddress?: string | undefined;
}

const CustomUploadDocumentsTemplate = (props: CustomUploadDocumentsTemplateProps) => {
    const Globalstyle = useGlobalStyles();
    const Styles = useStyle();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const navigation = useCustomNavigation('AuthStack');
    const [images, setImages] = useState<ImageProps[]>(props.data?.images[props.data?.type] ?? []);
    const { userDetail } = useAppSelector(state => state.AuthSlice)
    const { t } = useTranslation();
    const [panCardImages, setPanCardImages] = useState<ImageProps[]>(props?.data?.images['panCardImage'] ?? []);
    const [textInputFocus, setTextInputFocus] = useState(false);
    const panCardNumberRef = useRef<KeyboardAwareScrollView | null>(null)

    const adharCardSchema = yup.object({
        aadhaarCardNumber: yup.string().trim().required(`${t(TranslationKeys.please)} ${t(TranslationKeys.enter_your_adhar_card_no)}`).matches(AadharCardRegx, t(TranslationKeys.please_enter_valid_aadhar_card_number)),
    });

    const passportSchema = yup.object({
        passportNumber: yup.string().trim().required(`${t(TranslationKeys.please)} ${t(TranslationKeys.enter_your_passport_no)}`).matches(PassportRegX, t(TranslationKeys.please_enter_passport_number)),
    });

    const bankAccountSchema = yup.object({
        upiId: yup.string().trim().matches(UPIIdRegExp, t(TranslationKeys.please_enter_valid_upiId)).nullable(),
        // .required(`${t(TranslationKeys.please)} ${t(TranslationKeys.enter_upi_id)}`)
        bankName: yup.string().trim(),
        // .required(`${t(TranslationKeys.please)} ${t(TranslationKeys.enter_bank_name)}`),
        accountNumber: yup.string().trim(),
        // .required(`${t(TranslationKeys.please)} ${t(TranslationKeys.enter_account_number)}`),
        bankAccountOwnerName: yup.string().trim(),
        // .required(`${t(TranslationKeys.please)} ${t(TranslationKeys.enter_account_holder_name)}`),
        bankAccountOwnerAddress: yup.string().trim(),
        // .required(`${t(TranslationKeys.please)} ${t(TranslationKeys.enter_account_holder_address)}`),
        ifscCode: yup.string().trim(),
        // .required(`${t(TranslationKeys.please)} ${t(TranslationKeys.enter_ifsce_code)}`),
        panCardNumber: yup.string().trim().matches(PanNumberRegExp, t(TranslationKeys.valid_pan_number)).nullable(),
        // .required(`${t(TranslationKeys.please)} ${t(TranslationKeys.enter_pan_card)}`),
    });

    const assignValidatinSchema = (documentType?: string) => {
        switch (documentType) {
            case UserDocobj.bankAccountImage:
                return {
                    schema: bankAccountSchema,
                    initialValue: {
                        upiId: userDetail?.upiId ?? '',
                        bankName: userDetail?.bankName ?? '',
                        accountNumber: userDetail?.accountNumber ?? '',
                        bankAccountOwnerName: userDetail?.nameOfBankOwner ?? '',
                        bankAccountOwnerAddress: userDetail?.addressOfBankOwner ?? '',
                        ifscCode: userDetail?.ifscCode ?? '',
                        panCardNumber: userDetail?.riderPancardNumber ?? '',
                    }
                }
            case UserDocobj.aadharCard:
                return {
                    schema: adharCardSchema,
                    initialValue: {
                        aadhaarCardNumber: userDetail?.aadhaarCardNumber ?? ''
                    }
                }
            case UserDocobj.passport:
                return {
                    schema: passportSchema,
                    initialValue: {
                        passportNumber: userDetail?.passportNumber ?? ''
                    }
                }

            default:
                return {
                    schema: yup.object({
                        profile: yup.string().trim(),
                    }),
                    initialValue: {
                        profile: ''
                    }
                }
        }
    }

    const {
        handleChange,
        handleSubmit,
        values,
        errors,
        touched,
        resetForm
    } = useFormik({
        initialValues: assignValidatinSchema(props.data?.documentType).initialValue,
        enableReinitialize: true,
        validationSchema: assignValidatinSchema(props.data?.documentType).schema,
        onSubmit: (values) => {
            props.onPress(images, values, panCardImages)
        }
    });

    useEffect(() => {
        if (!textInputFocus && (errors.aadhaarCardNumber || errors.panCardNumber)) {
            panCardNumberRef.current?.scrollToEnd(true)
        }
    }, [errors])


    return (
        <View style={Globalstyle.container}>
            <CustomHeader title={t(props.data?.documentTitle ?? '')} onPress={() => navigation.goBack()} />
            <KeyboardAwareScrollView showsVerticalScrollIndicator={false} enableOnAndroid extraScrollHeight={heightPercentageToDP(18)} bounces={false}>
                <View style={Styles.descriptionContainer}>
                    {props.data?.description?.map(item =>
                        <View style={[Globalstyle.rowContainer, Styles.rowContainer]} >
                            <Image source={Icons.CHECKBOX} style={Styles.iconStyle} />
                            <Text style={Styles.descriptionText}>{t(item?.title)}</Text>
                        </View>
                    )}
                </View>
                <View style={Styles.sepratorLine} />
                <CustomContainer>
                    <Text style={Styles.attachDocumentText}>{t(props.data?.attachDocumentTitle ?? "")}</Text>
                    <CommonDocumentPickerView image={images} setImage={setImages} limit={props.data?.limit} documentListType={props.data?.documentListtype} />
                    {props?.data?.documentType == UserDocobj.aadharCard ?
                        <>
                            <Text style={Styles.warningText}>{t(TranslationKeys.enter_your_adhar_card_no)}</Text>
                            <CustomTextInput maxLength={12} placeholder={t(TranslationKeys.Aadhaar_number)} isError={(errors.aadhaarCardNumber && touched.aadhaarCardNumber)} keyboardType='number-pad' value={values.aadhaarCardNumber} onChangeText={handleChange('aadhaarCardNumber')} />
                            {(errors.aadhaarCardNumber && touched.aadhaarCardNumber) ? <CommonErrorText title={errors.aadhaarCardNumber} /> : null}
                        </>
                        : null
                    }
                    {props?.data?.documentType == UserDocobj.passport ?
                        <>
                            <Text style={Styles.warningText}>{t(TranslationKeys.enter_your_passport_no)}</Text>
                            <CustomTextInput placeholder={t(TranslationKeys.passport_number)} isError={(errors.passportNumber && touched.passportNumber)} value={values.passportNumber} onChangeText={handleChange('passportNumber')} />
                            {(errors.passportNumber && touched.passportNumber) ? <CommonErrorText title={errors.passportNumber} /> : null}
                        </>
                        : null
                    }
                    {props?.data?.documentType == UserDocobj.bankAccountImage ?
                        <>
                            <Text style={Styles.warningText}>{t(TranslationKeys.enter_upi_id)}</Text>
                            <CustomTextInput
                                placeholder={t(TranslationKeys.enter_upi_id)}
                                value={values.upiId}
                                onChangeText={handleChange('upiId')}
                                onFocus={() => setTextInputFocus(true)}
                                onBlur={() => { setTextInputFocus(false) }}
                                isError={(errors.upiId && touched.upiId)}
                            />
                            {(errors.upiId && touched.upiId) ? <CommonErrorText title={errors.upiId} /> : null}

                            <Text style={Styles.warningText}>{t(TranslationKeys.enter_bank_name)}</Text>
                            <CustomTextInput
                                placeholder={t(TranslationKeys.enter_bank_name)}
                                value={values.bankName}
                                onChangeText={handleChange('bankName')}
                                onFocus={() => setTextInputFocus(true)}
                                onBlur={() => { setTextInputFocus(false) }}
                                isError={(errors.bankName && touched.bankName)}
                            />
                            {(errors.bankName && touched.bankName) ? <CommonErrorText title={errors.bankName} /> : null}

                            <Text style={Styles.warningText}>{t(TranslationKeys.enter_account_number)}</Text>
                            <CustomTextInput
                                placeholder={t(TranslationKeys.enter_account_number)}
                                value={values.accountNumber}
                                onChangeText={handleChange('accountNumber')}
                                onFocus={() => setTextInputFocus(true)}
                                onBlur={() => { setTextInputFocus(false) }}
                                isError={(errors.accountNumber && touched.accountNumber)}
                            />
                            {(errors.accountNumber && touched.accountNumber) ? <CommonErrorText title={errors.accountNumber} /> : null}

                            <Text style={Styles.warningText}>{t(TranslationKeys.enter_ifsce_code)}</Text>
                            <CustomTextInput
                                placeholder={t(TranslationKeys.enter_ifsce_code)}
                                value={values.ifscCode}
                                onChangeText={handleChange('ifscCode')}
                                onFocus={() => setTextInputFocus(true)}
                                onBlur={() => { setTextInputFocus(false) }}
                                isError={(errors.ifscCode && touched.ifscCode)}
                            />
                            {(errors.ifscCode && touched.ifscCode) ? <CommonErrorText title={errors.ifscCode} /> : null}

                            <Text style={Styles.warningText}>{t(TranslationKeys.enter_account_holder_name)}</Text>
                            <CustomTextInput
                                placeholder={t(TranslationKeys.enter_account_holder_name)}
                                value={values.bankAccountOwnerName}
                                onChangeText={handleChange('bankAccountOwnerName')}
                                onFocus={() => setTextInputFocus(true)}
                                onBlur={() => { setTextInputFocus(false) }}
                                isError={(errors.bankAccountOwnerName && touched.bankAccountOwnerName)}
                            />
                            {(errors.bankAccountOwnerName && touched.bankAccountOwnerName) ? <CommonErrorText title={errors.bankAccountOwnerName} /> : null}

                            {/* <Text style={Styles.warningText}>{t(TranslationKeys.enter_account_holder_address)}</Text>
                            <CustomTextInput
                                placeholder={t(TranslationKeys.enter_account_holder_address)}
                                value={values.bankAccountOwnerAddress}
                                onChangeText={handleChange('bankAccountOwnerAddress')}
                                onFocus={() => setTextInputFocus(true)}
                                onBlur={() => { setTextInputFocus(false) }}
                            />
                            {(errors.bankAccountOwnerAddress && touched.bankAccountOwnerAddress) ? <CommonErrorText title={errors.bankAccountOwnerAddress} /> : null} */}

                            <Text style={Styles.warningText}>{t(TranslationKeys.attach_pancard)}</Text>
                            <CommonDocumentPickerView documentType={props.data?.documentType} image={panCardImages} setImage={setPanCardImages} limit={props?.data?.limit} />
                            <Text style={[Styles.warningText, { fontSize: FontSizes.FONT_SIZE_15, paddingVertical: wp(1.5) }]}>{t(TranslationKeys.enter_pan_card)}</Text>
                            <CustomTextInput autoCapitalize='characters' isError={(errors.panCardNumber && touched.panCardNumber)} placeholder={t(TranslationKeys.enter_pan_card)} value={values.panCardNumber?.toUpperCase()} onChangeText={handleChange('panCardNumber')} />
                            {(errors.panCardNumber && touched.panCardNumber) ? <CommonErrorText title={errors.panCardNumber} /> : null}
                        </> : null
                    }
                    {props.data?.documentType === UserDocobj.panCard ?
                        <>
                            <Text style={[Styles.warningText, { fontSize: FontSizes.FONT_SIZE_15, paddingVertical: wp(1.5) }]}>{t(TranslationKeys.enter_pan_card)}</Text>
                            <CustomTextInput
                                autoCapitalize='characters'
                                placeholder={t(TranslationKeys.enter_pan_card)}
                                value={values.panCardNumber?.toUpperCase()}
                                onChangeText={handleChange('panCardNumber')}
                                onFocus={() => setTextInputFocus(true)}
                                onBlur={() => { setTextInputFocus(false) }}
                                isError={(errors.panCardNumber && touched.panCardNumber)}
                            />
                            {(errors.panCardNumber && touched.panCardNumber) ? <CommonErrorText title={errors.panCardNumber} /> : null}
                        </>
                        : null}
                </CustomContainer>
            </KeyboardAwareScrollView>
            <CustomBottomBtn title={t(TranslationKeys.save) + " " + t(props.data?.documentTitle ?? "")}
                onPress={() => {
                    handleSubmit()
                }} disabled={(props.data?.documentType === UserDocobj.bankAccountImage ? (images?.length == 0 && panCardImages?.length == 0) : images?.length == 0 || props.disabled)} style={{ backgroundColor: (props.data?.documentType === UserDocobj.bankAccountImage ? (images?.length == 0 && panCardImages?.length == 0) : images?.length == 0 || props.disabled) ? colors.DISABLE_BUTTON : colors.PRIMARY }} />
        </View>
    );
}

export default CustomUploadDocumentsTemplate;

const useStyle = () => {
    const { colors } = useAppSelector(state => state.CommonSlice);

    return StyleSheet.create({
        descriptionContainer: {
            margin: wp(5)
        },
        rowContainer: {
            marginVertical: wp(1.5),
            alignItems: 'flex-start',
        },
        iconStyle: {
            width: wp(6),
            height: wp(6),
            resizeMode: 'contain',
            borderRadius: wp(5),
            marginRight: wp(3)
        },
        descriptionText: {
            fontSize: FontSizes.FONT_SIZE_13,
            fontFamily: Fonts.FONT_POP_REGULAR,
            color: colors.SECONDARY_TEXT,
            flex: 1,
            textAlign: 'left'
        },
        sepratorLine: {
            height: wp(0.5),
            backgroundColor: colors.SHADOW_1
        },
        attachDocumentText: {
            fontSize: FontSizes.FONT_SIZE_17,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
            marginTop: wp(6),
            marginBottom: wp(2),
            textAlign: 'left'
        },
        addImageIconStyle: {
            width: wp(15),
            height: wp(15),
            tintColor: colors.PRIMARY_TEXT,
            alignSelf: 'center',
        },
        addImageContainer: {
            borderStyle: 'dashed',
            borderColor: colors.SECONDARY_TEXT,
            borderWidth: wp(0.5),
            paddingVertical: wp(10),
            borderRadius: wp(2)
        },
        warningText: {
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
            paddingVertical: wp(1.5),
            textAlign: 'left'
        },
        datepickerIconStyle: {
            width: wp(7),
            height: wp(7),
            resizeMode: 'contain',
            tintColor: colors.PRIMARY,
        },
        datepickerContainer: {
            backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
            marginBottom: wp(7)
        },
        lableTxtStyle: {
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
            marginTop: wp(3),
        },
        drivingLicenseSepratorLine: {
            marginTop: wp(7),
            marginBottom: wp(3)
        },
        toastContainerStyle: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            padding: wp(2.5),
            borderRadius: wp(3),
            borderColor: colors.SHADOW_1,
            borderWidth: 1,
            marginBottom: wp(20),
        },
        toastTxtStyle: {
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT
        },
        datePickerTitleText: {
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_REGULAR,
            color: colors.PRIMARY_TEXT
        }
    });
};