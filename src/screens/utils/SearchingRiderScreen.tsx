import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, DeviceEventEmitter, EventEmitter, Image, ImageBackground, Modal, NativeModules, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import CustomMapContainer from '../../components/CustomMapContainer';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import { Icons } from '../../utils/IconsPaths';
import { ImagesPaths } from '../../utils/ImagesPaths';
import CustomIconButton from '../../components/CustomIconButton';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { findDriver, resetLastActiveTime, setCreateDeliveryRideData, setAppliedCoupon, setCreateRideData, setIsComplateTimer, setLastActibeStep, setLastActiveTime, setPaymentMethod, riderAppState, setIsRefundText, searchStartApi } from '../../redux/slice/homeSlice/HomeSlice';
import { RootStackParamList } from '../../types/RootStackType';
import CustomPrimaryButton from '../../components/CustomPrimaryButton';
import CustomBottomSheet from '../../components/CustomBottomSheet';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet';
import { Marker } from 'react-native-maps';
import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { RIDE_DETAILS } from '../../config/Host';
import { SOCKET_STATUS } from '../../utils/Constats';
import { cancelRide, deleteRideBooking, resetDeliveryDetails, resetRideDetailsData, setTipBtnOn, showActiveRideModalReducer } from '../../redux/slice/rideSlice/RideSlice';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { ProgressStepperLive } from 'react-native-reanimated-progress-steps';
import moment from 'moment';
import { useLanguage } from '../../context/LanguageContext';
import i18n from '../../localization/i18n';
import { stateType } from '../../types/DataTypes';
import CustomContainer from '../../components/CustomContainer';
import { navigationRef } from '../../utils/NavigationServices';

const { StatusBarManager } = NativeModules;
const DriverList = [
    {
        latitude: 21.238228785462766,
        longitude: 72.88665510365725,
        userProfile: 'https://dummyimage.com/600x400/000/fff'
    },
    {
        latitude: 21.238413850537484,
        longitude: 72.8875249429032,
        userProfile: 'https://dummyimage.com/600x400/000/fff'
    },
    {
        latitude: 21.23740039609058,
        longitude: 72.88778337340379,
        userProfile: 'https://dummyimage.com/600x400/000/fff'
    },
    {
        latitude: 21.236883384761693,
        longitude: 72.88684735073697,
        userProfile: 'https://dummyimage.com/600x400/000/fff'
    },
    {
        latitude: 21.23859891537989,
        longitude: 72.88829708281355,
        userProfile: 'https://dummyimage.com/600x400/000/fff'
    }
]

