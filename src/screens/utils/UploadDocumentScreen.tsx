import React, { useEffect, useState } from 'react'
import CustomUploadDocumentsTemplate, { valuesProps } from '../../components/CustomUploadDocumentsTemplate';
import { RootStackParamList } from '../../types/RootStackType';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import { getDocumentFromServer, setToastData, updateRiderDetials, updateUserDocument, uploadUserDocument } from '../../redux/slice/authSlice/AuthSlice';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import CommonToastContainer from '../../components/CommonToastContainer';
import { useToast } from 'native-base';
import { isEmptyArray } from 'formik';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { AppAlert } from '../../utils/AppAlerts';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { ImageProps } from '../../types/DataTypes';


const UploadDocumentScreen = () => {
    type NestedScreenRouteProp = RouteProp<RootStackParamList, 'UploadDocumentScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const { documentDetails, routeName, isNotGoingUnderReview } = route.params;
    const dispatch = useAppDispatch();
    const navigation = useCustomNavigation('UploadDocumentScreen')
    const toast = useToast();
    const { userDetail, isLoading } = useAppSelector(state => state.AuthSlice)
    const { t } = useTranslation();
    const [isBtnDisable, setIsBtnDisable] = useState(false)

    const showToast = () => {
        // toast.show({
        //     duration: 700,
        //     render: () => {
        //         return <CommonToastContainer title={t(TranslationKeys.document_uploaded_successfully)} />
        //     }
        // })
        dispatch(setToastData({
            isShowToast: true,
            message: t(TranslationKeys.document_uploaded_successfully)
        }))
        setTimeout(() => {
            setIsBtnDisable(false)
            navigation.goBack()
        }, 800);
    }

    // ** Append Images in formadata
    const appendImages = (key: string, images: ImageProps[] | undefined, data: FormData) => {
        images?.forEach(item => {
            if (item?.uri) {
                data.append(key, item);
            }
        });
    };

    return (
        <>
            {isLoading ? <CustomActivityIndicator /> : null}
            <CustomUploadDocumentsTemplate data={documentDetails}
                disabled={isBtnDisable}
                onPress={(image, item, panCardImages) => {
                    setIsBtnDisable(true)
                    if (routeName) {
                        if (documentDetails?.type == "aadhaarCard" && image?.length != 2) {
                            setIsBtnDisable(false)
                            AppAlert(t(TranslationKeys.note), t(TranslationKeys.kindly_upload_images_of_both_sides_of_your_aadhaar_card));
                            return;
                        }
                        if (documentDetails?.type == "bankAccountImage" && panCardImages?.length == 0 && !isNotGoingUnderReview) {
                            setIsBtnDisable(false)
                            AppAlert(t(TranslationKeys.note), t(TranslationKeys.kindly_upload_pan_image_alert_msg));
                            return;
                        }
                        const data = new FormData();
                        switch (documentDetails?.type) {
                            case "aadhaarCard":
                                appendImages("aadhaar_card", image, data);
                                data.append("aadhaar_card_number", item?.aadhaarCardNumber);
                                break;
                            case "bankAccountImage":
                                appendImages("bank_account_image", image, data);
                                appendImages("pan_card_image", panCardImages, data);
                                data.append("upi_id", item?.upiId);
                                data.append("bank_name", item?.bankName);
                                data.append("account_number", item?.accountNumber);
                                data.append("ifsc_code", item?.ifscCode);
                                data.append("name_of_bank_owner", item?.bankAccountOwnerName);
                                data.append("rider_pancard_number", item?.panCardNumber);
                                data.append("currentAddress", item?.bankAccountOwnerAddress);
                                break;
                            case "passport":
                                appendImages("PASSPORT", image, data);
                                data.append("passport_number", item?.passportNumber);
                                break;
                            default:
                                break
                        }
                        if (userDetail?.id && !isEmptyArray(data.getParts())) {
                            let params
                            if (documentDetails?.type == "bankAccountImage") {
                                params = {
                                    rider_id: userDetail?.id,
                                    formData: data,
                                    document_updated: true
                                }
                            } else {
                                params = {
                                    rider_id: userDetail?.id,
                                    formData: data,
                                }
                            }

                            dispatch(updateRiderDetials(params)).unwrap().then((res) => {
                                dispatch(getDocumentFromServer(res?.riderDocument));
                                const docPayload = { ...documentDetails, images: res?.riderDocument };
                                if (documentDetails?.type == "passport") {
                                    dispatch(uploadUserDocument({ ...docPayload, passport_number: res.passportNumber }));
                                } else if (documentDetails?.type == "aadhaarCard") {
                                    dispatch(uploadUserDocument({ ...docPayload, aadhaar_card_number: res.aadhaarCardNumber }));
                                } else if (documentDetails?.type == "bankAccountImage") {
                                    dispatch(uploadUserDocument({
                                        ...docPayload,
                                        images: res?.riderDocument,
                                        upiId: res.upiId,
                                        accountNumber: res.accountNumber,
                                        bankName: res.bankName,
                                        ifscCode: res.ifscCode,
                                        nameOfBankOwner: res.nameOfBankOwner,
                                        panCardImage: res?.riderDocument?.panCardImage,
                                        riderPancardNumber: res.riderPancardNumber,
                                        addressOfbankOwner: res.addressOfBankOwner,
                                        isSubmit: true
                                    }));
                                }
                                showToast();
                            }).catch((error) => {
                                console.log("🚀  file: UploadDocumentScreen.tsx:62  dispatch ~ error:", error);
                                setIsBtnDisable(false)
                            });
                        } else {
                            navigation.goBack();
                        }
                    } else {
                        showToast();
                    }
                }} />

        </>
    )
}

export default UploadDocumentScreen;
