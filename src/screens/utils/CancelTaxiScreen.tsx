import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { useGlobalStyles } from '../../hooks/useGlobalStyles'
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
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
import { cancelRide, resetRideOtpReducer, restActiveRideDetailsData, setCustomTip, setRideDetailsData, setRideStatusReducer, setTipAmount, setTipConatinerVisible } from '../../redux/slice/rideSlice/RideSlice';
import { RootStackParamList } from '../../types/RootStackType';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { resetRideDetails, setPaymentMethod } from '../../redux/slice/homeSlice/HomeSlice';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { PAYMENT_METHOD, PreBookReasons, RIDE_STATUS, Reasons, disputedReasons } from '../../utils/Constats';
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
import { navigationRef } from '../../utils/NavigationServices';
import { getScrtachCardDetails, setScrtachCardDetails } from '../../redux/slice/referralSlice/ReferralSlice';

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
    const [isBtnDiabled, setIsBtnDisable] = useState<boolean>(false);
    const [selectedReason, setSelectedReason] = useState<ReasonsTypes | undefined>(undefined);
    const navigation = useCustomNavigation('CancelTaxiScreen')
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['42%'], []);
    const dispatch = useAppDispatch();
    const { isLoading, rideDetails } = useAppSelector(state => state.RideSlice)
    const { tokenDetail } = useAppSelector(state => state.AuthSlice)
    type NestedScreenRouteProp = RouteProp<RootStackParamList, 'CancelTaxiScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const { id, isDispute } = route.params;
    const isPreBook = route?.params?.isPreBook ?? false
    const isDisputed = (rideDetails?.rideStatus == RIDE_STATUS.ONGOING || rideDetails?.rideStatus == RIDE_STATUS.DRIVER_ENDED || isDispute)
    const [reasons, setReasons] = useState<ReasonsTypes[]>(isDisputed ? disputedReasons : isPreBook ? PreBookReasons : Reasons)
    const { t } = useTranslation();
    const focus = useIsFocused()
    const [modalVisible, setModalVisible] = useState<ModalTypes>({
        modalVisible: false,
        type: ''
    })
    const isRideCancel = useRef(null)
    const isRideBefore = store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide
    const url = `${RIDE_DETAILS}${id}/`
    const ws = useRef<WebSocket>();

    useEffect(() => {
        if (!selectedReason && selectedReason?.reason == undefined) {
            connectionInit()
        }
        return () => {
            if (ws?.current) {
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
            // if (focus && navigationRef.current?.getCurrentRoute()?.name == "CancelTaxiScreen") {
            //     setTimeout(connectionInit, 2000);
            // }
        })

        ws?.current?.addEventListener('message', (message) => {
            const msgDetails = JSON.parse(message.data)
            console.log("MESSAGE--->", msgDetails)
            const { rideBooking, find_driver_progress } = msgDetails
            if (rideBooking) {
                dispatch(setRideDetailsData(rideBooking))
            }
            if (rideBooking?.rideStatus === RIDE_STATUS.CANCELLED) {
                // setIsVisibleWaitingPaymentModal(false)
                // dispatch(resetRideOtpReducer())
                dispatch(setRideStatusReducer(undefined))
                setModalVisible({
                    modalVisible: true,
                    type: 'RideCancel'
                })
            } else if (rideBooking?.rideStatus === RIDE_STATUS.COMPLETED && rideBooking?.ridePayment?.paymentMethod === PAYMENT_METHOD.CASH) {

                setModalVisible({
                    modalVisible: true,
                    type: 'PaymentSuccess'
                })
                dispatch(setRideStatusReducer(undefined))
            }
        }
        )
    };

    const handleClick = () => {
        dispatch(setTipConatinerVisible(false))
        setIsBtnDisable(true)
        if (ws?.current) {
            ws?.current?.close()
        }
        if ((selectedReason && selectedReason?.reason)) {
            setShowErrorText(false)
            const data = new FormData()
            data.append("ride_booking", id)
            if (isDisputed) {
                data.append("is_disputed", true)
            }
            if ((selectedReason?.id === 6 && !isPreBook && !isDisputed) || (selectedReason?.id === 5 && isPreBook) || (selectedReason?.id === 7 && isDisputed)) {
                if (cancellationsReason.length > 255) {
                    setIsBtnDisable(false)
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
                    setIsBtnDisable(false)
                    dispatch(restActiveRideDetailsData())
                })
                .catch(e => {
                })
        } else {
            setIsBtnDisable(false)
            setShowErrorText(true)
            setCancellationsReason('')
        }
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
                numberOfLines={3}
                titleStyle={{ textAlign: 'left' }}
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

    const getScratchAmount = () => {
        // if (paymentMethod == "Card") {
        dispatch(getScrtachCardDetails(rideDetails?.id)).unwrap().then((res) => {
            dispatch(setScrtachCardDetails(res?.data))
        }).catch((error: any) => {
            console.log("error", error)
        })
        // }
    }

    return (
        <>
            <View style={GlobalStyle.container}>
                {isLoading ? <CustomActivityIndicator /> : null}
                <CustomHeader title={isDisputed ? t(TranslationKeys.dispute_the_ride) : rideDetails?.deliveryDetails ? t(TranslationKeys.cancel_delivery) : t(TranslationKeys.cancel_taxi)} onPress={() => navigation.goBack()} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : 'padding'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight} // 50 is Button height
                    enabled
                    style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps={'handled'} showsVerticalScrollIndicator={false}>
                        <CustomContainer>
                            <Text
                                numberOfLines={2} style={styles.reasonText}>{isDisputed ? t(TranslationKeys.select_dispution_reason) : t(TranslationKeys.select_cancellations_reason)}</Text>
                            <View>
                                <FlatList
                                    data={isDisputed ? disputedReasons : isPreBook ? PreBookReasons : Reasons}
                                    bounces={false}
                                    renderItem={renderItem}
                                />
                            </View>
                            {((selectedReason?.id === 6 && !isPreBook && !isDisputed) || (selectedReason?.id === 5 && isPreBook) || (selectedReason?.id === 7 && isDisputed)) ? <>
                                <View style={styles.itemSeperatorLine} />
                                <Text style={styles.textInputLabelText}>{t(TranslationKeys.other)}</Text>
                                <CustomTextInput
                                    placeholder={t(TranslationKeys.enter_your_reason)} multiline
                                    textInputContainerStyle={styles.textInputContainerStyle} value={cancellationsReason}
                                    editable={(selectedReason?.id === 6 && !isPreBook && !isDisputed) || (selectedReason?.id === 5 && isPreBook) || (selectedReason?.id === 7 && isDisputed)}
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
                <CustomBottomBtn title={isDisputed ? t(TranslationKeys.submit_for_dispute) : rideDetails?.deliveryDetails ? t(TranslationKeys.cancel_delivery) : t(TranslationKeys.cancel_ride)} onPress={handleClick} disabled={isBtnDiabled} />
                <CustomBottomSheet ref={bottomSheetRef}
                    animateOnMount={false}
                    enableDynamicSizing={false}
                    snapPoints={snapPoints}
                    index={-1}
                    backdropComponent={renderBackdrop}
                >
                    <View style={styles.bottomSheetContainerStyle}>
                        <Image source={Icons.CANCELTAXIICON} style={styles.completedIcon} />
                        <Text style={styles.headingText}>{isDisputed ? t(TranslationKeys.booking_disputed) : t(TranslationKeys.booking_Cancelled)}</Text>
                        <Text style={[GlobalStyle.subTitleStyle, styles.subtitleText]}>{isDisputed ? t(TranslationKeys.disputStatement) : t(TranslationKeys.cancelStatement)}</Text>
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
                                    <Text style={styles.headingText}>{rideDetails?.rideCancelBy?.isDisputed ? t(TranslationKeys.booking_disputed) : t(TranslationKeys.booking_Cancelled)}</Text>
                                    <Text style={[GlobalStyle.subTitleStyle, styles.subtitleText]}>{rideDetails?.rideCancelBy?.isDisputed ? t(TranslationKeys.disputed_statement) : t(TranslationKeys.cancellation_statement)}&nbsp;{rideDetails?.rideCancelBy?.reason}</Text>
                                </>
                                : null
                        }
                        {
                            modalVisible?.type === "PaymentSuccess"
                                ?
                                <>
                                    <Text style={styles.headingText}>{!isRideBefore ? t(TranslationKeys.payment_success) : rideDetails?.deliveryDetails ? t(TranslationKeys.delivery_completed_success) : t(TranslationKeys.ride_completed_success)}</Text>
                                    <Text style={[GlobalStyle.subTitleStyle, styles.subtitleText]}>{!isRideBefore ? t(TranslationKeys.payment_statement) : rideDetails?.deliveryDetails ? t(TranslationKeys.payment_statement_delivery) : t(TranslationKeys.payment_statement_ride)}</Text>
                                </>
                                : null
                        }
                    </View>
                    <CustomBottomBtn onPress={() => {
                        dispatch(setRideStatusReducer(undefined))
                        dispatch(resetRideOtpReducer())
                        dispatch(setPaymentMethod("Card"))
                        dispatch(setTipConatinerVisible(false))
                        dispatch(setTipAmount(0))
                        dispatch(setCustomTip(''))
                        if (modalVisible?.type === "RideCancel") {
                            navigation.reset({
                                index: 0,
                                routes: [{
                                    name: 'DrawerStack',
                                }]
                            })
                        }
                        else {
                            getScratchAmount()
                            analytics().logEvent(ANALYTICS_ID.RIDE_PAYMENT_COMPLETED, {
                                'userDetails': {
                                    'id': tokenDetail?.userData?.id,
                                    'name': tokenDetail?.userData?.name,
                                    'phoneNumber': tokenDetail?.userData?.phoneNumber
                                }
                            })
                            navigation.reset({
                                index: 1,
                                routes: [{
                                    name: 'DrawerStack',
                                },
                                {
                                    name: 'RideBillScreen',
                                    params: {
                                        rideId: rideDetails?.id
                                    }
                                }]
                            })
                        }
                    }} title={modalVisible?.type === "RideCancel" ? t(TranslationKeys.got_it) : rideDetails?.deliveryDetails ? t(TranslationKeys.view_delivery_bill) : t(TranslationKeys.view_ride_bill)}
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
