import React, { Dispatch, SetStateAction, memo, useCallback, useState } from 'react';
import { Alert, FlatList, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Icons } from '../utils/IconsPaths';
import CustomIconButton from './CustomIconButton';
import DocumentPicker, { types } from '@react-native-documents/picker';
import { useAppDispatch, useAppSelector } from '../redux/Store';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FontSizes } from '../styles/FontSizes';
import { Fonts } from '../styles/Fonts';
import { AppAlert } from '../utils/AppAlerts';
import { ImageProps } from '../types/DataTypes';
import FastImage from 'react-native-fast-image';
import { DocumentTypeRegExp } from '../utils/ScreenUtils';
import { deleteDocument, getDocumentFromServer, uploadUserDocument } from '../redux/slice/authSlice/AuthSlice';
import { handleCapturePhotofromCamera, requestCameraPermission } from '../utils/HelperFunctions';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import CustomCameraPickerComponent from './CustomCameraPickerComponent';
import { TranslationKeys } from '../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { Camera } from 'react-native-vision-camera';
import CommonPreviewImage from './CommonPreviewImage';

interface CommonDocumentPickerViewProps {
    image: ImageProps[],
    setImage: Dispatch<SetStateAction<ImageProps[]>>,
    containerStyle?: ViewStyle,
    listContainerStyle?: ViewStyle,
    documentType?: string,
    documentListType?: string,
    limit?: number,
};

export interface serverImageProps {
    id?: number,
    image?: string,
    docType?: string
}

