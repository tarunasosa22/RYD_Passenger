import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { useGlobalStyles } from '../../hooks/useGlobalStyles'
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import CustomHeader from '../../components/CustomHeader';
import CustomContainer from '../../components/CustomContainer';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CustomCheckBox from '../../components/CustomCheckBox';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import CustomTextInput from '../../components/CustomTextInput';
import CustomBottomSheet from '../../components/CustomBottomSheet';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet';
import { Icons } from '../../utils/IconsPaths';
import CustomPrimaryButton from '../../components/CustomPrimaryButton';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import CommonErrorText from '../../components/CommonErrorText';
import { cancelRide, resetRideOtpReducer, setRideDetailsData, setRideStatusReducer } from '../../redux/slice/rideSlice/RideSlice';
import { RootStackParamList } from '../../types/RootStackType';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { resetRideDetails, setPaymentMethod } from '../../redux/slice/homeSlice/HomeSlice';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { RIDE_STATUS, Reasons } from '../../utils/Constats';
import { ANALYTICS_ID } from '../../utils/AnalyticsStringID';
import analytics from '@react-native-firebase/analytics';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView } from 'react-native';
import { StatusBar } from 'react-native';
import { Platform } from 'react-native';
import { ScrollView } from 'react-native';
import { RIDE_DETAILS } from '../../config/Host';
import i18n from '../../localization/i18n';
import { current } from '@reduxjs/toolkit';

export interface ReasonsTypes {
    id?: number,
    title: string
    reason: string
};

interface ModalTypes {
    modalVisible: boolean,
    type: string,
};

const CancelTaxiScreen = () => {

    const GlobalStyle = useGlobalStyles();
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const styles = useStyles();
    const [cancellationsReason, setCancellationsReason] = useState<string>('');
    const [showErrorText, setShowErrorText] = useState<boolean>(false);
    const [reasons, setReasons] = useState<ReasonsTypes[]>(Reasons)
    const [selectedReason, setSelectedReason] = useState<ReasonsTypes | undefined>(undefined);
    const navigation = useCustomNavigation('CancelTaxiScreen')
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['42%'], []);
    const dispatch = useAppDispatch();
    const { isLoading , rideDetails} = useAppSelector(state => state.RideSlice)
    const { tokenDetail } = useAppSelector(state => state.AuthSlice)
    type NestedScreenRouteProp = RouteProp<RootStackParamList, 'CancelTaxiScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const { id } = route.params;
    const { t } = useTranslation();
    const focus = useIsFocused()
    const [modalVisible, setModalVisible] = useState<ModalTypes>({
        modalVisible: false,
        type: ''
    })
    const isRideCancel = useRef(null)

    const url = `${RIDE_DETAILS}${id}/`
    const ws = useRef<WebSocket>();

    useEffect(() => {
        if (!selectedReason && selectedReason?.reason == undefined) {
            connectionInit()
        }
        return () => {
            if(ws?.current){
                ws?.current?.close()
            }
            setModalVisible({
                modalVisible: false,
                type: ''
            })
        }
    }, [])

    const connectionInit = () => {
        ws.current = new WebSocket(url, null, {
            headers: {
                Authorization: `Token ${tokenDetail?.authToken}`,
                "Accept-Language": i18n.language
            }
        })

        ws.current.onopen = () => {
            console.log("CONNECTION OPEN");
        }

        ws?.current?.addEventListener("error", (erorr) => {
            console.log("CONNECTION ERROR", erorr.message, erorr);
            // if (ws?.readyState == SOCKET_STATUS.CLOSED && networkStatus) {
            //     setTimeout(() => {
            //         connectionInit()
            //     }, 2000);
            // }
        })

        ws?.current?.addEventListener("open", () => {
            console.log("CONNECTION OPEN");
        })

        ws?.current?.addEventListener("close", () => {
            console.log("CONNECTION CLOSE");
            // if (focus && navigation.getId() == "TrackDriverScreen") {
            //     setTimeout(connectionInit, 2000);
            // }
        })

        ws?.current?.addEventListener('message', (message) => {
            const msgDetails = JSON.parse(message.data)
            const { rideBooking } = msgDetails

            if (rideBooking?.rideStatus === RIDE_STATUS.CANCELLED) {
                // setIsVisibleWaitingPaymentModal(false)
                // dispatch(resetRideOtpReducer())
                dispatch(setRideDetailsData(rideBooking))
                dispatch(setRideStatusReducer(undefined))
                setModalVisible({
                    modalVisible: true,
                    type: 'RideCancel'
                })
            }
        }
        )
    };