const SearchingRiderScreen = () => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const { userCordinates, tokenDetail } = useAppSelector(state => state.AuthSlice)
    const navigation = useCustomNavigation('SearchingRiderScreen');
    const { networkStatus } = useAppSelector(state => state.SettingSlice)
    const { isLoading } = useAppSelector(state => state.RideSlice)
    const dispatch = useAppDispatch();
    type NestedScreenRouteProp = RouteProp<RootStackParamList, 'SearchingRiderScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const { id, from, isAppCloseOrOpen } = route.params;
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [snapPoint, setSnapPoint] = useState<string[]>(["45%"])
    const [progress, setProgress] = useState<number>(0);
    const snapPoints = useMemo(() => snapPoint, [snapPoint]);
    const [bottomSheetVisible, setBottomSheetVisible] = useState<boolean>(false)
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | number>(0);
    const [reason, setReason] = useState("")
    const { t } = useTranslation();
    const [steps, setSteps] = useState<number>(store.getState().HomeSlice.lastActiveStep ?? 0);
    const totalSeconds = 95; // Total time in seconds
    // const totalSeconds = 50;
    const focus = useIsFocused()
    const { locale } = useLanguage()
    const url = `${RIDE_DETAILS}${id}/`
    const wsRef = useRef<WebSocket>();
    const isDeliveryModule = route?.params?.isDeliveryModule ?? false
    const progressStatus = useRef()
    const isCancelCalled = useRef<boolean>(false);
    const GlobalStyles = useGlobalStyles();
    const [modalVisible, setModalVisible] = useState({
        modalVisible: false,
        type: ''
    })

    const rideDetailRef = useRef()


    useEffect(() => {
        if (focus) {
            dispatch(resetRideDetailsData())
            dispatch(setTipBtnOn(false))
            // if (timeSpent) {
            //     connectionInit()
            // }
        }
        return () => {
            wsRef.current?.close()
        }
    }, [focus])

    // useEffect(() => {
    //     const appStateListener = AppState.addEventListener(
    //         'change',
    //         nextAppState => {
    //             console.log('Next AppState is: ', nextAppState);
    //             if (nextAppState === "inactive" || nextAppState === "background") {
    //                 console.log("DATE--->", new Date())
    //                 dispatch(setLastActiveTime(moment().toISOString()))
    //             }
    //         },
    //     );
    //     return () => {
    //         appStateListener?.remove();
    //     };
    // }, []);

    const connectionInit = () => {
        wsRef.current = new WebSocket(url, null, {
            headers: {
                Authorization: `Token ${tokenDetail?.authToken}`,
                "Accept-Language": i18n.language
            }
        })
        wsRef.current.onopen = () => {
            console.log("CONNECTION OPEN");
        }
        wsRef.current.addEventListener("error", (erorr) => {
            console.log("CONNECTION ERROR", erorr.message, erorr);
            // if (wsRef?.current?.readyState == SOCKET_STATUS.CLOSED && networkStatus) {
            //     setTimeout(() => {
            //         connectionInit()
            //     }, 2000);
            // }
            // setLoading(false)
        })
        wsRef.current.addEventListener("open", () => {
            console.log("CONNECTION OPEN");
        })
        wsRef.current.addEventListener("close", () => {
            setTimeout(() => {
                console.log("CONNECTION CLOSE", rideDetailRef.current, focus, navigationRef.current?.getCurrentRoute()?.name);
                if (focus && navigationRef.current?.getCurrentRoute()?.name == "SearchingRiderScreen" && !rideDetailRef.current?.isTimeOut) {
                    connectionInit()
                }
            }, 1000);

        })
        wsRef.current.addEventListener("message", (message) => {
            try {
                console.log("MESSAGE_FIND_DRIVER", message)
                const msgDetails = JSON.parse(message.data)
                // const msgDetails2 = JSON.parse(msgDetails)
                console.log('CONNECTION', msgDetails, msgDetails?.find_driver_progress, msgDetails?.rideBooking?.isTimeOut, msgDetails?.rideBooking?.rideStatus)
                if (msgDetails?.rideBooking?.rideCancelBy?.reason) {
                    setReason(msgDetails?.rideBooking?.rideCancelBy?.reason)
                }
                rideDetailRef.current = msgDetails?.rideBooking

                if (msgDetails?.rideBooking) {
                    if (msgDetails?.rideBooking?.rideStatus === "DRIVER_ALLOCATED" || msgDetails?.find_driver_progress?.status === "DRIVER_ALLOCATED") {
                        dispatch(setAppliedCoupon(-1))
                        dispatch(showActiveRideModalReducer({
                            isFirstTime: true,
                            visibleModal: false
                        }))
                        wsRef.current?.close()
                        setTimeout(() => {
                            navigation.reset({
                                index: 1, routes: [
                                    {
                                        name: 'DrawerStack',
                                    },
                                    {
                                        name: 'TrackDriverScreen', params: {
                                            rideId: msgDetails?.rideBooking?.id ?? msgDetails?.find_driver_progress?.ride_booking_id,
                                        }
                                    }
                                ]
                            })
                        }, 500);
                    } else if (msgDetails?.rideBooking?.rideStatus === "CANCELLED") {
                        dispatch(setPaymentMethod("Card"))
                        setTimeout(() => {
                            setModalVisible({
                                modalVisible: true,
                                type: 'RideCancel'
                            })
                        }, 100);
                    } else if (msgDetails?.find_driver_progress?.status == "Driver not assigned" || msgDetails?.rideBooking?.isTimeOut) {
                        setProgress(0)
                        setSteps(0)
                        clearInterval(intervalId)
                        dispatch(setIsComplateTimer(true))
                        setBottomSheetVisible(true)
                        wsRef.current?.close()
                        bottomSheetRef.current?.snapToIndex(0)
                    }
                } else {
                    if (msgDetails?.find_driver_progress?.status == "Driver not assigned" || msgDetails?.rideBooking?.isTimeOut) {
                        setProgress(0)
                        setSteps(0)
                        clearInterval(intervalId)
                        dispatch(setIsComplateTimer(true))
                        setBottomSheetVisible(true)
                        wsRef.current?.close()
                        bottomSheetRef.current?.snapToIndex(0)
                    } else if (msgDetails?.rideBooking?.isTimeOut == null || msgDetails?.find_driver_progress) {
                        progressStatus.current = msgDetails?.find_driver_progress
                        let step = steps + 1
                        console.log("+steps-->", steps, step)
                        if (msgDetails?.find_driver_progress == 19 || (msgDetails?.find_driver_progress == 38)) {
                            setSteps(0)
                            dispatch(setLastActibeStep(0))
                        } else if (msgDetails?.find_driver_progress == 57 || msgDetails?.find_driver_progress == 76) {
                            setSteps(1)
                            dispatch(setLastActibeStep(1))
                        } else if (msgDetails?.find_driver_progress == 95 || msgDetails?.find_driver_progress == 114) {
                            setSteps(2)
                            dispatch(setLastActibeStep(2))
                        } else if (msgDetails?.find_driver_progress == 133 || msgDetails?.find_driver_progress == 152) {
                            setSteps(3)
                            dispatch(setLastActibeStep(3))
                        } else if (msgDetails?.find_driver_progress == 171 || msgDetails?.find_driver_progress == 190) {
                            setSteps(4)
                            dispatch(setLastActibeStep(4))
                        } else {
                            if (store.getState().HomeSlice.lastActiveStep) {
                                setSteps(store.getState().HomeSlice.lastActiveStep)
                            } else {
                                setSteps(0)
                            }
                        }
                    }
                }

                // if (msgDetails?.rideBooking?.rideStatus === "DRIVER_ALLOCATED" || msgDetails?.find_driver_progress?.status === "DRIVER_ALLOCATED") {
                //     dispatch(setAppliedCoupon(-1))
                //     dispatch(showActiveRideModalReducer({
                //         isFirstTime: true,
                //         visibleModal: false
                //     }))
                //     wsRef.current?.close()
                //     setTimeout(() => {
                //         navigation.reset({
                //             index: 1, routes: [
                //                 {
                //                     name: 'DrawerStack',
                //                 },
                //                 {
                //                     name: 'TrackDriverScreen', params: {
                //                         rideId: msgDetails?.rideBooking?.id ?? msgDetails?.find_driver_progress?.ride_booking_id,
                //                     }
                //                 }
                //             ]
                //         })
                //     }, 500);
                // } else if (msgDetails?.find_driver_progress?.status == "Driver not assigned" || msgDetails?.rideBooking?.isTimeOut) {
                //     setProgress(0)
                //     setSteps(0)
                //     clearInterval(intervalId)
                //     dispatch(setIsComplateTimer(true))
                //     setBottomSheetVisible(true)
                //     wsRef.current?.close()
                //     bottomSheetRef.current?.snapToIndex(0)
                // } else if (msgDetails?.rideBooking?.isTimeOut == null || msgDetails?.find_driver_progress) {
                //     progressStatus.current = msgDetails?.find_driver_progress
                //     let step = steps + 1
                //     console.log("+steps-->", steps, step)
                //     if (msgDetails?.find_driver_progress == 19 || (msgDetails?.find_driver_progress == 38)) {
                //         setSteps(0)
                //         dispatch(setLastActibeStep(0))
                //     } else if (msgDetails?.find_driver_progress == 57 || msgDetails?.find_driver_progress == 76) {
                //         setSteps(1)
                //         dispatch(setLastActibeStep(1))
                //     } else if (msgDetails?.find_driver_progress == 95 || msgDetails?.find_driver_progress == 114) {
                //         setSteps(2)
                //         dispatch(setLastActibeStep(2))
                //     } else if (msgDetails?.find_driver_progress == 133 || msgDetails?.find_driver_progress == 152) {
                //         setSteps(3)
                //         dispatch(setLastActibeStep(3))
                //     } else if (msgDetails?.find_driver_progress == 171 || msgDetails?.find_driver_progress == 190) {
                //         setSteps(4)
                //         dispatch(setLastActibeStep(4))
                //     } else {
                //         if (store.getState().HomeSlice.lastActiveStep) {
                //             setSteps(store.getState().HomeSlice.lastActiveStep)
                //         } else {
                //             setSteps(0)
                //         }
                //     }
                // } else if (msgDetails?.rideBooking?.rideStatus === "CANCELLED") {
                //     dispatch(setPaymentMethod("Card"))
                //     setTimeout(() => {
                //         setModalVisible({
                //             modalVisible: true,
                //             type: 'RideCancel'
                //         })
                //     }, 100);
                // }
                // dispatch(setWithDrawalMoney(msgDetails))
            } catch (e) {
                throw new Error("App crash on goint to track driver screen from the searching");
            }
        })
    }

    useEffect(() => {
        if (from === "BookingScreen" || from === "DeliveyReviewScreen") {
            findRideApiCall()
        } else if (from == "HomeScreen" || from == "DeliveryHomeScreen") {
            if (isAppCloseOrOpen && navigationRef.current?.getCurrentRoute()?.name == "SearchingRiderScreen" && !rideDetailRef.current?.isTimeOut) {
                connectionInit()
            } else {
                wsRef.current?.close()
                bottomSheetRef?.current?.snapToIndex(0)
                dispatch(setIsComplateTimer(true))
            }
        }
        return () => {
            setSteps(0)
            wsRef.current?.close()
        }
    }, [])

    const backAction = () => {
        if (isCancelCalled?.current) {
            navigation.goBack()
        }
        else {
            Alert.alert(t(TranslationKeys.hold_on), t(TranslationKeys.are_you_sure_you_want_back), [
                {
                    text: t(TranslationKeys.cancel),
                    onPress: () => null,
                    style: 'cancel',
                },
                {
                    text: t(TranslationKeys.yes), onPress: () => {
                        cancelFindDriverWithBackApi()

                        // BackHandler.exitApp()
                    }
                },
            ]);
        }
        return true;
    };
    useEffect(() => {

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );

        return () => backHandler.remove();
    }, []);

    const findRideApiCall = () => {
        console.log("DATATA--->", id && !store.getState().HomeSlice.isComplateTimer)
        if (id && !store.getState().HomeSlice.isComplateTimer) {
            dispatch(setLastActibeStep(0))
            // startProgress()
            console.log('userDetail-timeSpent-search', moment().toString())
            // dispatch(setLastActiveTime(moment().toString()))
            dispatch(setIsComplateTimer(false))
            dispatch(setIsRefundText(false))
            dispatch(findDriver(id)).unwrap().then((res) => {
                setTimeout(() => {
                    connectionInit()
                }, 500);
            })
        }
    }

    const progressBarStyle = useAnimatedStyle(() => {
        return {
            height: '100%',
            backgroundColor: colors.PRIMARY,
            borderTopRightRadius: progress == 1 ? 0 : 5,
            borderBottomRightRadius: progress == 1 ? 0 : 5,
            width: withSpring(`${Math.min(progress, 1) * 100}%`, {
                damping: 100,
            })
        }
    }, [progress])

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                pressBehavior={'none'}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                style={{
                    height: "100%",
                    width: "100%",
                    position: 'absolute',
                    zIndex: 3
                }}
                opacity={0.4}
            />
        ),
        []
    );

    const cancelRideBooking = (isGoBack?: boolean) => {
        if (id) {
            const data = new FormData()
            data.append("ride_booking", id)
            let params = {
                formData: data,
            }
            dispatch(cancelRide(params)).unwrap()
                .then(res => {
                    if (isGoBack) {
                        navigation.goBack()
                    } else {
                        setProgress(0)
                        setSteps(0)
                        clearInterval(intervalId)
                    }
                    dispatch(setIsComplateTimer(false))
                })
                .catch(e => {
                })
        }
    }

    const cancelFindDriverApi = () => {
        dispatch(setIsComplateTimer(false))
        dispatch(setPaymentMethod("Card"))
        dispatch(setAppliedCoupon(-1))
        if (id) {
            dispatch(deleteRideBooking(id)).unwrap().then(res => {
                setProgress(0)
                setSteps(0)
                clearInterval(intervalId)
                setBottomSheetVisible(true)
                bottomSheetRef.current?.snapToIndex(0)
                dispatch(setCreateRideData(null))
                dispatch(setCreateDeliveryRideData(null))
            }).catch(e => console.log({ e }))
        }
        return true
    };

    const cancelFindDriverWithBackApi = () => {
        if (id) {
            if (store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide) {
                if (store.getState().HomeSlice.createDeliveryRideData?.ridePayment?.paymentMethod === "CARD" || store.getState().HomeSlice.createRideData?.ridePayment?.paymentMethod === "CARD") {
                    cancelRideBooking(true)
                } else {
                    dispatch(deleteRideBooking(id)).unwrap().then(res => {
                        navigation.goBack()
                        dispatch(setIsComplateTimer(false))
                    }).catch(e => {
                        navigation.goBack()
                        dispatch(setIsComplateTimer(false))
                        console.log({ e })
                    })
                }
            } else {
                dispatch(deleteRideBooking(id)).unwrap().then(res => {
                    navigation.goBack()
                }).catch(e => {
                    navigation.goBack()
                    console.log({ e })
                })
            }
        }
        return true
    };

    return (
        <SafeAreaView edges={['top']} style={GlobalStyle.container}>
            <View style={Styles.headerStyle}>
                <CustomIconButton
                    onPress={() => {
                        backAction()
                    }}
                    icon={Icons.LEFT_ARROW_ICON}
                    iconStyle={{ transform: [{ rotate: locale ? '180deg' : '0deg' }] }}
                />
                <Text style={Styles.headerTxtStyle}>{isDeliveryModule ? t(TranslationKeys.searching_delivery_header) : t(TranslationKeys.searching_ride_header)}</Text>
            </View>

            {!bottomSheetVisible ? <>
                <ImageBackground source={ImagesPaths.TRANSPARENT_BACKGROUND_IMAGE} style={Styles.gradientStyle}>
                    <View style={Styles.imageMainContainerStyle}>
                        <Image source={ImagesPaths.SEARCH_TAXI} style={Styles.taxiImageStyle} />
                        <Text style={Styles.searchingRideTxtStyle}>{isDeliveryModule ? t(TranslationKeys.searching_delivery) : t(TranslationKeys.searching_ride)}</Text>
                        <Text
                            style={Styles.takeAFewTxtStyle}
                        >{t(TranslationKeys.this_mmay_take_a_few_seconds)}</Text>
                    </View>
                    <View style={Styles.maxWidth}>
                        <View
                            style={[Styles.progressMainContainerStyle, { marginVertical: wp(2), alignItems: 'center' }]}
                        >
                            {/* <Animated.View
                                style={progressBarStyle}
                            /> */}
                            <ProgressStepperLive
                                allSteps={["0-1", "0-2", "0-3.5", "3.5-5", "5-6.5"]}
                                showLabels={false}
                                stepGap={10}
                                trackBackgroundColor={colors.EMPTY_IMAGE_BACKROUND}
                                progressColor={colors.PRIMARY}
                                trackCompletedColor={colors.PRIMARY}
                                currentStep={steps}
                                animationVariation="scaleToFill"
                                animationDuration={1500}
                                trackHeight={12}
                            />
                        </View>
                        <CustomBottomBtn
                            disabled={bottomSheetVisible}
                            onPress={() => {
                                isCancelCalled.current = true
                                dispatch(resetDeliveryDetails(undefined))
                                if (store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide) {
                                    if (store.getState().HomeSlice.createDeliveryRideData?.ridePayment?.paymentMethod === "CARD" || store.getState().HomeSlice.createRideData?.ridePayment?.paymentMethod === "CARD") {
                                        Alert.alert(t(TranslationKeys.hold_on), t(TranslationKeys.are_you_sure_you_want_to_cancel_ride), [
                                            {
                                                text: t(TranslationKeys.cancel),
                                                onPress: () => null,
                                                style: 'cancel',
                                            },
                                            {
                                                text: t(TranslationKeys.yes), onPress: () => {
                                                    dispatch(setIsRefundText(true))
                                                    setBottomSheetVisible(true)
                                                    bottomSheetRef.current?.snapToIndex(0)
                                                    cancelRideBooking()
                                                    // BackHandler.exitApp()
                                                }
                                            },
                                        ]);
                                    } else {
                                        cancelFindDriverApi()
                                    }
                                } else {
                                    cancelFindDriverApi()
                                }
                            }}
                            title={t(TranslationKeys.cancel)}
                            containerStyle={Styles.maxWidth}
                        />
                    </View>
                </ImageBackground>
            </> : null}
            <CustomMapContainer
                region={{
                    latitude: userCordinates?.latitude ?? 21.23814020005119,
                    longitude: userCordinates?.longitude ?? 72.88746321772949,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                }}
                minZoomLevel={17}
            >
                {/* {
                    DriverList.map((item, index) => {
                        return (
                            <Marker.Animated coordinate={{
                                latitude: item.latitude,
                                longitude: item.longitude
                            }}
                            >
                                <View style={Styles.mainUserContainerStlye}>
                                    <View style={Styles.userContainerStyle}>
                                        <Image source={{ uri: item.userProfile }} style={Styles.userImageContainerStyle} />
                                    </View>
                                    <View style={Styles.userNotchBottomContainer} />
                                </View>
                                <Image source={ImagesPaths.CAR_IMAGE} style={[Styles.carIconStyle, { zIndex: index + 15 }]} />
                            </Marker.Animated>
                        )
                    })
                } */}
            </CustomMapContainer>
            <CustomBottomSheet
                ref={bottomSheetRef}
                snapPoints={snapPoints}
                index={store.getState().HomeSlice.isComplateTimer ? 0 : -1}
                enablePanDownToClose={false}
                animateOnMount={false}
                keyboardBlurBehavior='restore'
                overDragResistanceFactor={0.5}
                backdropComponent={renderBackdrop}
                containerStyle={{
                    zIndex: 4,
                    paddingBottom: wp(3)
                }}
            >
                <View style={{ flex: 1, justifyContent: "space-around" }}>
                    <View style={[GlobalStyle.centerContainer, { flex: 1 }]}>
                        {isLoading ? < ActivityIndicator size={'large'} color={colors.PRIMARY} /> :
                            <>
                                <Image source={store.getState().HomeSlice.isComplateTimer ? ImagesPaths.RIDE_RETRY : ImagesPaths.RIDE_NOT_FOUND_IMAGE} style={Styles.rideNotFoundIamgeStyle} />
                                <Text numberOfLines={1}
                                    style={Styles.rideNotFoundTxtStyle}>{isDeliveryModule ? t(TranslationKeys.delivery_not_found) : t(TranslationKeys.ride_not_found)}</Text>
                                <Text
                                    style={[Styles.pleaseTryAgainTxtStyle, { textAlign: "center" }]}>
                                    {store.getState().HomeSlice.isRefundText ? t(TranslationKeys.refund_time_frame) : store.getState().HomeSlice.isComplateTimer ? t(TranslationKeys.please_try_again) : t(TranslationKeys.please_try_again_in_a_few_minutes)}
                                </Text>
                            </>}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: "space-around" }}>
                        {store.getState().HomeSlice.isComplateTimer ?
                            <CustomPrimaryButton onPress={() => {
                                if (store.getState().HomeSlice.isComplateTimer) {
                                    setBottomSheetVisible(false)
                                    bottomSheetRef.current?.close()
                                    setSteps(0)
                                    wsRef.current?.close()
                                    dispatch(setIsComplateTimer(false))
                                    findRideApiCall()
                                }
                            }} title={t(TranslationKeys.retry)}
                                style={[GlobalStyle.primaryBtnStyle, { marginVertical: 0, width: '45%' }]} /> : null}
                        <CustomPrimaryButton
                            disabled={isLoading}
                            onPress={() => {
                                if (store.getState().HomeSlice.isComplateTimer) {
                                    dispatch(setIsComplateTimer(false))
                                    setBottomSheetVisible(false)
                                    isCancelCalled.current = true
                                    // bottomSheetRef.current?.close()
                                    // dispatch(resetDeliveryDetails(undefined))
                                    if (store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide) {
                                        if (store.getState().HomeSlice.createDeliveryRideData?.ridePayment?.paymentMethod === "CARD" || store.getState().HomeSlice.createRideData?.ridePayment?.paymentMethod === "CARD") {
                                            setBottomSheetVisible(true)
                                            bottomSheetRef.current?.snapToIndex(0)
                                            dispatch(setIsRefundText(true))
                                            cancelRideBooking()
                                        } else {
                                            cancelFindDriverApi()
                                        }
                                    } else {
                                        cancelFindDriverApi()
                                    }
                                } else {
                                    if (isDeliveryModule) {
                                        navigation?.reset({
                                            index: 0,
                                            routes: [
                                                {
                                                    name: 'DrawerStack',
                                                    params: {
                                                        screen: 'DeliveryHomeScreen',
                                                    }
                                                },
                                            ]
                                        })
                                    } else {
                                        navigation.reset({
                                            index: 0,
                                            routes: [{
                                                name: 'DrawerStack'
                                            }]
                                        })
                                    }
                                }
                            }} title={store.getState().HomeSlice.isComplateTimer ? t(TranslationKeys.cancel) : t(TranslationKeys.got_it)}
                            style={[GlobalStyle.primaryBtnStyle, { marginVertical: 0, width: store.getState().HomeSlice.isComplateTimer ? '45%' : '100%' }]} />
                    </View>
                </View>
            </CustomBottomSheet>

            {modalVisible.modalVisible &&
                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={modalVisible.modalVisible}>
                    <View style={[GlobalStyles.centerContainer, { flex: 1 }]}>
                        <Image
                            source={modalVisible?.type === "RideCancel" ? Icons.CANCELTAXIICON : Icons.CHECKBOX}
                            style={[Styles.completedIcon, {
                                tintColor: (modalVisible?.type === "RideCancel") ? colors.ERROR_TEXT : undefined
                            }]} />

                        <>
                            <Text style={Styles.headingText}>{t(TranslationKeys.booking_Cancelled)}</Text>
                            {reason !== "" ? <Text style={[GlobalStyles.subTitleStyle, Styles.subtitleText]}>{t(TranslationKeys.cancellation_statement)}&nbsp;{reason}</Text> : null}
                        </>


                    </View>
                    <CustomBottomBtn onPress={() => {
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
                </Modal>}
        </SafeAreaView>
    );
};