const CommonDocumentPickerView = (props: CommonDocumentPickerViewProps) => {
    const Styles = useStyles();
    const dispatch = useAppDispatch()
    const { useIdentificationDocument } = useAppSelector(state => state.AuthSlice)
    const { colors } = useAppSelector(state => state.CommonSlice);
    const [isClickOnCamera, setIsClickOnCamera] = useState<boolean>(false)
    const { t } = useTranslation();
    const [isOpenPreviewImage, setIsOpenPreviewImage] = useState<{ isOpen: boolean, image: string | undefined }>({ isOpen: false, image: '' })

    const documentSizeConverter = (byte: number | null) => {
        if (byte !== null) {
            return byte / (1024 * 1024)
        } else {
            return null
        }
    }

    const getDocumentDetails = useIdentificationDocument.find(item => item.type == props.documentListType)
    const deleteDocuments = (image: ImageProps & serverImageProps) => {
        let uri = image?.uri ?? image.image;
        let emptyImagesArray
        if (image?.id) {
            emptyImagesArray = props.image.filter(
                (item) => item?.id !== image?.id
            );
            let tempImageArray = getDocumentDetails?.images
            let imageArray = {
                ...tempImageArray, // Spread existing images
                [props.documentListType]: emptyImagesArray // Update specific document list type

            }
            dispatch(getDocumentFromServer(imageArray))
            // dispatch(uploadUserDocument({ ...getDocumentDetails, images: emptyImagesArray }))
        } else {
            emptyImagesArray = props.image.filter(
                (item) => item.uri !== uri
            );
            let tempImageArray = getDocumentDetails?.images
            let imageArray = {
                ...tempImageArray, // Spread existing images
                [props.documentListType]: emptyImagesArray // Update specific document list type

            }
            dispatch(getDocumentFromServer(imageArray))
        }
        props.setImage(emptyImagesArray);
    }

    const handleChooseImage = async () => {
        try {
            await DocumentPicker.pick({
                allowMultiSelection: false,
                presentationStyle: 'fullScreen',
                copyTo: "documentDirectory",
                type: props.documentType === "Profile Picture" || props.documentListType === "CarImages" ? [types.images] : [types.pdf, types.images],
            }).then((res) => {
                const size = documentSizeConverter(res[0].size);
                const fileType = res[0].type;
                if (fileType === "image/webp" || fileType === "image/apng" || fileType === "image/gif" || fileType === "image/avif" || fileType === "image/svg+xml") {
                    AppAlert(
                        `${t(TranslationKeys.oops_cant_upload_file)}`,
                        `${t(TranslationKeys.you_can_only_upload_jpg_jpeg_png_files)}`,
                        () => {
                            handleChooseImage()
                        },
                        () => { }
                    );
                }
                else if (size && size > 10) {
                    AppAlert(
                        `${t(TranslationKeys.oops_file_is_too_large)}`,
                        ` ${t(TranslationKeys.please_select_a_file_size_error)}`,
                        () => {
                            handleChooseImage()
                        },
                        () => { }
                    );
                } else {
                    const tempArray = [...props?.image]
                    tempArray.push({
                        name: res[0].name ? res[0].name : '',
                        uri: res[0].fileCopyUri ?? " ",
                        type: res[0].type ?? ''
                    })
                    props.setImage(tempArray)
                }
            }).catch((error) => {
                console.log("error:", error)
            })
        } catch (error) {
            console.log("error:", error)
        }
    };

    const removeImage = (image: serverImageProps & ImageProps) => {
        let uri = image?.uri ?? image?.image;
        let fileType = "";
        if (uri) {
            fileType = uri?.match(DocumentTypeRegExp) ? t(TranslationKeys.image) : t(TranslationKeys.pdf);
        }
        AppAlert(
            `${t(TranslationKeys.delete)} ${fileType}`,
            `${t(TranslationKeys.are_you_sure_you_want_to_delete)} ${fileType}?`,
            () => {
                if (image?.id) {
                    dispatch(deleteDocument(image?.id)).unwrap()
                        .then(res => {
                            deleteDocuments(image)
                        }).catch(e => {
                            console.log({ e })
                        })
                } else {
                    deleteDocuments(image)
                }
            },
            () => { }
        );
    };

    const RenderImageItem = ({ item, index, onPress }: { item: ImageProps & serverImageProps, index: number, onPress: (item: ImageProps) => void }) => {
        const Styles = useStyles();
        const [imageError, setImageError] = useState<boolean>(false);

        let uri = item?.uri ?? item?.image;

        return (
            <View style={Styles.imageContainerStyle}>
                <CustomIconButton
                    onPress={onPress}
                    icon={Icons.ROUND_CLOSE_ICON}
                    iconStyle={{ tintColor: colors.ERROR_TEXT }}
                    activeOpacity={1}
                    style={Styles.closeIconStyle}
                />
                {
                    uri?.includes('pdf') ?
                        <Text numberOfLines={1} style={Styles.docTypeTxtStyle}>{"PDF"}</Text>
                        :
                        <TouchableOpacity onPress={() => {
                            if (uri && !imageError) {
                                setIsOpenPreviewImage({ isOpen: true, image: uri })
                            }
                        }}>
                            <FastImage onError={() => {
                                setImageError(true)
                            }}
                                source={(uri && !imageError) ? {
                                    uri: uri,
                                    priority: FastImage.priority.high,
                                    cache: FastImage.cacheControl.web
                                } : Icons.EMPTY_IMAGE_ICON}
                                style={(uri && !imageError) ? Styles.imageStyle : Styles.emptyImageStyle
                                }
                            />
                        </TouchableOpacity>
                }
            </View>
        )
    };

    return (
        <View style={[Styles.containerStyle, props.containerStyle]}>
            <TouchableOpacity
                onPress={() => {
                    if (props?.limit && props?.image?.length >= props?.limit) {
                        AppAlert(t(TranslationKeys.warning), `${t(TranslationKeys.you_can_only_allow_upload)} ${props?.limit} ${t(TranslationKeys.images_at_a_time)}`)
                    } else {
                        handleChooseImage()
                    }
                }}
                // disabled={props.limit === props.image.length ? true : false}
                activeOpacity={1}
                style={Styles.dashedViewStyle}>
                <Image
                    source={Icons.DOCUMENT_UPLOAD}
                    style={Styles.cameraIconStyle} />
            </TouchableOpacity>
            <TouchableOpacity
                style={Styles.captureFromCameraContainer}
                onPress={() => {
                    if (Platform.OS == 'android') {
                        requestCameraPermission(t).then(res => {
                            const devices = Camera.getAvailableCameraDevices();
                            if (devices.length === 0) {
                                Alert.alert(t(TranslationKeys.message), t(TranslationKeys.this_device_not_support_camera));
                                return;
                            }
                            if (res) {
                                if (props?.limit && props?.image?.length >= props?.limit) {
                                    AppAlert(t(TranslationKeys.warning), `${t(TranslationKeys.you_can_only_allow_upload)} ${props?.limit} ${t(TranslationKeys.images_at_a_time)}`)
                                } else {
                                    setIsClickOnCamera(true)
                                    // handleCapturePhotofromCamera().then(res => {
                                    //     props?.setImage([...props?.image, {
                                    //         name: res?.fileName ?? '',
                                    //         uri: res?.uri ?? " ",
                                    //         type: res?.type ?? ''
                                    //     }])
                                    // }).catch(e => console.log({ e }))
                                }

                            }
                        })
                    } else {
                        const devices = Camera.getAvailableCameraDevices();
                        if (devices.length === 0) {
                            Alert.alert(t(TranslationKeys.message), t(TranslationKeys.this_device_not_support_camera));
                            return;
                        }
                        if (props?.limit && props?.image?.length >= props?.limit) {
                            AppAlert(t(TranslationKeys.warning), `${t(TranslationKeys.you_can_only_allow_upload)} ${props?.limit} ${t(TranslationKeys.images_at_a_time)}`)
                        } else {
                            setIsClickOnCamera(true)
                            // handleCapturePhotofromCamera().then(res => {
                            //     props?.setImage([...props?.image, {
                            //         name: res?.fileName ?? '',
                            //         uri: res?.uri ?? " ",
                            //         type: res?.type ?? ''
                            //     }])
                            // }).catch(e => console.log({ e }))
                        }
                    }
                }}>
                <Image source={Icons.CAMERA_ICON} style={{ ...useGlobalStyles().commonIconStyle, marginRight: wp(2) }} />
                <Text style={Styles.captureFromCameraText}>{t(TranslationKeys.Capture_from_camera)}</Text>
            </TouchableOpacity>
            <View style={[Styles.imageListContainerStyle, props.listContainerStyle]}>
                <FlatList
                    data={props.image}
                    numColumns={3}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    renderItem={(props) => <RenderImageItem {...props} onPress={() => {
                        removeImage(props.item)
                    }} />}
                />
            </View>
            <Modal visible={isClickOnCamera} onRequestClose={() => { setIsClickOnCamera(false) }}>
                <CustomCameraPickerComponent onConfirmCaptureImage={(image) => {
                    const parts = image?.uri?.split('/') ?? "";
                    const fileName = parts[parts?.length - 1];
                    const fileExtension = fileName?.split('.').pop();
                    props?.setImage([...props?.image, {
                        name: image?.uri?.split('/').pop() ?? '',
                        type: `image/${fileExtension}`,
                        uri: image?.uri ?? ''
                    }])
                    setIsClickOnCamera(false)
                }} closeHandler={() => { setIsClickOnCamera(false) }} />
            </Modal>

            <Modal visible={(isOpenPreviewImage?.isOpen && isOpenPreviewImage?.image !== "")} onRequestClose={() => { setIsOpenPreviewImage({ isOpen: false, image: isOpenPreviewImage?.image }) }}>
                <CommonPreviewImage image={isOpenPreviewImage?.image} onPress={() => {
                    setIsOpenPreviewImage({ isOpen: false, image: isOpenPreviewImage?.image })
                }} />
            </Modal>
        </View>
    );
};