console.log("isride",isRideCancel.current)
    const handleClick = () => {
        if(ws?.current){
            ws?.current?.close()
        }
        setTimeout(() => {
            if ((selectedReason && selectedReason?.reason)) {
                setShowErrorText(false)
                const data = new FormData()
                data.append("ride_booking", id)
                if (selectedReason.id == 6) {
                    if (cancellationsReason.length > 255) {
                        setShowErrorText(true)
                        return
                    } else {
                        const reason = cancellationsReason.trim().length !== 0 ? cancellationsReason : selectedReason.reason
                        data.append("reason", reason)
                    }
                } else {
                    data.append("reason", selectedReason.reason)
                }
                let params = {
                    formData: data,
                }
                dispatch(cancelRide(params)).unwrap()
                    .then(res => {
                            ws?.current?.close()
                            console.log("WebSocket connection closed.");
                        analytics().logEvent(ANALYTICS_ID.RIDE_CANCELLED)
                        console.log(res)
                        bottomSheetRef.current?.snapToIndex(0)
                        dispatch(setPaymentMethod("Card"))
                    })
                    .catch(e => {
                    })
            } else {
                setShowErrorText(true)
                setCancellationsReason('')
            }
        },1000)
    };

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                pressBehavior={'none'}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    const renderItem = ({ item, index }: { item: ReasonsTypes, index: number }) => {
        return (
            <CustomCheckBox
                rightIconVisible
                title={t(item?.title)} value={(selectedReason && selectedReason?.id == item.id) ? true : false} onPress={() => {
                    setShowErrorText(false)
                    const params = {
                        id: item.id,
                        reason: item.reason
                    }
                    if (item.id !== 6) {
                        setCancellationsReason("")
                    }
                    setSelectedReason(params)
                }} />
        )
    }

    return (
        <>
            <View style={GlobalStyle.container}>
                {isLoading ? <CustomActivityIndicator /> : null}
                <CustomHeader title={t(TranslationKeys.cancel_taxi)} onPress={() => navigation.goBack()} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : 'padding'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight} // 50 is Button height
                    enabled
                    style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps={'handled'} showsVerticalScrollIndicator={false}>
                        <CustomContainer>
                            <Text
                                numberOfLines={2} style={styles.reasonText}>{t(TranslationKeys.select_cancellations_reason)}</Text>
                            <View>
                                <FlatList
                                    data={reasons}
                                    bounces={false}
                                    renderItem={renderItem}
                                />
                            </View>
                            {selectedReason?.id === 6 ? <>
                                <View style={styles.itemSeperatorLine} />
                                <Text style={styles.textInputLabelText}>{t(TranslationKeys.other)}</Text>
                                <CustomTextInput
                                    placeholder={t(TranslationKeys.enter_your_reason)} multiline
                                    textInputContainerStyle={styles.textInputContainerStyle} value={cancellationsReason}
                                    editable={selectedReason?.id === 6}
                                    returnKeyType={'done'}
                                    isError={showErrorText || cancellationsReason.length > 255}
                                    style={{
                                        maxHeight: wp(40),
                                        minHeight: wp(30)
                                    }}
                                    blurOnSubmit={true}
                                    onChangeText={reason => {
                                        if (reason.length > 255) {
                                            setShowErrorText(true)
                                        } else {
                                            setShowErrorText(false)
                                        }
                                        setCancellationsReason(reason)
                                    }} />
                            </> : null}

                            {showErrorText ? <CommonErrorText
                                style={{ marginBottom: wp(2) }}
                                title={cancellationsReason.length > 255 ? t(TranslationKeys.enter_reason_255) : t(TranslationKeys.please_select_reason_or_enter_a_reason_of_cancellation)} /> : null}
                        </CustomContainer>
                    </ScrollView>
                </KeyboardAvoidingView>
                <CustomBottomBtn title={t(TranslationKeys.cancel_ride)} onPress={handleClick} />
               
                <CustomBottomSheet ref={bottomSheetRef}
                    snapPoints={snapPoints}
                    index={-1}
                    backdropComponent={renderBackdrop}
                >
                    <View style={styles.bottomSheetContainerStyle}>
                        <Image source={Icons.CANCELTAXIICON} style={styles.completedIcon} />
                        <Text style={styles.headingText}>{t(TranslationKeys.booking_Cancelled)}</Text>
                        <Text style={[GlobalStyle.subTitleStyle, styles.subtitleText]}>{t(TranslationKeys.cancelStatement)}</Text>
                        <CustomPrimaryButton onPress={() => {
                            bottomSheetRef.current?.close()
                            navigation.reset(
                                {
                                    index: 0,
                                    routes: [{
                                        name: 'DrawerStack', params: {
                                            screen: 'HomeScreen',
                                        }
                                    }]
                                }
                            )
                        }} title={t(TranslationKeys.got_it)} style={styles.completedButton} />
                    </View>
                </CustomBottomSheet>
               
            </View>
            {(modalVisible.modalVisible) ?
                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={modalVisible.modalVisible}>
                    <View style={[GlobalStyle.centerContainer, { flex: 1 }]}>
                        <Image
                            source={modalVisible?.type === "RideCancel" ? Icons.CANCELTAXIICON : Icons.CHECKBOX}
                            style={[styles.completedIcon, {
                                tintColor: (modalVisible?.type === "RideCancel") ? colors.ERROR_TEXT : undefined
                            }]} />
                        {
                            modalVisible?.type === "RideCancel"
                                ?
                                <>
                                    <Text style={styles.headingText}>{t(TranslationKeys.booking_Cancelled)}</Text>
                                    <Text style={[GlobalStyle.subTitleStyle, styles.subtitleText]}>{t(TranslationKeys.cancellation_statement)}&nbsp;{rideDetails?.rideCancelBy?.reason}</Text>
                                </>
                                : null
                        }
                    </View>
                    <CustomBottomBtn onPress={() => {
                        dispatch(resetRideOtpReducer())
                        dispatch(setPaymentMethod("Card"))
                        if (modalVisible?.type === "RideCancel") {
                            navigation.reset({
                                index: 0,
                                routes: [{
                                    name: 'DrawerStack',
                                }]
                            })
                        } 
                    }} title={t(TranslationKeys.got_it)}
                    // style={Styles.completedButton}
                    />
                </Modal>
                : null}
        </>
    );
};

