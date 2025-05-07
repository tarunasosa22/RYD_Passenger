import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Image, LayoutAnimation, PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomMapContainer from '../../components/CustomMapContainer';
import CustomIconButton from '../../components/CustomIconButton';
import { Icons } from '../../utils/IconsPaths';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
import CustomBottomSheet from '../../components/CustomBottomSheet';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { RootRouteProps } from '../../types/RootStackType';
import { decode, findNearestIndex, getCurrentPosition, hasLocationPermission, requestLocationPermission, setPrice } from '../../utils/HelperFunctions';
import Geolocation from 'react-native-geolocation-service';
import CustomUserMarkerView from '../../components/CustomUserMarkerView';
import MapView, { Polyline } from 'react-native-maps';
import { RideDetailsTypes, rideDetails, setPaymentMethod, } from '../../redux/slice/homeSlice/HomeSlice';
import MapViewDirections from 'react-native-maps-directions';
import { APPSTORE_GOOGLE_MAP, ENVIRONMENT, GOOGLE_MAP_API, GOOGLE_MAP_NAVIGATION, PAY_API_ENDPOINT, PHONE_PE_CALLBACK_URL, PHONE_PE_MERCHANT_ID, PLAYSTORE_GOOGLE_MAP, RAZORPAY_KEY_ID, RIDE_DETAILS, SALT_INDEX, SALT_KEY, SOS_URL } from '../../config/Host';
import { RideLocationTypes, makeRidePayment, resetRideOtpReducer, setApiCounter, setCustomTip, setDriverDetails, setRideDetailsData, setRideOtpReducer, setRideStatusReducer, setTipAmount, setTipBtnOn, setTipConatinerVisible, } from '../../redux/slice/rideSlice/RideSlice';
import { TouchableOpacity } from 'react-native';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { Linking } from 'react-native';
import { AppAlert } from '../../utils/AppAlerts';
import { LOCATION_WATCH_OPTION, PAYMENT_METHOD, RIDE_STATUS, SOCKET_STATUS } from '../../utils/Constats';
import { Modal } from 'react-native';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import TrackDriverBottomSheetComponent from '../../components/bottomSheetComponents/TrackDriverBottomSheetComponent';
import ReactNativeModal from 'react-native-modal';
import CustomPrimaryButton from '../../components/CustomPrimaryButton';
import { stateType } from '../../types/DataTypes';
import { addSosRideIdReducer } from '../../redux/slice/contactSlice/ContactSlice';
import { hasNotch } from 'react-native-device-info';
import { useCodeScanner } from 'react-native-vision-camera';
import QrCodeScannerScreen from '../utils/QrCodeScannerScreen';
import Lottie from 'lottie-react-native';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { ANALYTICS_ID } from '../../utils/AnalyticsStringID';
import analytics from '@react-native-firebase/analytics';
import Share from 'react-native-share'
import { getScrtachCardDetails, setScrtachCardDetails } from '../../redux/slice/referralSlice/ReferralSlice';
import RazorpayCheckout from 'react-native-razorpay';
import { useLanguage } from '../../context/LanguageContext';
import i18n from '../../localization/i18n';
import { endRideCardPayment } from '../../redux/slice/paymentSlice/PaymentSlice';
import { current } from '@reduxjs/toolkit';
import { navigationRef } from '../../utils/NavigationServices';
import { BottomSheetDefaultFooterProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetFooter/types';
import { BottomSheetFooter, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

interface CoordsTypes {
    latitude: number
    longitude: number
};

interface SocketRideDetailsType {
    rideBooking: RideDetailsTypes,
    driverLocation: {
        distance(distance: any): React.SetStateAction<number | undefined>;
        isStartTracking: boolean;
        points: any;
        driver: number,
        latitude: number,
        longitude: number
    },
    rideBookingOtp?: string

};
interface MapNavigationProps {
    origin: CoordsTypes,
    destination: CoordsTypes,
    waypoints?: CoordsTypes[] | [] | undefined
};

interface ModalTypes {
    modalVisible: boolean,
    type: string,
};

export interface RegionDeltaProps {
    latitudeDelta: number,
    longitudeDelta: number,
}

const TrackDriverScreen = () => {

    const Styles = useStyles();
    const GlobalStyles = useGlobalStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { networkStatus } = useAppSelector(state => state.SettingSlice)
    const navigation = useCustomNavigation("TrackDriverScreen");
    const focus = useIsFocused();
    const { isLoading, routeTrackList, paymentMethod } = useAppSelector(state => state.HomeSlice);
    const { rideDetails, rideStatus, isLoading: makePaymentLoading, rideOtp: OTP, tipBtnOn, isTipConianerVisible } = useAppSelector(state => state.RideSlice);

    const { tokenDetail, userCordinates } = useAppSelector(state => state.AuthSlice);
    const [selectPaymentMethod, setSelectPaymentMethod] = useState<string>(paymentMethod);
    const route = useRoute<RootRouteProps<'TrackDriverScreen'>>();
    const { rideId } = route.params;
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [showBottomBtn, setShowBottomBtn] = useState<boolean>(false)
    // const [snapPoint, setSnapPoint] = useState<string[]>([rideStatus === RIDE_STATUS.ENDRIDE ? "60%" : "35%"])
    const [snapPoint, setSnapPoint] = useState<string[]>(["35%", "35%"])
    const snapPoints = useMemo(() => snapPoint, [snapPoint]);
    const [riderLocation, setRiderLocation] = useState<CoordsTypes | undefined>(undefined);
    // const [driverLocation, setDriverLocation] = useState<CoordsTypes | undefined>(undefined);
    // const rideDetailsRef = useRef<RideDetailsTypes | undefined>(undefined);
    // const riderOtpRef = useRef<string | undefined>(undefined);
    const driverLocationRef = useRef<CoordsTypes | undefined>(undefined);
    const livePointRef = useRef<CoordsTypes | undefined>(undefined);
    const isTrackingStart = useRef<boolean>(false);
    const mapRef = useRef<MapView>(null)
    const dispatch = useAppDispatch();
    const [location, setLocation] = useState<RideLocationTypes[] | []>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [duration, setDuration] = useState<number | undefined>(undefined);
    const [directionCoords, setDirectionCoords] = useState<CoordsTypes[] | undefined>(undefined)
    const [isVisibleSosBtn, setIsVisibleSosBtn] = useState<boolean>(true)
    const [online, setOnline] = useState<string>(isTipConianerVisible ? 'on' : 'off');
    const onlineRef = useRef(null)
    const [isQrCodeScannerModalOpen, setIsQrCodeScannerModalOpen] = useState<boolean>(false)
    const [isPressShareBtn, setIsPressShareBtn] = useState<boolean>(false);

    const [modalVisible, setModalVisible] = useState<ModalTypes>({
        modalVisible: false,
        type: ''
    })
    const snappedPosition = useRef<any | undefined>(undefined);
    const [allowLocation, setAllowLocation] = useState(true);
    const watchId = useRef<number | null>(null);
    const [appState, setAppState] = useState<'active' | 'background' | 'extension' | 'inactive' | 'unknown'>(stateType.active)
    const [askPer, setAskPer] = useState<boolean>(true);
    const [userRegionDelta, setUserRegionDelta] = useState<RegionDeltaProps>({ latitudeDelta: 0.015, longitudeDelta: 0.0121 })
    const [isVisibleWaitingPaymentModal, setIsVisibleWaitingPaymentModal] = useState<boolean>(false)
    const { t } = useTranslation();
    const [isBtnDisable, setIsBtnDisable] = useState(false)
    const [sheetIndex, setSheetIndex] = useState(0);
    useEffect(() => {
        // setTimeout(() => {
        //     setOnline(tipBtnOn ? 'on' : 'off')
        // }, 1000);
        checkPermission()
        const subscribe = AppState.addEventListener('change', (state) => {
            setAppState(state)
            checkPermission().then((res) => {
                setAllowLocation(res)
            })
        })
        return () => subscribe.remove()
    }, []);

    const getScratchAmount = () => {
        // if (paymentMethod == "Card") {
        dispatch(getScrtachCardDetails(rideDetails?.id)).unwrap().then((res) => {
            dispatch(setScrtachCardDetails(res?.data))
        }).catch((error) => {
            console.log("error", error)
        })
        // }
    }

    const checkPermission = async () => {
        let permission
        if (Platform.OS === 'android') {
            permission = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            )
            return permission
        } else {
            permission = await Geolocation.requestAuthorization('whenInUse')
            if (permission == 'granted') {
                return true
            } else {
                return false
            }
        }
    };

    const convertAmountToPhonePeAmountFormat = (amountStr: string) => {
        return Math.floor(parseFloat(amountStr) * 100);
    }

    const appState2 = useMemo(() => appState, [appState]);

    const url = `${RIDE_DETAILS}${rideId}/`
    const ws = useRef<WebSocket>()

    useEffect(() => {
        if (focus) {
            getLocation()
            connectionInit()
        }
        return () => {
            ws?.current?.close()
            setModalVisible({
                modalVisible: false,
                type: ''
            })
            driverLocationRef.current = undefined
            setAllowLocation(true)
            // setDriverLocation(undefined)
            dispatch(setRideStatusReducer(undefined))
            // dispatch(setRideDetailsData(undefined))
            // riderOtpRef.current = undefined
            // stopLocationUpdates()
            bottomSheetRef.current?.close()
        }
    }, [focus])

    // useEffect(() => {
    //     if (allowLocation) {
    //         watchPositionCoords()
    //     } else {
    //         stopLocationUpdates()
    //         // assignDummyLocation()
    //     }
    // }, [allowLocation])

    // useEffect(() => {
    //     CFPaymentGatewayService?.setCallback({
    //         onVerify(orderID: string): void {
    //             console.log('success ', orderID);
    //         },
    //         onError(error: CFErrorResponse, orderID: string): void {
    //             console.log('failed ', orderID);
    //         },
    //     });
    //     return () => CFPaymentGatewayService?.removeCallback();
    // }, []);

    useEffect(() => {
        let locationData: RideLocationTypes[] = []
        if (rideDetails?.rideLocation?.pickup && rideDetails?.rideLocation?.destination) {
            if (rideDetails?.rideLocation?.stop) {
                locationData = [rideDetails?.rideLocation?.pickup, ...rideDetails?.rideLocation?.stop, rideDetails?.rideLocation?.destination]
            } else {
                locationData = [rideDetails?.rideLocation?.pickup, rideDetails?.rideLocation?.destination]
            }
            setLocation(locationData)
        }
    }, [rideDetails?.rideLocation])

    // Auto redirect when book type self
    // useEffect(() => {
    //     const { rideDetails } = store.getState().RideSlice;
    //     if (rideDetails?.bookedFor?.bookedFor === "SELF" && riderLocation) {
    //         mapRef.current?.animateToRegion({
    //             latitude: riderLocation?.latitude,
    //             longitude: riderLocation?.longitude,
    //             latitudeDelta: userRegionDelta.latitudeDelta ?? 0.015,
    //             longitudeDelta: userRegionDelta.longitudeDelta ?? 0.0121,
    //         }, 1000)
    //     }
    // }, [riderLocation])

    useEffect(() => {
        AppState.addEventListener('change', (state) => {
            setAppState(state)
            if (state === 'active') {
                nearByLocation()
            }
        });
    }, [])

    useEffect(() => {
        // ** SOS BTN UNHIDE WHILE END RIDE
        // if (rideStatus == RIDE_STATUS.ENDRIDE) {
        //     setIsVisibleSosBtn(false)
        // } else {
        //     setIsVisibleSosBtn(true)
        // }
        // bottomSheetRef.current?.snapToIndex(0)
        setTimeout(() => {
            bottomSheetRef.current?.expand();
        }, 500);

    }, [rideStatus])

    useEffect(() => {
        onlineRef.current = online
        // dispatch(setTipBtnOn(online == "on"))
        if (rideDetails?.rideStatus == RIDE_STATUS.DRIVER_ALLOCATED) {
            setSnapPoint(["35%", "35%"])
        } else if (rideDetails?.rideStatus == RIDE_STATUS.ONGOING || rideDetails?.rideStatus == RIDE_STATUS.DRIVER_ENDED) {
            setSnapPoint((online == "on" || onlineRef?.current == "on") ? ["45%", "85%"] : store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide ? ["45%", "60%"] : store.getState().RideSlice.isTipConianerVisible ? ["45%", "85%"] : ["50%", "68%"])
            if (online == "on") {
                setTimeout(() => {
                    try {
                        bottomSheetRef.current?.expand()
                        bottomSheetRef.current?.snapToIndex(1)
                    } catch (e) {
                        throw new Error("App crash when open track driver bottom sheet- online");
                    }
                }, 2000);
            } else {
                if (ws?.current?.readyState === WebSocket.OPEN) {
                    ws?.current?.send(JSON.stringify({
                        event: 'update_tip_amount',
                        tip_amount: 0,
                    }));
                }
            }
        }
    }, [online])

    useEffect(() => {
        if (rideDetails?.rideStatus == RIDE_STATUS.DRIVER_ALLOCATED) {
            setSnapPoint(["35%", "35%"])
            setTimeout(() => {
                bottomSheetRef.current?.expand();
            }, 500);
        } else if (rideDetails?.rideStatus == RIDE_STATUS.ONGOING || rideDetails?.rideStatus == RIDE_STATUS.DRIVER_ENDED) {
            setSheetIndex(1)
            setSnapPoint((online == "on" || onlineRef?.current == "on") ? ["45%", "85%"] : store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide ? ["45%", "60%"] : store.getState().RideSlice.isTipConianerVisible ? ["45%", "85%"] : ["50%", "68%"])
            // setTimeout(() => {
            //     try {
            //         bottomSheetRef.current?.snapToIndex(1)
            //     } catch (e) {
            //         throw new Error("App crash when open track driver bottom sheet- rideStatusa" + snapPoint);
            //     }
            // }, 2000);
        }
    }, [rideDetails?.rideStatus])

    useEffect(() => {
        if (ws?.current?.readyState === WebSocket.OPEN) {
            ws?.current?.send(JSON.stringify({
                event: 'update_tip_amount',
                tip_amount: TipAmount,
            }));
        }
    }, [store.getState().RideSlice?.customTip?.toString(), store.getState().RideSlice?.isTipAmount])

    useEffect(() => {
        LayoutAnimation.configureNext({ ...LayoutAnimation.Presets.easeInEaseOut, duration: 200 });
    }, [snapPoint])

    useEffect(() => {
        if (askPer) {
            setAskPer(false)
            setTimeout(() => {
                setAskPer(true);
            }, 5000);
            if (appState2 === 'active') {
                hasLocationPermission().then((res) => {
                    if (!res) {
                        setAllowLocation(false)
                    } else {
                        setAllowLocation(true)
                        if (rideDetails?.id === rideId && rideDetails?.rideStatus === RIDE_STATUS.CANCELLED && res) {
                            setIsVisibleWaitingPaymentModal(false)
                            setTimeout(() => {
                                setModalVisible({
                                    modalVisible: true,
                                    type: 'RideCancel'
                                })
                            }, 500);
                        } else if (rideDetails?.id === rideId && rideDetails?.rideStatus === RIDE_STATUS.COMPLETED && rideDetails?.ridePayment?.paymentMethod === PAYMENT_METHOD.CASH && res) {
                            setIsVisibleWaitingPaymentModal(false)
                            setTimeout(() => {
                                setModalVisible({
                                    modalVisible: true,
                                    type: 'PaymentSuccess'
                                })
                            }, 500);
                        }
                    }
                })
            }
        }
    }, [appState2])

    // useEffect(() => {
    //     if (appState === 'active') {
    //         (async () => {
    //             const hasPermission = await hasLocationPermission();
    //             console.log("🚀 ~ file: TrackDriverScreen.tsx:173 ~ hasPermission:", hasPermission)
    //             if (hasPermission) {
    //                 console.log("🚀 ~ file: TrackDriverScreen.tsx:179 ~ rideDetails:", rideDetails)
    //                 setAllowLocation(true)
    //                 if (rideDetails?.rideStatus === RIDE_STATUS.CANCELLED && hasPermission) {
    //                     setTimeout(() => {
    //                         setModalVisible({
    //                             modalVisible: true,
    //                             type: 'RideCancel'
    //                         })
    //                     }, 500);
    //                 } else if (rideDetails?.rideStatus === RIDE_STATUS.COMPLETED && rideDetails?.ridePayment?.paymentMethod === PAYMENT_METHOD.CASH && hasPermission) {
    //                     setTimeout(() => {
    //                         setModalVisible({
    //                             modalVisible: true,
    //                             type: 'PaymentSuccess'
    //                         })
    //                     }, 500);
    //                 }
    //             } else {
    //                 setAllowLocation(false)
    //             }
    //         })()
    //         console.log("🚀 ~ file: TrackDriverScreen.tsx:171 ~ useEffect ~ appState:", appState)
    //     }
    // }, [appState, rideDetails]);

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
            setLoading(false)
        })

        ws?.current.addEventListener("open", () => {
            console.log("CONNECTION OPEN");
        })

        ws?.current.addEventListener("close", () => {
            console.log("CONNECTION CLOSE");

            if (focus && navigationRef.current?.getCurrentRoute()?.name == "TrackDriverScreen") {
                setTimeout(connectionInit, 2000);
            }
        })

        ws.current.addEventListener('message', (message) => {
            const msgDetails: SocketRideDetailsType = JSON.parse(message.data)
            const { rideBooking, driverLocation, rideBookingOtp } = msgDetails
            console.log("MESSAGE", message.data, driverLocation, rideBooking, rideBookingOtp);
            if (rideBooking && driverLocation) {
                let paymentType = rideBooking?.ridePayment?.paymentMethod
                let paymentCamelCase = paymentType.charAt(0).toUpperCase() + paymentType.slice(1).toLowerCase();

                if (paymentCamelCase !== paymentMethod) {
                    dispatch(setPaymentMethod(paymentCamelCase))
                }
                dispatch(setRideDetailsData(rideBooking))
                dispatch(setDriverDetails(driverLocation))
                // dispatch(setPaymentMethod(rideBooking?.ridePayment?.paymentMethod))
                if (rideBookingOtp) {
                    // riderOtpRef.current = rideBookingOtp
                    dispatch(setRideOtpReducer(Number(rideBookingOtp)))
                }

                if (driverLocation?.points) {
                    const coordinates = decode([{
                        polyline: { "points": driverLocation?.points }
                    }])
                    setDuration(Number(driverLocation?.distance))
                    livePointRef.current = coordinates
                    isTrackingStart.current = driverLocation?.isStartTracking
                    setDirectionCoords(coordinates)
                }
                if (rideStatus !== RIDE_STATUS.ENDRIDE) {
                    if (rideStatus === undefined || rideStatus === RIDE_STATUS.DRIVER_ALLOCATED || rideStatus === RIDE_STATUS.ONGOING || rideStatus === RIDE_STATUS.DRIVER_ENDED) {
                        dispatch(setRideStatusReducer(rideBooking.rideStatus))
                    }
                }
                // if (rideDetails?.rideStatus == RIDE_STATUS.ONGOING) {
                //     setTimeout(() => {
                //         setSnapPoint(["45%", "68%"])
                //     }, 200);
                // }
                const driverCoords = {
                    latitude: Number(driverLocation?.latitude),
                    longitude: Number(driverLocation?.longitude)
                }
                const snappedPositionn = findNearestIndex({ latitude: Number(driverLocation?.latitude), longitude: Number(driverLocation?.longitude) }, livePointRef.current ?? routeTrackList);
                driverLocationRef.current = driverCoords
                snappedPosition.current = snappedPositionn
                // if (rideBooking?.rideStatus === RIDE_STATUS.ONGOING) {
                //     dispatch(resetRideOtpReducer())
                // }

                // if (rideBooking?.bookedFor?.bookedFor !== "SELF") {
                //     mapRef.current?.animateToRegion({
                //         latitude: driverCoords?.latitude,
                //         longitude: driverCoords?.longitude,
                //         latitudeDelta: userRegionDelta.latitudeDelta ?? 0.015,
                //         longitudeDelta: userRegionDelta.longitudeDelta ?? 0.0121,
                //     }, 1000)
                // }

                if (rideBooking?.rideStatus === RIDE_STATUS.CANCELLED) {
                    setIsVisibleWaitingPaymentModal(false)
                    // dispatch(resetRideOtpReducer())
                    setTimeout(() => {
                        setModalVisible({
                            modalVisible: true,
                            type: 'RideCancel'
                        })
                        dispatch(setRideStatusReducer(undefined))
                    }, 200);
                    dispatch(setPaymentMethod("Card"))
                } else if (rideBooking?.rideStatus === RIDE_STATUS.COMPLETED && (rideBooking.ridePayment.paymentMethod === PAYMENT_METHOD.CASH || rideBooking.ridePayment.paymentMethod === PAYMENT_METHOD.UPI || rideBooking.ridePayment.paymentMethod === "CARD") && allowLocation) {
                    setIsVisibleWaitingPaymentModal(false)
                    // dispatch(resetRideOtpReducer())
                    setTimeout(() => {
                        setModalVisible({
                            modalVisible: true,
                            type: 'PaymentSuccess'
                        })
                        dispatch(setRideStatusReducer(undefined))
                    }, 200);
                } else {
                    // setDriverLocation(driverCoords)
                    nearByLocation()
                }
            }
        })
    };

    const nearByLocation = () => {
        const { rideStatus: rideStatusData, rideDetails: rideDetailsData } = store.getState().RideSlice
        if (rideStatusData === RIDE_STATUS.DRIVER_ALLOCATED && driverLocationRef?.current && rideDetailsData?.rideLocation?.pickup) {
            checkUserIsNearByOrNot()
            // getDistanceFromLatLonInKm(driverLocationRef?.current, {
            //     latitude: rideDetailsData?.rideLocation?.pickup?.latitude,
            //     longitude: rideDetailsData?.rideLocation?.pickup?.longitude
            // }).then((res) => {
            //     checkUserIsNearByOrNot(res)
            // }).catch((error) => {
            //     console.log("🚀 ~ file: TrackDriverScreen.tsx:182 ~ Geolocation.getCurrentPosition ~ error:", error)
            // })
        }
        else if ((rideStatusData === RIDE_STATUS.ONGOING || rideStatusData === RIDE_STATUS.DRIVER_ENDED) && driverLocationRef?.current) {
            if (rideDetailsData?.rideLocation?.destination) {
                checkUserIsNearByOrNot(0)
                // getDistanceFromLatLonInKm(driverLocationRef?.current, {
                //     latitude: rideDetailsData?.rideLocation?.destination?.latitude,
                //     longitude: rideDetailsData?.rideLocation?.destination?.longitude
                // }
                // ).then((res) => {
                //     checkUserIsNearByOrNot(res)
                // }).catch((error) => {
                //     console.log("🚀 ~ file: TrackDriverScreen.tsx:182 ~ Geolocation.getCurrentPosition ~ error:", error)
                // })
            }
        }
    };

    const checkUserIsNearByOrNot = (km?: number) => {
        const { rideStatus: rideStatusData, rideDetails: rideDetailsData } = store.getState().RideSlice
        if (rideDetailsData?.rideStatus == RIDE_STATUS.ONGOING || rideDetailsData?.rideStatus == RIDE_STATUS.DRIVER_ENDED) {
            setSnapPoint((online == "on" || onlineRef?.current == "on") ? ["45%", "85%"] : store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide ? ["45%", "60%"] : store.getState().RideSlice.isTipConianerVisible ? ["45%", "85%"] : ["50%", "68%"])
        } else {
            dispatch(setRideStatusReducer(rideDetailsData?.rideStatus))
        }
        // if (km <= 300) {
        //     if (rideDetailsData?.rideStatus === RIDE_STATUS.ONGOING) {
        //         if (rideStatusData !== RIDE_STATUS.ENDRIDE) {
        //             if (rideDetailsData?.ridePayment?.paymentMethod === PAYMENT_METHOD.UPI || rideDetailsData?.ridePayment?.paymentMethod === PAYMENT_METHOD.CASH || rideDetailsData?.ridePayment?.paymentMethod === "CARD") {
        //                 dispatch(setRideStatusReducer(RIDE_STATUS.ENDRIDE))
        //             }
        //         }
        //         // else {
        //         //     if (rideDetailsData?.ridePayment?.paymentStatus === RIDE_STATUS.COMPLETED) {
        //         //         rideDetails?.id && navigation.navigate('RateDriverScreen', {
        //         //             rideId: rideDetails?.id
        //         //         })
        //         //     }
        //         // }
        //     }
        // } else {
        // }
    };

    const details = {
        Drivername: rideDetails?.driver?.name,
        DriverPhonenumber: rideDetails?.driver?.phoneNumber,
        DriverCar: rideDetails?.driverCar?.name,
        DiverCarNumber: rideDetails?.driverCar?.registrationNumber,
        PaymentMethod: rideDetails?.ridePayment.paymentMethod,
        TotalAmount: rideDetails?.ridePayment.totalFare,
        pickUploaction: rideDetails?.rideLocation?.pickup?.address,
        dropLocation: rideDetails?.rideLocation?.destination?.address
    }

    const codeScanner = useCodeScanner({
        codeTypes: ['qr', 'ean-13'],
        onCodeScanned: (codes) => {
            if (codes.length !== 0 && codes[0]?.value) {
                setIsQrCodeScannerModalOpen(false)
                setTimeout(() => {
                    Linking.openURL(codes[0]?.value ?? "").then(res => {
                        setIsVisibleWaitingPaymentModal(true)
                        console.log({ res })
                    }).catch(e => {
                        AppAlert(`${t(TranslationKeys.note)}!`, t(TranslationKeys.we_are_not_found_any_upi_payment_app))
                    })
                }, 500);
            }
            console.log(`Scanned ${codes.length} codes!,`, { codes }, codes[0].value)
        }
    })

    const getDistanceFromLatLonInKm = (start: CoordsTypes, end: CoordsTypes) => {
        let url = `${GOOGLE_MAP_NAVIGATION}origin=${start.latitude + "," + start.longitude}&destination=${end.latitude + "," + end.longitude}&optimize_waypoints=true&mode=driving&language=en&region=undefined&key=${store.getState().AuthSlice.commonCredentialsData?.googleApiKey}`
        const distance = fetch(url)
            .then(res => res.json())
            .then((res) => {
                console.log({ res })
                return res?.routes[0].legs[0].distance.value
            }).catch((e) => {
                console.log("🚀 ~ file: StartAndEndRideScreen.tsx:97 ~ .then ~ e:", e)
                return null
            })
        return distance
    };

    const getLocation = async () => {
        const hasPermission = await hasLocationPermission();

        if (!hasPermission) {
            setAllowLocation(false)
            setLoading(false)
            return;
        }

        setAllowLocation(true)
        await getCurrentPosition().then((res) => {
            const { latitude, longitude } = res?.coords
            setRiderLocation({
                latitude: latitude,
                longitude: longitude
            })
            setLoading(false)
        }).catch(() => {
            // assignDummyLocation()
            setLoading(false)
        })
    };

    const watchPositionCoords = async () => {
        const hasPermission = await hasLocationPermission();

        if (!hasPermission) {
            setAllowLocation(false)
            setLoading(false)
            return;
        }

        watchId.current = Geolocation.watchPosition(
            res => {
                const { latitude, longitude } = res?.coords
                setRiderLocation({
                    latitude: latitude,
                    longitude: longitude
                })
                setLoading(false)
            },
            error => {
                // assignDummyLocation()
                setLoading(false)
            }, {
            ...LOCATION_WATCH_OPTION,
            interval: 2000,
            fastestInterval: 2000,
        },
        );
    };

    // stope watch postion
    // const stopLocationUpdates = () => {
    //     if (watchId.current !== null) {
    //         Geolocation.clearWatch(watchId.current);
    //         watchId.current = null;
    //     }
    // };

    const assignDummyLocation = () => {
        const userCordinates = {
            longitude: 72.88746321772949,
            latitude: 21.23814020005119
        }
        setRiderLocation(userCordinates)
    };

    const navigateToGoogleMap = () => {
        if (rideDetails?.rideLocation?.pickup && rideDetails?.rideLocation?.destination) {
            const startLocation = {
                latitude: rideDetails?.rideLocation?.pickup?.latitude,
                longitude: rideDetails?.rideLocation?.pickup?.longitude
            }
            const endLocation = {
                latitude: rideDetails?.rideLocation?.destination?.latitude,
                longitude: rideDetails?.rideLocation?.destination?.longitude
            }
            const data = {
                origin: startLocation,
                destination: endLocation,
                waypoints: rideDetails?.rideLocation?.stop ?? []
            }
            const mapUrl = mapNavigation(data)
            try {
                mapUrl && Linking.openURL(mapUrl).then((res) => { }).catch((error) => {
                    AppAlert(t(TranslationKeys.Message), t(TranslationKeys.we_are_not_able_find_google_map_alert), () => {
                        redirectToGoogleMapsApp()
                    }, () => { })
                })
            } catch (error) {
                console.log("🚀  file: StartAndndRideScreen.tsx:259  navigateToGoogleMap ~ error:", error)
            }
        }

    };

    const redirectToGoogleMapsApp = () => {
        const url = Platform.select({
            ios: APPSTORE_GOOGLE_MAP,
            android: PLAYSTORE_GOOGLE_MAP,
        });
        url && Linking.openURL(url)
            .catch((error) => console.log('Error opening Google Maps app store:', error));
    };

    const mapNavigation = ({ origin, destination, waypoints }: MapNavigationProps) => {
        let mapUrl
        const waypointsString = waypoints && waypoints?.length !== 0 && (Platform.OS == 'android' ? waypoints : [...waypoints, destination])?.map(waypoint => `${waypoint.latitude},${waypoint.longitude}`).join(Platform.OS == "android" ? '|' : '+to:');
        if (Platform.OS == "android") {
            if (waypointsString) {
                mapUrl = `google.navigation:q=${destination.latitude},${destination.longitude}&dirflg=d&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=${waypointsString}`
            } else {
                mapUrl = `google.navigation:q=${destination.latitude},${destination.longitude}&dirflg=d&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`
            }
        } else {
            // const waypointsString = waypoints && waypoints?.length !== 0 && [...waypoints, destination].map(waypoint => `${waypoint.latitude},${waypoint.longitude}`).join('+to:');
            if (waypointsString) {
                mapUrl = `comgooglemaps://\?&saddr=${origin.latitude},${origin.longitude}&daddr=${waypointsString}&travelmode=driving&dir_action=navigate`
            } else {
                mapUrl = `comgooglemaps://\?daddr=${destination.latitude},${destination.longitude}&saddr=${origin.latitude},${origin.longitude}&directionsmode=driving&navigate=yes`
            }
        }
        return mapUrl
    };

    // const initializePaymentSheet = async () => {
    //     setLoading(true)
    //     if (rideDetails?.ridePayment?.paymentClientSecret && rideDetails?.ridePayment?.paymentIntent) {
    //         const { error } = await initPaymentSheet({
    //             customerId: rideDetails?.ridePayment?.customerId,
    //             paymentIntentClientSecret: rideDetails?.ridePayment?.paymentClientSecret,
    //             merchantDisplayName: 'com.passengerapp',
    //             customerEphemeralKeySecret: rideDetails?.ridePayment?.emperialKey
    //         });
    //         if (!error) {
    //             openPaymentSheet()
    //         } else {
    //             setLoading(false);
    //         }
    //     } else {
    //         setLoading(false);
    //     }
    // };
    const initializePayment = (tip: number, payment_type: string, totalAmount: number) => {
        setIsBtnDisable(true)
        const data = new FormData()
        data.append("payment_type", payment_type.toUpperCase())
        data.append("tip_amount", tip)
        data.append("total_amount", totalAmount)
        if (payment_type.toUpperCase() === PAYMENT_METHOD.CASH) {
            data.append("has_rider_pay", "True")
        }
        const params = {
            rideId: rideId,
            formData: data
        }
        if ((rideDetails?.rideStatus === RIDE_STATUS.ONGOING || rideDetails?.rideStatus === RIDE_STATUS.DRIVER_ENDED) && store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide && rideDetails?.ridePayment?.paymentMethod === "CARD") {
            dispatch(endRideCardPayment(rideDetails?.id)).unwrap().then((response) => {
                setIsBtnDisable(false)
                setIsQrCodeScannerModalOpen(false)
                setTimeout(() => {
                    setModalVisible({
                        modalVisible: true,
                        type: 'PaymentSuccess'
                    })
                }, 500);
            }).catch((e: any) => {
                setIsBtnDisable(false)
            })
        } else {
            dispatch(makeRidePayment(params)).unwrap()
                .then(res => {
                    if (res?.paymentMethod === "UPI") {
                        setIsBtnDisable(false)
                        setIsQrCodeScannerModalOpen(true)
                    } else if (res?.payment?.paymentMethod == "CARD" && !store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide) {
                        var options = {
                            description: 'RYD',
                            image: tokenDetail?.userData?.profilePic ?? ImagesPaths.EMPTY_IMAGE,
                            currency: 'INR',
                            key: store.getState().AuthSlice.commonCredentialsData?.keyId,
                            // callback_url: 'https://www.figma.com/file/9X2YMvbPn5jaOuTcFwD1cx/Taxi-booking-Mobille-App-Driver-%26-Passenger-%26-Admin-(Copy)?type=design&node-id=2923-30541&t=PMTCn4rno94UCJHP-0',
                            redirect: true,
                            amount: totalAmount * 100,
                            name: tokenDetail?.userData?.name,
                            order_id: res?.razorpayResponse?.orderId,//Replace this with an order_id created using Orders API.
                            prefill: {
                                // email: tokenDetail?.userData?.email,
                                contact: tokenDetail?.userData?.phoneNumber,
                                // name: 'testing'
                            },
                            theme: { color: colors.PRIMARY },
                            method: {
                                // credit: false, // Disable Pay Later option
                                netbanking: true, // Enable net banking
                                card: true, // Enable card payments
                                upi: true,
                                wallet: true, // Disable wallets
                                paylater: false
                            }
                        }
                        RazorpayCheckout.open(options as any).then((data: { razorpay_payment_id: any; }) => {
                            setIsBtnDisable(false)
                            console.log("🚀  file: SelectPaymentModeScreen.tsx:163  RazorpayCheckout.open ~ data:", data)
                            // handle success
                            // Alert.alert(`Success: ${data.razorpay_payment_id}`);
                            setIsQrCodeScannerModalOpen(false)
                            // setIsVisibleWaitingPaymentModal(true)
                            setTimeout(() => {
                                setModalVisible({
                                    modalVisible: true,
                                    type: 'PaymentSuccess'
                                })
                            }, 500);

                        }).catch((error: { code: any; description: any; }) => {
                            // handle failure
                            setIsBtnDisable(false)
                            if (error.code === 0) {
                                AppAlert(t(TranslationKeys.Message), 'Cancelled by user')
                            } else {
                                Alert.alert(`${t(TranslationKeys.error)} ${error.code} \n ${error.description}`);
                            };
                        });
                    } else {
                        setIsBtnDisable(false)
                        setIsQrCodeScannerModalOpen(false)
                        setIsVisibleWaitingPaymentModal(true)
                        // AppAlert("Note!", "Waiting for driver's payment approval", () => { })
                    }
                    console.log({ res })
                }).catch(e => {
                    console.log({ e })
                    setIsBtnDisable(false)
                })
        }
    }

    // const openPaymentSheet = async () => {
    //     const { error } = await presentPaymentSheet();
    //     if (error) {
    //         if (error.code !== 'Canceled') {
    //             AppAlert(error.code, error.message, () => { }, () => { })
    //         }
    //         setLoading(false);
    //     } else {
    //         setLoading(false);
    //         rideDetails?.id && navigation.navigate('RateDriverScreen', { rideId: rideDetails?.id })
    //     }
    // };

    // const calculateHeading = (cord1: CoordsTypes, cord2: CoordsTypes) => {
    //     if (cord2) {
    //         const { latitude: lat1, longitude: lng1 } = cord1;
    //         const { latitude: lat2, longitude: lng2 } = cord2;
    //         const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    //         const x =
    //             Math.cos(lat1) * Math.sin(lat2) -
    //             Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
    //         const θ = Math.atan2(y, x);
    //         const brng = ((θ * 180) / Math.PI + 360) % 360;
    //         return brng;
    //     }
    //     return 0;
    // };

    const calculateHeading = (cord1: CoordsTypes, cord2: CoordsTypes): number => {
        if (cord1 && cord2) {
            // Convert latitude and longitude from degrees to radians
            const toRadians = (degrees: number): number => degrees * (Math.PI / 180);
            const toDegrees = (radians: number): number => radians * (180 / Math.PI);

            const lat1Rad = toRadians(cord1?.latitude);
            const lon1Rad = toRadians(cord1?.longitude);
            const lat2Rad = toRadians(cord2?.latitude);
            const lon2Rad = toRadians(cord2?.longitude);

            // Calculate differences
            const dLon = lon2Rad - lon1Rad;

            // Calculate heading using atan2
            const y = Math.sin(dLon) * Math.cos(lat2Rad);
            const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

            // Convert heading from radians to degrees
            let heading = Math.atan2(y, x);
            heading = toDegrees(heading);

            // Normalize heading to be between 0 and 360 degrees
            heading = (heading + 360) % 360;
            return heading;
        }
        return 0;
    };

    const onChangePayment = () => {
        if (ws?.current?.readyState === WebSocket.OPEN) {
            ws?.current?.send(JSON.stringify({
                event: 'change_payment_method',
                new_payment_method: selectPaymentMethod === "Card" ? "CARD" : 'CASH',
            }));
        }
        dispatch(setPaymentMethod(selectPaymentMethod))
    }
    const [isBtnDiabled, setIsBtnDiabled] = useState(false)
    const isRideBefore = store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide
    const isBeforeWithCard = store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide && paymentMethod == "Card"
    const TipAmount = online == "on" ? store.getState().RideSlice?.customTip?.toString() !== "" ? store.getState().RideSlice?.customTip?.toString() : store.getState().RideSlice?.isTipAmount : 0
    const paymentAmount = (Number(rideDetails?.ridePayment?.totalFare))

    // const renderFooter = useCallback(
    //     (props: React.JSX.IntrinsicAttributes & BottomSheetDefaultFooterProps) => {
    //         // if (sheetIndex === 0) return null;
    //         if (rideDetails?.rideStatus !== RIDE_STATUS.ONGOING && rideDetails?.rideStatus !== RIDE_STATUS.DRIVER_ENDED) return null;
    //         return (
    //             <BottomSheetFooter {...props} bottomInset={0} style={{ backgroundColor: colors.SECONDARY_BACKGROUND }}>
    //                 <View style={{
    //                     paddingHorizontal: wp(6),
    //                     paddingBottom: wp(2),
    //                 }}>
    //                     <TouchableOpacity
    //                         disabled={(!isBeforeWithCard && (isBtnDiabled || rideDetails?.rideStatus !== RIDE_STATUS.DRIVER_ENDED)) || isBtnDisable}
    //                         onPress={() => {
    //                             setIsBtnDiabled(true)
    //                             if (rideDetails?.ridePayment?.paymentStatus !== PAYMENT_METHOD.UPI && rideDetails?.ridePayment.paymentStatus === RIDE_STATUS.COMPLETED && rideDetails?.id) {
    //                                 navigation.navigate('RateDriverScreen', { rideId: rideDetails?.id })
    //                                 setIsBtnDiabled(false)
    //                             } else {
    //                                 if (rideDetails?.id) {
    //                                     // stripe open
    //                                     initializePayment(store.getState().RideSlice.isTipAmount !== 0 ? (store.getState().RideSlice.isTipAmount) : store.getState().RideSlice.customTip != '' ? store.getState().RideSlice.customTip : 0, paymentMethod, rideDetails?.ridePayment?.totalFare ?? 0)
    //                                     setIsBtnDiabled(false)
    //                                 }
    //                             }
    //                         }}
    //                         style={[GlobalStyles.primaryBtnStyle, { flexDirection: 'row', marginBottom: 0, backgroundColor: !isBeforeWithCard && (isBtnDiabled || props.rideStatus !== RIDE_STATUS.DRIVER_ENDED) ? colors.SECONDARY_DOTTED_BORDER : colors.PRIMARY }]}>
    //                         <Image source={Icons.CARD} style={Styles.makePaymentIcon} />
    //                         {(rideDetails?.rideStatus === RIDE_STATUS.ONGOING || rideDetails?.rideStatus == RIDE_STATUS.DRIVER_ENDED) && store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide && rideDetails?.ridePayment?.paymentMethod === "CARD" ? <Text style={Styles.makePaymentText}>{rideDetails?.deliveryDetails ? t(TranslationKeys.end_delivery) : t(TranslationKeys.end_ride)}</Text>
    //                             :
    //                             <Text style={Styles.makePaymentText}>{t(TranslationKeys.pay) + " " + `${setPrice(t, 0, true, true)}` + ' ' + paymentAmount.toFixed(2)}</Text>
    //                         }
    //                     </TouchableOpacity>
    //                 </View>
    //             </BottomSheetFooter>
    //         )
    //     },
    //     [rideDetails]
    // );

    const renderFooter = (props: any, rideDetails: any) => {
        // if (sheetIndex === 0) return null;
        if (rideDetails?.rideStatus !== RIDE_STATUS.ONGOING && rideDetails?.rideStatus !== RIDE_STATUS.DRIVER_ENDED) return null;
        return (
            <BottomSheetFooter {...props} bottomInset={0} style={{ backgroundColor: colors.SECONDARY_BACKGROUND }}>
                <View style={{
                    paddingHorizontal: wp(6),
                    paddingBottom: wp(2),
                }}>
                    <TouchableOpacity
                        disabled={(!isBeforeWithCard && (isBtnDiabled || rideDetails?.rideStatus !== RIDE_STATUS.DRIVER_ENDED)) || isBtnDisable}
                        onPress={() => {
                            setIsBtnDiabled(true)
                            if (rideDetails?.ridePayment?.paymentStatus !== PAYMENT_METHOD.UPI && rideDetails?.ridePayment.paymentStatus === RIDE_STATUS.COMPLETED && rideDetails?.id) {
                                navigation.navigate('RateDriverScreen', { rideId: rideDetails?.id })
                                setIsBtnDiabled(false)
                            } else {
                                if (rideDetails?.id) {
                                    // stripe open
                                    initializePayment(store.getState().RideSlice.isTipAmount !== 0 ? (store.getState().RideSlice.isTipAmount) : store.getState().RideSlice.customTip != '' ? store.getState().RideSlice.customTip : 0, paymentMethod, rideDetails?.ridePayment?.totalFare ?? 0)
                                    setIsBtnDiabled(false)
                                }
                            }
                        }}
                        style={[GlobalStyles.primaryBtnStyle, { flexDirection: 'row', marginBottom: 0, backgroundColor: ((!isBeforeWithCard && (isBtnDiabled || rideDetails?.rideStatus !== RIDE_STATUS.DRIVER_ENDED)) || isBtnDisable) ? colors.SECONDARY_DOTTED_BORDER : colors.PRIMARY }]}>
                        <Image source={Icons.CARD} style={Styles.makePaymentIcon} />
                        {(rideDetails?.rideStatus === RIDE_STATUS.ONGOING || rideDetails?.rideStatus == RIDE_STATUS.DRIVER_ENDED) && store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide && rideDetails?.ridePayment?.paymentMethod === "CARD" ? <Text style={Styles.makePaymentText}>{rideDetails?.deliveryDetails ? t(TranslationKeys.end_delivery) : t(TranslationKeys.end_ride)}</Text>
                            :
                            <Text style={Styles.makePaymentText}>{t(TranslationKeys.pay) + " " + `${setPrice(t, 0, true, true)}` + ' ' + paymentAmount.toFixed(2)}</Text>
                        }
                    </TouchableOpacity>
                </View>
            </BottomSheetFooter>
        )
    }

    return (
        <SafeAreaView edges={['top']} style={GlobalStyles.container}>
            {(isLoading || loading || makePaymentLoading || !directionCoords || !driverLocationRef || !rideDetails) ?
                <ActivityIndicator
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 999999999999999,
                        backgroundColor: colors.SHADOW_2,
                    }}
                    color={colors.SECONDARY_BACKGROUND}
                    size={'large'}
                /> : null}
            {
                !allowLocation ?
                    <ReactNativeModal
                        style={{
                            margin: 0,
                        }}
                        isVisible={!allowLocation ? true : false}>
                        <View style={Styles.locationModalContainer}>
                            <Image source={Icons.LOCATION_ICON} style={Styles.locationModalLocationIcon} />
                            <Text style={Styles.locationModalPermissionTxt}>{t(TranslationKeys.location_permission)}</Text>
                            <CustomPrimaryButton
                                onPress={() => Linking.openSettings()}
                                title={t(TranslationKeys.go_to_settings)} style={[GlobalStyles.primaryBtnStyle, Styles.locationModalSettingBtn]} />
                        </View>
                    </ReactNativeModal>
                    : null
            }
            {rideStatus !== RIDE_STATUS.ENDRIDE &&
                <CustomIconButton
                    onPress={() => {
                        if (showBottomBtn) {
                            setSnapPoint(["35%", "35%"])
                            setShowBottomBtn(false)
                            bottomSheetRef.current?.expand();
                            // bottomSheetRef.current?.snapToIndex(0)
                        } else {
                            navigation.goBack()
                        }
                    }} icon={Icons.LEFT_ARROW_ICON}
                    iconStyle={GlobalStyles.commonIconStyle}
                    style={Styles.headerIconStyle} />}
            <CustomMapContainer
                ref={mapRef}
                region={{
                    latitude: driverLocationRef?.current?.latitude - 0.006 || userCordinates?.latitude - 0.006 || 21.23814020005119 - 0.006,
                    longitude: driverLocationRef?.current?.longitude || userCordinates?.longitude || 72.88746321772949,
                    latitudeDelta: userRegionDelta?.latitudeDelta || 0.015,
                    longitudeDelta: userRegionDelta?.longitudeDelta || 0.0121,
                }}
                style={{ flex: 1 }}
            // showsUserLocation={rideDetailsRef.current?.rideStatus === RIDE_STATUS.ONGOING}
            // onUserLocationChange={(event) => {
            //     if (event?.nativeEvent?.coordinate?.latitude && event?.nativeEvent?.coordinate?.longitude) {
            //         setRiderLocation({
            //             latitude: event?.nativeEvent?.coordinate?.latitude,
            //             longitude: event?.nativeEvent?.coordinate?.longitude,
            //         })
            //     }
            // }}
            // onRegionChangeComplete={(region) => {
            //     const { latitudeDelta, longitudeDelta } = region;
            //     setUserRegionDelta({ latitudeDelta: latitudeDelta, longitudeDelta: longitudeDelta })
            // }}
            >
                {/* track driver live location */}
                {/* <CustomUserMarkerView
                    icon={ImagesPaths.CAR_IMAGE}
                    iconStyle={{
                        tintColor: undefined
                    }}
                    rotation={calculateHeading(directionCoords[2], directionCoords[1])}
                    coordinate={directionCoords[0]}
                // rotation={calculateHeading(directionCoords[Math.floor(directionCoords?.length / 2) - 5], directionCoords[Math.floor(directionCoords?.length / 2) - 4])}
                // rotation={calculateHeading(directionCoords[Math.floor(directionCoords.length / 2) - 5], directionCoords[Math.floor(directionCoords.length / 2) - 6])}
                /> */}

                {(directionCoords && driverLocationRef.current) ?

                    <>
                        {isTrackingStart.current && (

                            <CustomUserMarkerView
                                zIndex={99999}
                                iconImage={ImagesPaths.CAR_IMAGE}
                                iconStyle={{
                                    tintColor: undefined
                                }}
                                coordinate={driverLocationRef.current}
                                rotation={calculateHeading(snappedPosition?.current?.prevPoint, snappedPosition?.current?.nextPoint)}
                            />
                        )}
                        <CustomUserMarkerView
                            zIndex={5}
                            coordinate={directionCoords[0]}
                            iconImage={!isTrackingStart.current ? ImagesPaths.CAR_IMAGE : Icons.DESTINATION_LOCATION_ICON}
                            iconStyle={{
                                width: !isTrackingStart.current ? wp(10) : wp(20),
                                height: !isTrackingStart.current ? wp(10) : wp(20),
                                tintColor: undefined
                            }} />
                    </>
                    :
                    null}

                {driverLocationRef?.current && rideDetails?.rideStatus === RIDE_STATUS.DRIVER_ALLOCATED ?
                    <>
                        {/* <CustomUserMarkerView zIndex={9999} coordinate={driverLocation} /> */}
                        {/* Driver allocated destination marker */}
                        <CustomUserMarkerView
                            zIndex={5}
                            coordinate={location[0]}
                            iconImage={Icons.DESTINATION_LOCATION_ICON}
                            iconStyle={{
                                width: wp(20),
                                height: wp(20),
                                tintColor: undefined
                            }} />

                        {!!livePointRef?.current ?
                            <Polyline
                                coordinates={livePointRef?.current}
                                strokeWidth={3}
                                fillColor={colors.SECONDARY_ICON}
                                strokeColor={colors.SECONDARY_ICON}
                            /> : null
                        }
                        {!!directionCoords && directionCoords?.length !== 0 && location?.length != 0 && (
                            <Polyline
                                coordinates={[
                                    { latitude: location[0]?.latitude, longitude: location[0]?.longitude },
                                    { latitude: directionCoords[directionCoords?.length - 1]?.latitude, longitude: directionCoords[directionCoords?.length - 1]?.longitude },
                                    // directionCoords[directionCoords?.length - 1],
                                ]}
                                strokeWidth={3}
                                fillColor={colors.SECONDARY_ICON}
                                strokeColor={colors.SECONDARY_ICON}
                                {...(Platform.OS === "android" ? { lineDashPattern: [2, 2] } : {})}
                            />
                        )}
                    </>
                    :
                    null}
                {/* {riderLocation && rideStatus !== RIDE_STATUS.DRIVER_ALLOCATED  ? <CustomUserMarkerView
                    iconImage={ImagesPaths.CAR_IMAGE}
                    coordinate={{
                        latitude: riderLocation.latitude,
                        longitude: riderLocation.longitude
                    }}
                    flat={true}
                    rotation={riderLocation.heading}
                    iconStyle={{
                        tintColor: undefined,
                        zIndex: 20
                    }}
                /> : null} */}

                {/* ongoing destination marker */}
                {
                    (rideDetails?.rideStatus === RIDE_STATUS.ONGOING || rideDetails?.rideStatus === RIDE_STATUS.DRIVER_ENDED) ?
                        <>
                            {location?.map((item, index) => {
                                // if (index == 0) {
                                //     return (
                                //         <CustomUserMarkerView
                                //             zIndex={index + 5}
                                //             iconStyle={{ tintColor: colors.GREEN_ICON }}
                                //             coordinate={{
                                //                 latitude: item?.latitude,
                                //                 longitude: item?.longitude
                                //             }}
                                //         />
                                //     )
                                // }  
                                if (index == location?.length - 1) {
                                    return (
                                        <CustomUserMarkerView
                                            zIndex={index + 5}
                                            iconImage={Icons.DESTINATION_LOCATION_ICON}
                                            iconStyle={{
                                                tintColor: undefined,
                                                width: wp(20),
                                                height: wp(20),
                                                resizeMode: 'contain'
                                            }}
                                            coordinate={{
                                                latitude: item?.latitude,
                                                longitude: item?.longitude
                                            }}
                                        />
                                    )
                                }
                                // else {
                                //     return (
                                //         <CustomUserMarkerView
                                //             zIndex={index + 5}
                                //             coordinate={{
                                //                 latitude: item?.latitude,
                                //                 longitude: item?.longitude
                                //             }}
                                //         />
                                //     )
                                // }
                            })}
                            {/* {riderLocation ?
                                <CustomUserMarkerView
                                    zIndex={99999}
                                    iconImage={ImagesPaths.CAR_IMAGE}
                                    iconStyle={{
                                        tintColor: undefined
                                    }} coordinate={riderLocation} />
                                :
                                null} */}

                            {!!livePointRef?.current && <Polyline
                                coordinates={livePointRef?.current}
                                strokeWidth={3}
                                fillColor={colors.SECONDARY_ICON}
                                strokeColor={colors.SECONDARY_ICON}
                            />}
                            {!!directionCoords && directionCoords?.length !== 0 && location?.length != 0 && (
                                <Polyline
                                    coordinates={[
                                        { latitude: location[1]?.latitude, longitude: location[1]?.longitude },
                                        { latitude: directionCoords[directionCoords?.length - 1]?.latitude, longitude: directionCoords[directionCoords?.length - 1]?.longitude },
                                        // directionCoords[directionCoords?.length - 1],
                                    ]}
                                    strokeWidth={3}
                                    fillColor={colors.SECONDARY_ICON}
                                    strokeColor={colors.SECONDARY_ICON}
                                    {...(Platform.OS === "android" ? { lineDashPattern: [2, 2] } : {})}
                                />
                            )}

                        </>
                        : null
                }

            </CustomMapContainer>
            {modalVisible.modalVisible ?
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
                        {
                            modalVisible?.type === "RideCancel"
                                ?
                                <>
                                    <Text style={Styles.headingText}>{rideDetails?.rideCancelBy?.isDisputed ? t(TranslationKeys.booking_disputed) : t(TranslationKeys.booking_Cancelled)}</Text>
                                    <Text style={[GlobalStyles.subTitleStyle, Styles.subtitleText]}>{rideDetails?.rideCancelBy?.isDisputed ? t(TranslationKeys.disputed_statement) : t(TranslationKeys.cancellation_statement)}&nbsp;{rideDetails?.rideCancelBy?.reason}</Text>
                                </>
                                : null
                        }
                        {
                            modalVisible?.type === "PaymentSuccess"
                                ?
                                <>
                                    <Text style={Styles.headingText}>{!isRideBefore ? t(TranslationKeys.payment_success) : rideDetails?.deliveryDetails ? t(TranslationKeys.delivery_completed_success) : t(TranslationKeys.ride_completed_success)}</Text>
                                    <Text style={[GlobalStyles.subTitleStyle, Styles.subtitleText]}>{!isRideBefore ? t(TranslationKeys.payment_statement) : rideDetails?.deliveryDetails ? t(TranslationKeys.payment_statement_delivery) : t(TranslationKeys.payment_statement_ride)}</Text>
                                </>
                                : null
                        }
                    </View>
                    <CustomBottomBtn onPress={() => {
                        getScratchAmount()
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
                        } else {
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
                            // navigation.reset({
                            //     index: 1,
                            //     routes: [{
                            //         name: 'DrawerStack',
                            //     },
                            //     {
                            //         name: 'RateDriverScreen',
                            //         params: {
                            //             rideId: rideDetails?.id
                            //         }
                            //     }]
                            // })
                        }
                    }} title={modalVisible?.type === "RideCancel" ? t(TranslationKeys.got_it) : rideDetails?.deliveryDetails ? t(TranslationKeys.view_delivery_bill) : t(TranslationKeys.view_ride_bill)}
                    // style={Styles.completedButton}
                    />
                </Modal>
                : null}

            <CustomIconButton
                onPress={() => {
                    if (driverLocationRef.current) {
                        mapRef.current?.animateToRegion({
                            latitude: driverLocationRef?.current?.latitude - 0.006,
                            longitude: driverLocationRef?.current.longitude,
                            latitudeDelta: userRegionDelta.latitudeDelta ?? 0.015,
                            longitudeDelta: userRegionDelta.longitudeDelta ?? 0.0121,
                        }, 1000)
                    }
                }}
                icon={Icons.LOCATION_ICON}
                style={[Styles.userLocationIconBtnStyle, { bottom: `${parseInt(snapPoint[0]) + (Platform.OS == "ios" ? hasNotch() ? wp(2.5) : wp(3) : wp(2.0))}%` }]}
                iconStyle={Styles.userLocationIconStyle}
            />
            <TouchableOpacity style={[Styles.floatingChatBtnContainer, { bottom: "60%", }]}
                onPress={() => {
                    dispatch(setRideDetailsData(undefined));
                    (rideDetails?.id && rideDetails?.driver) && navigation.navigate('ChatScreen', {
                        roomId: rideDetails?.id,
                        userDetails: {
                            id: rideDetails?.driver?.id,
                            name: rideDetails?.driver?.name,
                            profilePic: rideDetails?.driver?.profilePic,
                            phoneNumber: rideDetails?.driver?.phoneNumber,
                        }
                    })
                }}>

                <Image source={Icons.MESSAGE_ICON} style={Styles.commonRoundIconStyle} />
            </TouchableOpacity>
            {(!!rideDetails?.riderUnreadCount && rideDetails?.riderUnreadCount !== 0) &&
                <View style={Styles.unreadCountContainer}>
                    <Text style={Styles.unreadText}>
                        {(rideDetails?.riderUnreadCount ?? 0) >= 99 ? "99+" : (rideDetails?.riderUnreadCount ?? 0)}
                    </Text>
                </View>
            }
            {/* //**   SOS button    */}
            {isVisibleSosBtn && <TouchableOpacity style={[GlobalStyles.rowContainer, Styles.sosBtnStyle, { bottom: `${parseInt(snapPoint[0]) + (Platform.OS == "ios" ? wp(0.8) : wp(0.3))}%` }]}
                onPress={() => {
                    dispatch(addSosRideIdReducer(rideDetails?.id))
                    navigation.navigate('SosScreen', { status: "pending" });
                }}
            >
                <Image source={Icons.SOS_ICON} style={{ ...GlobalStyles.commonIconStyle, tintColor: colors.WHITE_ICON, marginRight: wp(1.5), marginTop: wp(-1) }} />
                <Text style={Styles.sosTxtStyle}>{t(TranslationKeys.sos)}</Text>
            </TouchableOpacity>}
            {/* //**  Share Live Location BTN*/}
            <TouchableOpacity
                onPress={() => {
                    setIsPressShareBtn(true)
                    const options = {
                        title: 'RYD',
                        url: `${SOS_URL}/track/${rideDetails?.id}/`,
                        message: `Driver: ${details.Drivername}\nDriverPhoneNumber: ${details.DriverPhonenumber}\nVehicleType: ${details.DriverCar}\nVehicleNumber: ${details.DiverCarNumber}\nPick-up Location: ${details.pickUploaction}\nDrop-out Location: ${details.dropLocation}\nTotal Amount: ${setPrice(t, details.TotalAmount)} via ${details.PaymentMethod}`
                    }
                    Share.open(options).then(res => {
                        setIsPressShareBtn(false)
                    }).catch(e => {
                        setIsPressShareBtn(false)
                    })
                }}
                disabled={isPressShareBtn}
                activeOpacity={1}
                style={[Styles.fareContainerStyle, { bottom: `${parseInt(snapPoint[0]) + (Platform.OS == "ios" ? wp(0.8) : wp(0.3))}%`, right: wp(2) }]}
            >
                <Image source={Icons.SHARE_ICON} style={Styles.infoIconStyle} />
                <Text numberOfLines={1} style={Styles.fareTxtStyle}>{t(TranslationKeys.share_live_location)}</Text>
            </TouchableOpacity>
            {console.log("rideStatus-->", snapPoint)}
            <CustomBottomSheet
                ref={bottomSheetRef}
                snapPoints={snapPoint}
                index={0}
                enablePanDownToClose={false}
                footerComponent={(props) => renderFooter(props, rideDetails)}
                animateOnMount={false}
                keyboardBlurBehavior='restore'
                overDragResistanceFactor={0.5}
                enableOverDrag={rideStatus == RIDE_STATUS.DRIVER_ALLOCATED ? false : true}
                enableDynamicSizing={rideStatus == RIDE_STATUS.DRIVER_ALLOCATED ? false : true}
                containerStyle={{ zIndex: 7 }}
                onChange={(index) => {
                    setSheetIndex(index)
                    if (index == 0) {
                        setIsVisibleSosBtn(true)
                    } else {
                        setIsVisibleSosBtn(false)
                    }
                }}
            >
                <BottomSheetScrollView nestedScrollEnabled style={{ backgroundColor: colors.TRANSPARENT, flex: 1 }}
                    showsVerticalScrollIndicator={false}>

                    <TrackDriverBottomSheetComponent onPayment={(tip, payment_type, totalAmount) => {
                        // initializePaymentSheet()
                        initializePayment(tip, payment_type, totalAmount)
                    }}
                        isDisable={isBtnDisable}
                        onMarkerPress={() => {
                            navigateToGoogleMap()
                        }}
                        duration={duration}
                        isVisibleSosBtn={isVisibleSosBtn}
                        rideOtp={OTP?.toString()}
                        rideStatus={rideStatus}
                        rideBooking={rideDetails}
                        enableTip={online}
                        setEnableTip={setOnline}
                        onChangePayment={onChangePayment}
                        setSelectPaymentMethod={setSelectPaymentMethod}
                        selectPaymentMethod={selectPaymentMethod}
                    />
                </BottomSheetScrollView>
            </CustomBottomSheet>
            <Modal visible={isQrCodeScannerModalOpen} onRequestClose={() => setIsQrCodeScannerModalOpen(false)}>
                <QrCodeScannerScreen codeScanner={codeScanner} />
            </Modal>
            <Modal
                visible={isVisibleWaitingPaymentModal}
                onRequestClose={() => setIsVisibleWaitingPaymentModal(false)}>
                <TouchableOpacity style={Styles.closeIconContainer}
                    onPress={() => setIsVisibleWaitingPaymentModal(false)}>
                    <Image source={Icons.CLOSE_ICON} style={Styles.closeIcon} />
                </TouchableOpacity>
                <View style={[GlobalStyles.container, GlobalStyles.centerContainer, { paddingHorizontal: wp(7) }]}>
                    <Lottie source={require('../../assets/lottie/paymentLottie.json')} resizeMode='cover' autoPlay loop style={{ width: wp(50), height: wp(50) }} />
                    <Text style={Styles.paymentWaitingModaltitle}>{t(TranslationKeys.please_wait)}</Text>
                    <Text style={{ ...GlobalStyles.subTitleStyle, textAlign: 'center' }}>{t(TranslationKeys.waiting_drivers_payment_approval)}</Text>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default TrackDriverScreen;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const { locale } = useLanguage()

    return (
        StyleSheet.create({
            container: {
                position: 'absolute',
                right: 12,
                top: 0,
                padding: 2,
                marginTop: 0,
                borderRadius: 4,
            },
            headerIconStyle: {
                position: 'absolute',
                top: Platform.OS == "ios" ? "7%" : "2%",
                zIndex: 5,
                left: wp(5),
                transform: [{ rotate: locale ? '180deg' : '0deg' }]
            },
            rideFoundTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_18,
                color: colors.PRIMARY_TEXT,
                maxWidth: wp(60)
            },
            arriveTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_12,
                color: colors.SECONDARY_TEXT,
                maxWidth: wp(25)
            },
            itemSepratorStyle: {
                height: wp(0.5),
                backgroundColor: colors.SEPARATOR_LINE,
            },
            userProfileStyle: {
                width: wp(17),
                height: wp(17),
                resizeMode: 'cover',
                borderRadius: wp(17)
            },
            userNameTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.PRIMARY_TEXT,
                maxWidth: wp(40),
                marginBottom: wp(1)
            },
            carTypeTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.SECONDARY_TEXT,
                maxWidth: wp(40)
            },
            amountTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                marginBottom: wp(2)
            },
            perKmTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_10,
                color: colors.SECONDARY_TEXT,
            },
            plateNumberTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_12,
                color: colors.SECONDARY_TEXT,
            },
            commonRoundIconStyle: {
                tintColor: colors.WHITE_ICON,
                width: wp(7),
                height: wp(7),
                resizeMode: 'contain',
                backgroundColor: colors.PRIMARY
            },
            buttonListContainerStyle: {
                justifyContent: "space-evenly",
                marginTop: wp(2.5),
                marginHorizontal: wp(10)
            },
            rideNotFoundTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_18,
                color: colors.PRIMARY_TEXT,
                marginVertical: wp(1)
            },
            pleaseTryAgainTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.SECONDARY_TEXT,
            },
            rideNotFoundIamgeStyle: {
                width: wp(40),
                height: wp(40),
                resizeMode: "contain",
            },
            userNameContainerStyle: {
                marginHorizontal: wp(2),
                flex: 1
            },
            fareTxtStyle: {
                marginLeft: wp(2),
                flex: 1,
                fontSize: FontSizes.FONT_SIZE_11,
                fontFamily: Fonts.FONT_POP_MEDIUM,
                color: colors.PRIMARY_TEXT
            },
            fareContainerStyle: {
                position: 'absolute',
                backgroundColor: colors.SECONDARY_BACKGROUND,
                flex: 1,
                alignItems: 'center',
                alignSelf: 'flex-end',
                padding: wp(2),
                paddingHorizontal: wp(3),
                flexDirection: "row",
                width: '48%',
                borderRadius: wp(5)
            },
            infoIconStyle: {
                width: wp(6),
                height: wp(6),
                resizeMode: 'contain',
                tintColor: colors.SECONDARY
            },
            userLocationIconBtnStyle: {
                backgroundColor: colors.SECONDARY,
                position: 'absolute',
                padding: wp(2),
                borderRadius: wp(10),
                right: '4%',
                shadowColor: colors.SHADOW_2,
                shadowOpacity: 0.4,
                shadowRadius: 10,
                shadowOffset: { height: 0, width: 0 },
                elevation: 15,
            },
            userLocationIconStyle: {
                tintColor: colors.WHITE_ICON,
                width: wp(5),
                height: wp(5),
                resizeMode: 'contain'
            },
            sosBtnStyle: {
                position: 'absolute',
                borderRadius: wp(20),
                backgroundColor: colors.SOS_BTN_COLOR,
                alignItems: 'center',
                justifyContent: 'center',
                left: wp(2.5),
                padding: wp(1.5),
                borderColor: colors.SOS_BTN_COLOR,
                borderWidth: 2,
                alignSelf: 'flex-end',
            },
            sosTxtStyle: {
                fontFamily: Fonts.FONT_POP_BOLD,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.BUTTON_TEXT
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
            locationModalContainer: {
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.SECONDARY_BACKGROUND,
                padding: wp(5),
                paddingTop: wp(9),
                margin: wp(5),
                borderRadius: wp(5)
            },
            locationModalLocationIcon: {
                width: wp(10),
                height: wp(10),
                resizeMode: 'contain',
                tintColor: colors.SECONDARY
            },
            locationModalPermissionTxt: {
                fontSize: FontSizes.FONT_SIZE_17,
                fontFamily: Fonts.FONT_POP_MEDIUM,
                color: colors.PRIMARY_TEXT,
                textAlign: 'center',
                marginVertical: wp(5)
            },
            locationModalSettingBtn: {
                paddingHorizontal: wp(5),
                marginTop: 0
            },
            paymentWaitingModaltitle: {
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                fontSize: FontSizes.FONT_SIZE_22,
                color: colors.PRIMARY_TEXT,
            },
            unreadCountContainer: {
                position: 'absolute',
                bottom: '67%',
                left: '14%',
                backgroundColor: colors.ERROR_TEXT,
                width: wp(6.5),
                height: wp(6.5),
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: wp(3)
            },
            unreadText: {
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                fontSize: FontSizes.FONT_SIZE_15,
                color: colors.BUTTON_TEXT,
                textAlign: 'center'
            },
            floatingChatBtnContainer: {
                position: 'absolute',
                width: wp(17),
                height: wp(17),
                borderRadius: wp(20),
                backgroundColor: colors.PRIMARY,
                alignItems: 'center',
                justifyContent: 'center',
                left: wp(2.5)
            },
            closeIconContainer: {
                padding: 10,
                borderRadius: 100,
                position: 'absolute',
                zIndex: 99,
                top: wp(8),
                right: wp(3),
                backgroundColor: '#ffffff78'
            },
            closeIcon: {
                width: wp(6),
                height: wp(6),
                resizeMode: 'contain'
            },
            makePaymentIcon: {
                height: wp(6),
                width: wp(6),
                resizeMode: 'contain',
                tintColor: colors.WHITE_ICON,
                marginRight: wp(5)
            },
            makePaymentText: {
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                fontSize: FontSizes.FONT_SIZE_18,
                color: colors.WHITE_ICON
            }
        })
    );
};