export default CommonDocumentPickerView;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)

    return StyleSheet.create({
        containerStyle: {
            flex: 1,
        },
        dashedViewStyle: {
            borderRadius: wp(2),
            borderStyle: 'dashed',
            borderWidth: wp(0.5),
            borderColor: colors.SECONDARY_DOTTED_BORDER,
            paddingVertical: wp(10),
            alignItems: 'center',
            backgroundColor: colors.SECONDARY_BACKGROUND
        },
        cameraIconStyle: {
            width: wp(15),
            height: wp(15),
            resizeMode: 'contain'
        },
        imageListContainerStyle: {
            marginTop: wp(5),
        },
        imageContainerStyle: {
            backgroundColor: colors.EMPTY_IMAGE_BACKROUND,
            width: wp(26),
            height: wp(26),
            borderRadius: wp(2),
            marginHorizontal: wp(2),
            marginVertical: wp(2.5),
            alignItems: 'center',
            justifyContent: 'center',
        },
        closeIconStyle: {
            position: 'absolute',
            zIndex: 1,
            right: wp(-2.5),
            top: wp(-2.5),
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(5),
            borderColor: colors.SECONDARY_BACKGROUND,
            borderWidth: wp(0.5),
            padding: wp(0.2)
        },
        docTypeTxtStyle: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM,
        },
        imageStyle: {
            width: wp(26),
            height: wp(26),
            resizeMode: 'cover',
            borderRadius: wp(2)
        },
        emptyImageStyle: {
            width: wp(8),
            height: wp(8),
            resizeMode: 'contain',
            borderRadius: wp(2)
        },
        captureFromCameraText: {
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
            marginTop: wp(0.2)
        },
        captureFromCameraContainer: {
            alignSelf: 'center',
            padding: wp(3),
            backgroundColor: colors.SECONDARY_SHADOW_COLOR,
            borderRadius: wp(5),
            flexDirection: 'row',
            marginTop: wp(4),
            borderColor: colors.SECONDARY,
            borderWidth: wp(0.2)
        }
    });
};