export default CancelTaxiScreen;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        reasonText: {
            color: colors.SECONDARY_TEXT,
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_12,
            textAlign: 'left'
        },
        itemSeperatorLine: {
            width: wp(90),
            height: wp(0.2),
            alignSelf: "center",
            marginVertical: wp(3),
            backgroundColor: colors.SHEET_INDICATOR,
        },
        textInputLabelText: {
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
            marginTop: wp(3),
            marginBottom: wp(2),
            textAlign: 'left'
        },
        textInputContainerStyle: {
            alignItems: 'flex-start',
            maxHeight: wp(40),
            minHeight: wp(30)
        },
        bottomSheetContainerStyle: {
            alignItems: 'center',
            justifyContent: 'space-evenly',
            flex: 1,
        },
        completedIcon: {
            width: wp(20),
            height: wp(20),
            resizeMode: 'contain',
            tintColor: colors.ERROR_TEXT
        },
        headingText: {
            fontSize: FontSizes.FONT_SIZE_18,
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
            color: colors.PRIMARY_TEXT,
            textAlign: 'center',
            paddingTop: wp(5)
        },
        subtitleText: {
            textAlign: 'center',
            color: colors.SECONDARY_TEXT,
            marginHorizontal: wp(5),
            marginVertical: wp(2),
        },
        completedButton: {
            backgroundColor: colors.PRIMARY,
            width: '100%',
            alignItems: 'center',
            paddingVertical: wp(3.5),
            borderRadius: wp(2),
        },
    });
};