export default SearchingRiderScreen;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        headerStyle: {
            backgroundColor: colors.TRANSPARENT,
            position: 'absolute',
            top: Platform.OS == "ios" ? StatusBarManager.HEIGHT : hp(2),
            zIndex: 2,
            paddingHorizontal: wp(5),
            flexDirection: 'row',
            alignItems: "center"
        },
        headerTxtStyle: {
            marginHorizontal: wp(4),
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_15,
        },
        completedIcon: {
            width: wp(20),
            height: wp(20),
            resizeMode: 'contain',
            tintColor: colors.PRIMARY,
            borderRadius: wp(10)
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
        gradientStyle: {
            height: hp(100),
            width: wp(100),
            position: 'absolute',
            zIndex: 1,
            opacity: 1,
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        taxiImageStyle: {
            height: wp(22),
            width: wp(22),
            resizeMode: 'contain',
            marginTop: wp(30)
        },
        searchingRideTxtStyle: {
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_18,
            marginTop: wp(3)
        },
        takeAFewTxtStyle: {
            color: colors.SECONDARY_TEXT,
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_15,
        },
        progressMainContainerStyle: {
            width: '100%',
            height: hp(0.5),
            justifyContent: 'center',
        },
        imageMainContainerStyle: {
            alignItems: 'center'
        },
        maxWidth: {
            width: '100%'
        },
        rideNotFoundTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_18,
            color: colors.PRIMARY_TEXT,
            marginVertical: wp(1)
        },
        pleaseTryAgainTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_13,
            color: colors.SECONDARY_TEXT,
            marginBottom: wp(7)
        },
        rideNotFoundIamgeStyle: {
            width: wp(40),
            height: wp(40),
            resizeMode: "contain",
        },
        carIconStyle: {
            width: wp(9),
            height: wp(9),
            resizeMode: 'contain',

        },
        userNotchBottomContainer: {
            width: wp(2.5),
            height: wp(2.5),
            backgroundColor: colors.PRIMARY,
            position: 'absolute',
            alignSelf: 'center',
            bottom: wp(-1),
            transform: [{
                rotate: '45deg',
            }],
            borderRadius: wp(0.2),
            borderTopLeftRadius: wp(5)
        },
        userImageContainerStyle: {
            width: wp(9),
            height: wp(9),
            resizeMode: 'cover',
            borderRadius: wp(20),
            borderColor: colors.WHITE_ICON,
            borderWidth: wp(0.3)
        },
        userContainerStyle: {
            backgroundColor: colors.PRIMARY,
            padding: wp(1.5),
            borderRadius: wp(20)
        },
        mainUserContainerStlye: {
            marginBottom: wp(2.5)
        },
        searchContainer: {
            width: '85%',
            backgroundColor: colors.SEARCH_TEXT,
            padding: wp(2),
            borderRadius: wp(2),
            alignItems: 'center'
        },
        searchText: {
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            textAlign: 'center',
            color: colors.PRIMARY_TEXT
        }
    });
};