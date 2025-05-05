import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, Image, LayoutAnimation, Linking, NativeModules, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fonts } from '../../styles/Fonts';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Icons } from '../../utils/IconsPaths';
import { FontSizes } from '../../styles/FontSizes';
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { store, useAppDispatch, useAppSelector, USER_LOGOUT } from '../../redux/Store';
import CustomBottomSheet from '../../components/CustomBottomSheet';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import CustomIconButton from '../../components/CustomIconButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from 'react-native-geolocation-service';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import CustomMapContainer from '../../components/CustomMapContainer';
import CustomUserMarkerView from '../../components/CustomUserMarkerView';
import UserNameBottomSheetComponent from '../../components/bottomSheetComponents/UserNameSheetComponent';
import { commonCredentialsApi, deleteAccount, getCodesListApi, riderDetails, setUserCordinates, userLogOut } from '../../redux/slice/authSlice/AuthSlice';
import { geoCoderAddress, getAsyncStorageData, getCurrentPosition, hasLocationPermission, } from '../../utils/HelperFunctions';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { AppAlert } from '../../utils/AppAlerts';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { ChangeLocationProps, LocationTypes, addSavePlace, onChangePickUpLocation, pickUpLocationReducer, recentPlaceList, recentPlaceListHome, resetDestinations, resetRecentList, setAppliedCoupon, setDestinations, setFilteredDestinations, setGlobalLang, setIsComplateTimer, setPaymentMethod } from '../../redux/slice/homeSlice/HomeSlice';
import MapView, { Details, MapMarker, Region } from 'react-native-maps';
import UserLogOutPopUp from '../../components/bottomSheetComponents/UserLogOutPopUp';
import { HomeBottomSheetType, LOCATION_WATCH_OPTION, PICK_UP_MODE, RIDE_STATUS } from '../../utils/Constats';
import SavePlacesBottonSheetComponent from '../../components/bottomSheetComponents/SavePlacesBottonSheetComponent';
import { GOOGLE_MAP_API } from '../../config/Host';
import { useIsFocused } from '@react-navigation/native';
import { cancelRide, deleteRideBooking, resetDataOfNearByDriver, restActiveRideDetailsData, restApiCounter, riderActiveRide, showActiveRideModalReducer } from '../../redux/slice/rideSlice/RideSlice';
import { startRideDriverLocation } from '../../redux/slice/rideSlice/RideSlice';
import DeviceInfo from 'react-native-device-info';
import CommonActiveRidePopUp from '../../components/CommonActiveRidePopUp';
import ReactNativeModal from 'react-native-modal';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { setDeleteAccountPopUp, setLogOutPopUp } from '../../redux/slice/SettingSlice/SettingSlice';
import { stateType } from '../../types/DataTypes';
import CustomPrimaryButton from '../../components/CustomPrimaryButton';
import { ANALYTICS_ID } from '../../utils/AnalyticsStringID';
import analytics from '@react-native-firebase/analytics';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
// import PushNotificationIOS from '@react-native-community/push-notification-ios';
import moment from 'moment';
import { Button } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { AppStrings } from '../../utils/AppStrings';
import messaging from '@react-native-firebase/messaging';

export interface BottomSheetTypeProps {
    type: string,
    snapPoint: string[]
};

interface ParamsTypeProps {
    offset: number,
    is_delivery_enable: boolean
};

interface LocationDeltaType {
    latitudeDelta: number,
    longitudeDelta: number,
};

const { StatusBarManager } = NativeModules;

const HomeScreen = () => {

    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const navigation = useCustomNavigation("DrawerStack");
    const dispatch = useAppDispatch();
    const focus = useIsFocused();
    let watchPosition: number

    const bottomSheetRef = useRef<BottomSheet>(null);
    const mapRef = useRef<MapView>(null);
    const mapMarkerRef = useRef<MapMarker>(null);
    const googlePlacesRef = useRef<GooglePlacesAutocompleteRef>(null)

    const { colors, } = useAppSelector(state => state.CommonSlice);
    const { isDeleteAccount, isLogOut } = useAppSelector(state => state.SettingSlice)
    const { userDetail, isLoading, userCordinates, tokenDetail, code, isCodeLoading, commonCredentialsData } = useAppSelector(state => state.AuthSlice);
    const { recentPlaceListData, changePickUpLocation, isLoadingRecent, lastActiveTime, createRideData, createDeliveryRideData, isComplateTimer } = useAppSelector(state => state.HomeSlice);
    const { showActiveRideModal, nearByDriverListData } = useAppSelector(state => state.RideSlice);
    const { riderActiveRideDetails } = store.getState().RideSlice;
    const [bottomSheetType, setBottomSheetType] = useState<BottomSheetTypeProps>(userDetail?.name ? HomeBottomSheetType.savedPlaces : HomeBottomSheetType.userName);
    const [backDrop, setbackDrop] = useState<boolean>(false);
    const [showPickUpContainer, setShowPickUpContainer] = useState<boolean>(false);
    const [locationDetails, setLocationDetails] = useState<LocationTypes | undefined>(undefined);
    const [locationDelta, setLocationDelta] = useState<LocationDeltaType>({
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
    })

    const snapPoint = useMemo(() => bottomSheetType.snapPoint, [bottomSheetType.snapPoint]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [offset, setOffset] = useState(0);
    const [allowLocation, setAllowLocation] = useState(false);
    const watchId = useRef<number | null>(null);
    const [appState, setAppState] = useState<'active' | 'background' | 'extension' | 'inactive' | 'unknown'>(stateType.active)
    const [askPer, setAskPer] = useState<boolean>(true);
    const appState2 = useMemo(() => appState, [appState]);
    const [isVisiblePerModal, setIsVisiblePerModal] = useState<boolean>(true);
    const { t } = useTranslation();
    const { locale } = useLanguage()

    useEffect(() => {
        if (focus) {
            setTimeout(() => {
                bottomSheetRef.current?.expand();
            }, 1100);
            dispatch(resetRecentList(null))
            if (code == "") {
                dispatch(getCodesListApi(null))
            }
            getRiderDetails()
            const params = {
                offset: 0,
                is_delivery_enable: false
            }
            if (userDetail?.name) {
                riderActiveRideDetailApiCall()
            }
            recentPlaceApiCall(params)
            return () => {
                stopLocationUpdates()
                setOffset(0)
                setShowPickUpContainer(false)
                dispatch(restActiveRideDetailsData())
                // dispatch(resetDataOfNearByDriver())
            }
        }
    }, [focus]);

    useEffect(() => {
        setTimeout(() => {
            !changePickUpLocation?.location && getLocation()
        }, 1000);
    }, [])

    useEffect(() => {
        if (askPer) {
            setAskPer(false)
            setTimeout(() => {
                setAskPer(true);
            }, 5000);
            if (appState2 === 'active') {
                getLocation()
                // hasLocationPermission().then((res) => {
                //     if (!res) {
                //         setIsVisiblePerModal(false)
                //         setAllowLocation(false)
                //     } else {
                //         setIsVisiblePerModal(true)
                //         setAllowLocation(true)
                //     }
                // })
            }
        }
    }, [appState2])

    useEffect(() => {
        checkPermission()
        const subscribe = AppState.addEventListener('change', (state) => {
            setAppState(state)
            checkPermission().then((res) => {
                setIsVisiblePerModal(res)
                setAllowLocation(res)
            })
        })
        return () => subscribe.remove()
    }, []);

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
    // ! Watch Position Enable
    // useEffect(() => {
    //     if (allowLocation && focus) {
    //         getLocationUpdates()
    //     } else {
    //         stopLocationUpdates()
    //     }
    // }, [allowLocation])

    useEffect(() => {
        if (riderActiveRideDetails && riderActiveRideDetails?.id && showActiveRideModal?.isFirstTime) {
            dispatch(showActiveRideModalReducer({
                isFirstTime: false,
                visibleModal: true
            }))
        }
    }, [riderActiveRideDetails])

    useEffect(() => {
        if (isLogOut) {
            setTimeout(() => {
                assignBottomSheetType(HomeBottomSheetType.logOut.type)
            }, 1000);
        }
    }, [isLogOut]);

    useEffect(() => {
        if (isDeleteAccount) {
            setTimeout(() => {
                assignBottomSheetType(HomeBottomSheetType.deleteAccount.type)
            }, 1000);
        }
    }, [isDeleteAccount]);

    useEffect(() => {
        if (userDetail?.name) {
            assignBottomSheetType(HomeBottomSheetType.savedPlaces.type)
        } else {
            assignBottomSheetType(HomeBottomSheetType.userName.type)
        }
    }, [userDetail]);

    useEffect(() => {
        if (changePickUpLocation?.openPickUpLocation && focus) {
            setShowPickUpContainer(true)
            assignBottomSheetType(HomeBottomSheetType.default.type)
            if (changePickUpLocation?.location) {
                setLocationDetails({
                    id: !!changePickUpLocation?.location?.id ? Number(changePickUpLocation?.location?.id) : 0,
                    ...changePickUpLocation.location
                })
            }
        }
    }, [changePickUpLocation, focus])

    useEffect(() => {
        if (showPickUpContainer) {
            stopLocationUpdates()
        }
    }, [showPickUpContainer])

    const assignBottomSheetType = (type?: string) => {
        switch (type) {
            case HomeBottomSheetType.logOut.type:
                setTimeout(() => {
                    setBottomSheetType(HomeBottomSheetType.logOut)
                }, 500);
                if (isLogOut) {
                    setbackDrop(true)
                }
                break;
            case HomeBottomSheetType.deleteAccount.type:
                setTimeout(() => {
                    setBottomSheetType(HomeBottomSheetType.deleteAccount)
                }, 500);
                if (isDeleteAccount) {
                    setbackDrop(true)
                }
                break;
            case HomeBottomSheetType.userName.type:
                setbackDrop(true)
                setBottomSheetType(HomeBottomSheetType.userName)
                break;
            case HomeBottomSheetType.savedPlaces.type:
                setBottomSheetType(HomeBottomSheetType.savedPlaces)
                break;
            default:
                backDrop && setbackDrop(false)
                setBottomSheetType(HomeBottomSheetType.default)
                break;
        };

        if (type == HomeBottomSheetType.default.type) {
            bottomSheetRef.current?.close()
        } else {
            bottomSheetRef.current?.snapToIndex(0)
        }
    };

    const getRiderDetails = () => {
        if (userDetail?.id) {
            dispatch(riderDetails(userDetail?.id)).unwrap().then((res) => {
            }).catch((error) => {
                console.log("🚀 ~ file: HomeScreen.tsx:99 ~ dispatch ~ error:", error)
            })
            if (!commonCredentialsData) {
                dispatch(commonCredentialsApi(null))
            }
        }
    };

    const recentPlaceApiCall = (params: ParamsTypeProps) => {
        dispatch(recentPlaceListHome(params)).unwrap().then(res => {
            if (userDetail?.name && recentPlaceListData?.results?.length !== 0) {
                bottomSheetRef.current?.snapToIndex(1)
            }
            setOffset(params.offset + 10)
        }).catch(e => { })
    };

    //! Get current location
    const getLocation = async () => {
        const hasPermission = await hasLocationPermission();

        if (!hasPermission) {
            // assignDummyLocation()
            setIsVisiblePerModal(false)
            setAllowLocation(false)
            setLoading(false)
            return;
        }

        setAllowLocation(true)
        googlePlacesRef.current?.setAddressText("")
        googlePlacesRef.current?.blur()
        setIsVisiblePerModal(true)

        await getCurrentPosition().then((res) => {
            const { latitude, longitude } = res?.coords
            assignLocationCoords(latitude, longitude)
            setLoading(false)
        }).catch(() => {
            assignDummyLocation()
            setLoading(false)
        })
    };

    //! watch postion for location updates
    // const getLocationUpdates = async () => {
    //     const hasPermission = await hasLocationPermission();

    //     if (!hasPermission) {
    //         // assignDummyLocation()
    //         // checkPermission()
    //         setAllowLocation(false)
    //         setLoading(false)
    //         return;
    //     }

    //     watchId.current = Geolocation.watchPosition(
    //         res => {
    //             const { latitude, longitude } = res?.coords
    //             assignLocationCoords(latitude, longitude)
    //             setLoading(false)
    //         },
    //         error => {
    //             // assignDummyLocation()
    //             setLoading(false)
    //         }, LOCATION_WATCH_OPTION,
    //     );
    // };

    // stope watch postion
    const stopLocationUpdates = () => {
        if (watchId.current !== null) {
            Geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
    };

    const assignLocationCoords = (latitude: number, longitude: number) => {
        (!changePickUpLocation?.location?.latitude && !changePickUpLocation?.location?.longitude) && setOriginLocationCoords(latitude, longitude);
        ((changePickUpLocation?.location && showPickUpContainer) || showPickUpContainer) &&
            mapRef.current?.animateToRegion({
                latitude: changePickUpLocation?.location?.latitude ?? latitude,
                longitude: changePickUpLocation?.location?.longitude ?? longitude,
                latitudeDelta: locationDelta.latitudeDelta,
                longitudeDelta: locationDelta.longitudeDelta,
            }, 500)
        dispatch(setUserCordinates({
            latitude: latitude,
            longitude: longitude
        }))
        getNearByDriverLocation(latitude, longitude)
    };

    const assignDummyLocation = () => {
        // const userCordinates = {
        //     longitude: 72.88746321772949,
        //     latitude: 21.23814020005119
        // }
        // assignLocationCoords(userCordinates.latitude, userCordinates.longitude)
    };

    const getNearByDriverLocation = (latitude: number, longitude: number) => {
        const params = {
            latitude: latitude,
            longitude: longitude
        };
        const authData = store.getState().AuthSlice.tokenDetail;
        if ((authData && authData?.authToken?.length != 0)) {
            if (focus) {
                dispatch(startRideDriverLocation(JSON.stringify(params))).unwrap()
                    .then(res => {
                    })
                    .catch(e => { })
            }
        }
    };

    const setOriginLocationCoords = (latitude: number, longitude: number) => {
        geoCoderAddress({ lat: latitude, lng: longitude }).then((res) => {
            setLocationDetails({
                id: Number(Math.random().toFixed(3)),
                address: res.address,
                latitude: latitude,
                longitude: longitude,
                state: res.state
            })
        }).catch(() => {
        })
    };

    const emptyUserNameAlert = () => {
        AppAlert("", t(TranslationKeys.please_enter_your_name))
    };

    const clearLocalStorage = () => {
        messaging().deleteToken()
        dispatch({ type: USER_LOGOUT })
        getAsyncStorageData(AppStrings.selected_language).then(res => {
            let c_code = res === null ? 'en' : res
            dispatch(setGlobalLang(c_code))
        })
        bottomSheetRef.current?.close()
        navigation.reset({
            index: 0, routes: [{
                name: "AuthStack"
            }]
        })
    }

    const userLogOutBtnPress = async () => {
        const data = new FormData()
        const deviceId = await DeviceInfo.getUniqueId()
        data.append("device_id", deviceId)
        dispatch(userLogOut(data)).unwrap().then(() => {
            if (Platform.OS === 'ios') {
                // PushNotificationIOS.setApplicationIconBadgeNumber(0)
            }
            dispatch(setLogOutPopUp(false))
            clearLocalStorage()
        }).catch((error) => {
            dispatch(setLogOutPopUp(false))
            assignBottomSheetType(HomeBottomSheetType.savedPlaces.type)
            console.log("logOut error:", error)
        })
    };
    const userDeleteAccountPress = async () => {
        dispatch(deleteAccount(null)).unwrap().then(() => {
            if (Platform.OS === 'ios') {
                // PushNotificationIOS.setApplicationIconBadgeNumber(0)
            }
            dispatch(setDeleteAccountPopUp(false))
            clearLocalStorage()
        }).catch((error) => {
            dispatch(setDeleteAccountPopUp(false))
            assignBottomSheetType(HomeBottomSheetType.savedPlaces.type)
            console.log("Delete error:", error)
        })
    };

    //Bottomsheet backdrop
    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                pressBehavior={'none'}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.4}
                style={{
                    height: "100%",
                    width: "100%",
                    position: 'absolute',
                    zIndex: 6
                }}
            />
        ),
        []
    );

    const riderActiveRideDetailApiCall = () => {
        dispatch(riderActiveRide(null)).unwrap()
            .then((res) => {
                if ((store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide && res?.rideStatus == RIDE_STATUS.CREATED && res?.ridePayment?.paymentMethod == 'CARD')) {
                    dispatch(deleteRideBooking(res?.id))
                    dispatch(setAppliedCoupon(-1))
                } else {
                    let backgroundDate = moment(lastActiveTime)
                    const timeSpent = moment().diff(backgroundDate, 'seconds')
                    console.log("timeSpent--->", backgroundDate, timeSpent)
                    if ((res?.rideStatus == RIDE_STATUS.PAYMENT_HOLD || res?.rideStatus == RIDE_STATUS.CREATED) && (res?.ridePayment?.paymentMethod == 'CARD' || res?.ridePayment?.paymentMethod == 'CASH')) {
                        if (timeSpent < 185 || (isComplateTimer && (createRideData?.id == res.id || createDeliveryRideData?.id == res.id))) {
                            navigation.navigate('SearchingRiderScreen', {
                                id: createDeliveryRideData ? createDeliveryRideData?.id : createRideData?.id,
                                from: "HomeScreen",
                                isAppCloseOrOpen: true,
                                isDeliveryModule: createDeliveryRideData ? true : false
                            })
                        } else {
                            const data = new FormData()
                            data.append("ride_booking", res?.id)
                            let params = {
                                formData: data,
                            }
                            if (res?.ridePayment?.paymentMethod == 'CASH') {
                                dispatch(setPaymentMethod("Card"))
                                dispatch(deleteRideBooking(res?.id))
                            } else {
                                dispatch(cancelRide(params))
                            }
                        }
                    }
                    else {
                        dispatch(setAppliedCoupon(-1))
                    }
                }
            })
            .catch((error) => {
                console.log("🚀  file: HomeScreen.tsx:75  useEffect ~ error:", error)
            })
    }

    const getStateFromAddressComponents = (addressComponents: any) => {
        // Loop through the address components to find the "administrative_area_level_1"
        const stateComponent = addressComponents.find(
            (component: any) => component.types.includes('administrative_area_level_1')
        );
        return stateComponent ? stateComponent.long_name : null; // You can use `short_name` if needed
    };


    return (
        <SafeAreaView edges={['top']} style={GlobalStyle.container}>
            {(isLoading || loading || isCodeLoading || isLoadingRecent) ? <CustomActivityIndicator /> : null}
            {
                !isVisiblePerModal ?
                    <ReactNativeModal
                        style={{
                            margin: 0,
                        }}
                        onBackButtonPress={() => BackHandler.exitApp()}
                        isVisible={!isVisiblePerModal ? true : false}>
                        <View style={Styles.locationModalContainer}>
                            <Image source={Icons.LOCATION_ICON} style={Styles.locationModalLocationIcon} />
                            <Text style={Styles.locationModalPermissionTxt}>{t(TranslationKeys.location_permission)}</Text>
                            <CustomPrimaryButton
                                onPress={() => Linking.openSettings()}
                                title={t(TranslationKeys.go_to_settings)} style={[GlobalStyle.primaryBtnStyle, Styles.locationModalSettingBtn]} />
                        </View>
                    </ReactNativeModal>
                    : null
            }
            <View style={Styles.headerViewContainerStyle}>
                {/* pick-up back button */}
                {showPickUpContainer ?
                    <View style={Styles.headerStyle}>
                        <CustomIconButton
                            onPress={() => {
                                dispatch(resetDestinations())
                                const params: ChangeLocationProps = {
                                    openPickUpLocation: false,
                                    resetDestinationDate: true,
                                    location: undefined
                                }
                                dispatch(onChangePickUpLocation(params))
                                if (allowLocation) {
                                    getLocation()
                                } else {
                                    assignDummyLocation()
                                }
                                setShowPickUpContainer(false)
                                setTimeout(() => {
                                    assignBottomSheetType(HomeBottomSheetType.savedPlaces.type)
                                }, 200);
                            }}
                            icon={Icons.LEFT_ARROW_ICON}
                            iconStyle={{ transform: [{ rotate: locale ? '180deg' : '0deg' }] }}
                        />
                        <Text style={Styles.pickUpheaderTxtStyle}>{t(TranslationKeys.pick_up)}</Text>
                    </View>
                    : null
                }
                {/* Header UI Style */}
                <View style={[GlobalStyle.rowContainer, Styles.headerContainerStyle, { marginTop: showPickUpContainer ? wp(0) : wp(3) }]}>
                    {!showPickUpContainer ? (
                        <View>
                            <CustomIconButton
                                onPress={() => {
                                    if (userDetail?.name) {
                                        navigation.openDrawer()
                                    } else {
                                        emptyUserNameAlert()
                                    }
                                }}
                                style={Styles.headerMenuIcon}
                                icon={Icons.MENU_ICON} />
                        </View>
                    ) : null}
                    {showPickUpContainer ?
                        <View style={Styles.headerPickUpLocationContainerStyle}>
                            <GooglePlacesAutocomplete
                                placeholder={t(TranslationKeys.enter_pick_up_location)}
                                ref={googlePlacesRef}
                                onPress={(data, details = null) => {
                                    const addressComponents = details?.address_components;
                                    const state = getStateFromAddressComponents(addressComponents);
                                    console.log('Selected State:', state);
                                    const address = {
                                        id: Number(Math.random().toFixed(3)),
                                        address: details?.formatted_address,
                                        latitude: details?.geometry?.location?.lat,
                                        longitude: details?.geometry?.location?.lng,
                                        state: state
                                    }
                                    if (address.latitude && address.longitude) {
                                        // marker ref use 
                                        mapRef.current?.animateToRegion({
                                            latitude: address?.latitude,
                                            longitude: address?.longitude,
                                            latitudeDelta: locationDelta.latitudeDelta,
                                            longitudeDelta: locationDelta.longitudeDelta,
                                        }, 500)
                                    }
                                    setLocationDetails(address)
                                }}
                                isRowScrollable={false}
                                styles={{
                                    listView: Styles.googleTextInputListView,
                                    description: Styles.googleTextInputDescription,
                                    textInputContainer: Styles.googleTextInputContainer,
                                    textInput: Styles.pickLocationTextInputStyle,
                                }}
                                fetchDetails={true}
                                textInputProps={{
                                    clearButtonMode: 'never',
                                    onChangeText: (text) => setLocationDetails({
                                        address: text
                                    }),
                                    placeholderTextColor: colors.SECONDARY_TEXT,
                                    value: locationDetails?.address,
                                }}
                                enablePoweredByContainer={false}
                                renderLeftButton={() => {
                                    return (
                                        <View style={[Styles.currentLocationDotView, { marginHorizontal: 0, backgroundColor: colors.SECONDARY }]} />
                                    )
                                }}
                                renderRightButton={() => {
                                    return (
                                        <View style={GlobalStyle.rowContainer}>
                                            {locationDetails ? <CustomIconButton
                                                onPress={() => {
                                                    setLocationDetails(undefined)
                                                    googlePlacesRef?.current?.setAddressText("")
                                                    googlePlacesRef?.current?.blur()
                                                    //! prevent for re-assign pickup location
                                                    // if (userCordinates?.latitude && userCordinates.longitude)
                                                    //     mapRef.current?.animateToRegion({
                                                    //         latitude: userCordinates?.latitude,
                                                    //         longitude: userCordinates?.longitude,
                                                    //         latitudeDelta: locationDelta.latitudeDelta,
                                                    //         longitudeDelta: locationDelta.longitudeDelta,
                                                    //     }, 1000)
                                                }}
                                                icon={Icons.CLOSE_ICON}
                                                iconStyle={{ ...Styles.headerCloseIconStyle, tintColor: colors.PRIMARY, width: wp(3.5), height: wp(3.5) }}
                                            /> : null}
                                            {/* <CustomIconButton
                                                onPress={() => {
                                                    addSavePlaceApiCall()
                                                }}
                                                disabled={locationDetails ? false : true}
                                                icon={Icons.SAVE_LOCATION_ICON}
                                                iconStyle={{ ...Styles.headerCloseIconStyle, tintColor: colors.PRIMARY, width: wp(5), height: wp(5) }}
                                            /> */}
                                        </View>
                                    )
                                }
                                }
                                onFail={(e) => {
                                    console.log({ e });
                                }}
                                query={{
                                    key: store.getState().AuthSlice.commonCredentialsData?.googleApiKey,
                                    language: 'en',
                                    components: `country:${code}`,
                                }}
                            />
                        </View> : null}

                    {!showPickUpContainer ?
                        <View style={Styles.headerPickupLocationContainerButtonStyle}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (userDetail?.name) {
                                        setShowPickUpContainer(true)
                                        //! check it 
                                        // if (allowLocation) {
                                        //     getLocation()
                                        // } else {
                                        //     assignDummyLocation()
                                        // }
                                        assignBottomSheetType(HomeBottomSheetType.default.type)
                                    } else {
                                        emptyUserNameAlert()
                                    }
                                }} style={Styles.currentLocationView}>
                                <View style={Styles.currentLocationDotView} />
                                <Text
                                    numberOfLines={1}
                                    style={Styles.currentLocationTxt}>{t(TranslationKeys.current_location)}</Text>
                            </TouchableOpacity>
                            {/* saved places header button */}
                            <>
                                <CustomIconButton
                                    onPress={() => {
                                        if (userDetail?.name) {
                                            navigation.navigate('SavedPlaceScreen', { type: 'origin', locations: [] })
                                        } else {
                                            emptyUserNameAlert()
                                        }
                                    }}
                                    icon={Icons.SAVE_LOCATION_ICON}
                                    iconStyle={Styles.saveLocationIconStyle}
                                />
                            </>
                        </View> : null
                    }

                </View>
                {/* <Button title="Reset Cunter" onPress={() => {
                    dispatch(restApiCounter())
                }} /> */}
                {/* {showAlert ? <CustomAlert /> : null} */}
            </View>
            {showPickUpContainer ?
                <Image source={Icons.MAP_MARKER_PIN_ICON} style={Styles.mapMarkerCenterPinImage} /> : null
            }
            {/* Google map container view */}
            <CustomMapContainer
                ref={mapRef}
                region={{
                    longitude: userCordinates?.longitude ?? 72.88746321772949,
                    latitude: userCordinates?.latitude ?? 21.23814020005119,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                }}
                focusable
                onRegionChangeComplete={(region: Region, details: Details) => {
                    setLocationDelta({
                        latitudeDelta: region.latitudeDelta,
                        longitudeDelta: region.longitudeDelta
                    })
                    if (showPickUpContainer) {
                        setOriginLocationCoords(region.latitude, region.longitude)
                    }
                }}
                onPress={(e) => {
                    if (showPickUpContainer) {
                        Geolocation.clearWatch(watchPosition)
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
                        const coords = {
                            latitude: e.nativeEvent.coordinate.latitude,
                            longitude: e.nativeEvent.coordinate.longitude,
                        }
                        if (coords) {
                            mapRef.current?.animateToRegion({
                                latitude: coords?.latitude,
                                longitude: coords?.longitude,
                                latitudeDelta: locationDelta.latitudeDelta,
                                longitudeDelta: locationDelta.longitudeDelta,
                            })
                        }
                        setOriginLocationCoords(coords.latitude, coords.longitude)
                    }
                }
                }>
                {
                    !showPickUpContainer && nearByDriverListData?.length !== 0 &&
                    nearByDriverListData?.map((item, index) => {
                        return (
                            <>
                                {(item.latitude && item.longitude) ?
                                    <CustomUserMarkerView
                                        iconImage={ImagesPaths.CAR_IMAGE}
                                        iconStyle={{
                                            tintColor: undefined
                                        }}
                                        coordinate={{
                                            latitude: Number(item.latitude),
                                            longitude: Number(item.longitude)
                                        }}
                                    />
                                    : <></>}
                            </>
                        )
                    })
                }
                {(locationDetails && locationDetails?.latitude && locationDetails?.longitude && !showPickUpContainer) ?
                    <CustomUserMarkerView
                        ref={mapMarkerRef}
                        iconStyle={{ tintColor: colors.PRIMARY }}
                        coordinate={{
                            latitude: Number(locationDetails.latitude),
                            longitude: Number(locationDetails.longitude)
                        }}
                    /> : null
                }
            </CustomMapContainer>
            {/* Gps button */}
            {
                showPickUpContainer ?
                    <CustomIconButton
                        onPress={() => {
                            // if (showPickUpContainer) {
                            getLocation()
                            // }
                            // else {
                            //     if (userCordinates) {
                            //         mapRef.current?.animateToRegion({
                            //             latitude: userCordinates?.latitude,
                            //             longitude: userCordinates?.longitude,
                            //             latitudeDelta: 0.015,
                            //             longitudeDelta: 0.0121,
                            //         }, 500)
                            //     }
                            // }
                        }}
                        icon={Icons.LOCATION_ICON}
                        style={[Styles.userLocationIconBtnStyle, {
                            // check from android
                            bottom: bottomSheetType.type === HomeBottomSheetType.savedPlaces.type ? hp(`${parseInt(snapPoint[0]) + (Platform.OS == "ios" ? wp(0.3) : wp(0.15))}%`) : hp(13),
                        }]}
                        iconStyle={Styles.userLocationIconStyle}
                    />
                    : null
            }
            {/* Bottom sheet */}
            {
                !showPickUpContainer ?
                    <CustomBottomSheet
                        enableOverDrag={false}
                        ref={bottomSheetRef}
                        snapPoints={snapPoint}
                        index={0}
                        enablePanDownToClose={false}
                        animateOnMount={false}
                        enableDynamicSizing={false}
                        keyboardBlurBehavior='restore'
                        overDragResistanceFactor={0.5}
                        backdropComponent={(bottomSheetType.type == HomeBottomSheetType.logOut.type || bottomSheetType.type == HomeBottomSheetType.userName.type || bottomSheetType.type == HomeBottomSheetType.deleteAccount.type) ? renderBackdrop : null}
                        containerStyle={{ zIndex: 7 }}
                    >
                        <>
                            {
                                bottomSheetType.type == HomeBottomSheetType.logOut.type &&
                                <UserLogOutPopUp
                                    type={HomeBottomSheetType.logOut.type}
                                    onCancel={() => {
                                        assignBottomSheetType(userDetail?.name ? HomeBottomSheetType.savedPlaces.type : HomeBottomSheetType.userName.type)
                                        dispatch(setLogOutPopUp(false))
                                    }} onLogOut={() => {
                                        if (riderActiveRideDetails && riderActiveRideDetails.id) {
                                            assignBottomSheetType(HomeBottomSheetType.savedPlaces.type)
                                            dispatch(showActiveRideModalReducer({
                                                ...showActiveRideModal,
                                                visibleModal: true
                                            }))
                                            dispatch(setLogOutPopUp(false))
                                        } else {
                                            userLogOutBtnPress()
                                        }
                                    }} />}
                            {
                                bottomSheetType.type == HomeBottomSheetType.deleteAccount.type &&
                                <UserLogOutPopUp
                                    type={HomeBottomSheetType.deleteAccount.type}
                                    onCancel={() => {
                                        assignBottomSheetType(userDetail?.name ? HomeBottomSheetType.savedPlaces.type : HomeBottomSheetType.userName.type)
                                        dispatch(setDeleteAccountPopUp(false))
                                    }} onLogOut={() => {
                                        if (riderActiveRideDetails && riderActiveRideDetails.id) {
                                            assignBottomSheetType(HomeBottomSheetType.savedPlaces.type)
                                            dispatch(showActiveRideModalReducer({
                                                ...showActiveRideModal,
                                                visibleModal: true
                                            }))
                                            dispatch(setDeleteAccountPopUp(false))
                                        } else {
                                            userDeleteAccountPress()
                                        }
                                    }} />
                            }
                            {
                                bottomSheetType.type == HomeBottomSheetType.savedPlaces.type &&
                                <SavePlacesBottonSheetComponent
                                    title={t(TranslationKeys.where_to)}
                                    data={recentPlaceListData.results}
                                    onEndReached={() => {
                                        if (recentPlaceListData?.next && !isLoading) {
                                            let params: ParamsTypeProps = {
                                                offset: offset,
                                                is_delivery_enable: false
                                            }
                                            recentPlaceApiCall(params)
                                        }
                                    }}
                                    onPress={(savedPlaceAddress) => {
                                        if (locationDetails) {
                                            const origin = {
                                                ...locationDetails,
                                                id: locationDetails.id?.toString()
                                            }
                                            const destination = {
                                                ...savedPlaceAddress,
                                                id: savedPlaceAddress.id?.toString()
                                            }
                                            const tempDestinationData = [origin, destination]
                                            dispatch(setFilteredDestinations(tempDestinationData))
                                            navigation.navigate('DestinationLocationScreen')
                                            analytics().logEvent(ANALYTICS_ID.GO_TO_DESTINATION_LOCATION_SCREEN)
                                        } else {
                                            setShowPickUpContainer(true)
                                            getLocation()
                                        }
                                    }} onWherePress={() => {
                                        if (locationDetails) {
                                            const location = {
                                                ...locationDetails,
                                                id: locationDetails.id?.toString()
                                            }
                                            if (location && location.id && location.latitude && location.longitude && location.address) {
                                                dispatch(setFilteredDestinations([location]))
                                                navigation.navigate('DestinationLocationScreen')
                                            }
                                        }
                                    }} />
                            }
                            {
                                bottomSheetType.type == HomeBottomSheetType.userName.type &&
                                <UserNameBottomSheetComponent onChange={() => {
                                    assignBottomSheetType(HomeBottomSheetType.savedPlaces.type)
                                }} />
                            }
                        </>
                    </CustomBottomSheet> : null
            }
            {/* Footer button */}
            {
                showPickUpContainer ?
                    <CustomBottomBtn
                        containerStyle={Styles.customConfirmLocationBtnStyle}
                        onPress={() => {
                            if (riderActiveRideDetails && riderActiveRideDetails.id) {
                                assignBottomSheetType(HomeBottomSheetType.savedPlaces.type)
                                dispatch(showActiveRideModalReducer({
                                    ...showActiveRideModal,
                                    visibleModal: true
                                }))
                            }
                            else {
                                if (showPickUpContainer) {
                                    if (locationDetails?.address && locationDetails.latitude && locationDetails.longitude) {
                                        const location = {
                                            ...locationDetails,
                                            id: locationDetails?.id?.toString()
                                        }
                                        if (changePickUpLocation?.resetDestinationDate) {
                                            dispatch(resetDestinations())
                                        }
                                        // ** Called when change pickup location
                                        assignLocationCoords(Number(locationDetails?.latitude), Number(locationDetails?.longitude))
                                        const params: ChangeLocationProps = {
                                            openPickUpLocation: false,
                                            resetDestinationDate: true,
                                            location: undefined
                                        }
                                        dispatch(onChangePickUpLocation(params))
                                        dispatch(pickUpLocationReducer(location))
                                        setShowPickUpContainer(false)
                                        setTimeout(() => {
                                            assignBottomSheetType(HomeBottomSheetType.savedPlaces.type)
                                        }, 200);
                                        bottomSheetRef.current?.snapToIndex(0)
                                        // navigation.navigate('DestinationLocationScreen')
                                    }
                                }
                            }
                        }} title={t(TranslationKeys.confirm_location)} />
                    : null
            }
            {showActiveRideModal?.visibleModal ? <ReactNativeModal
                isVisible={(showActiveRideModal?.visibleModal && riderActiveRideDetails?.id)}
            >
                {riderActiveRideDetails && riderActiveRideDetails?.id &&
                    <CommonActiveRidePopUp data={riderActiveRideDetails}
                        onClose={() => {
                            dispatch(showActiveRideModalReducer({
                                ...showActiveRideModal,
                                visibleModal: false
                            }))
                        }}
                        onCancel={() => {
                            dispatch(showActiveRideModalReducer({
                                ...showActiveRideModal,
                                visibleModal: false
                            }))
                            navigation.navigate('CancelTaxiScreen', { id: riderActiveRideDetails?.id })

                        }}
                        onNavigateToPrebook={() => {
                            if (riderActiveRideDetails.pickupMode === PICK_UP_MODE.NOW) {
                                navigation.navigate("DrawerStack", {
                                    screen: 'YourRidesScreen',
                                    params: {
                                        notificationType: undefined
                                    }
                                })
                                dispatch(showActiveRideModalReducer({
                                    ...showActiveRideModal,
                                    visibleModal: false
                                }))
                            } else {
                                if (riderActiveRideDetails.pickupMode === PICK_UP_MODE.LATER && riderActiveRideDetails.rideStatus === RIDE_STATUS.DRIVER_ALLOCATED || riderActiveRideDetails.rideStatus === RIDE_STATUS.ONGOING) {
                                    navigation.navigate("DrawerStack", {
                                        screen: 'YourRidesScreen',
                                        params: {
                                            notificationType: undefined
                                        }
                                    })
                                } else {
                                    navigation.navigate("DrawerStack", {
                                        screen: 'PreBookScreen',
                                    })
                                }
                                dispatch(showActiveRideModalReducer({
                                    ...showActiveRideModal,
                                    visibleModal: false
                                }))
                            }

                        }}
                    />}
            </ReactNativeModal> : null}
        </SafeAreaView>
    );
};

export default HomeScreen;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const { locale } = useLanguage()

    return (
        StyleSheet.create({
            saveLocationIconStyle: {
                marginRight: wp(5),
                tintColor: colors.SECONDARY_ICON
            },
            currentLocationView: {
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                flex: 1,
                marginHorizontal: wp(2)
            },
            currentLocationDotView: {
                height: wp(3),
                width: wp(3),
                backgroundColor: colors.SECONDARY,
                borderRadius: wp(3),
                marginHorizontal: wp(3)
            },
            currentLocationTxt: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_12,
                color: colors.SECONDARY_TEXT,
                maxWidth: wp(55),
            },
            // headerContainerStyle: {
            //     borderRadius: wp(3),
            //     alignItems: 'center',
            //     flexDirection: 'row',
            //     backgroundColor: colors.SECONDARY_BACKGROUND,
            // },
            headerPickupLocationContainerButtonStyle: {
                flex: 1,
                backgroundColor: colors.SECONDARY_BACKGROUND,
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: wp(3),
                borderRadius: wp(3),
                marginLeft: wp(2)
            },
            headerContainerStyle: {
                marginVertical: wp(3),
                paddingHorizontal: wp(0),
                padding: wp(3)
            },
            headerMenuIcon: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                padding: wp(3),
                borderRadius: wp(3),
                tintColor: colors.SECONDARY_ICON
            },
            headerPickUpLocationContainerStyle: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                flex: 1,
                padding: wp(4),
                borderRadius: wp(3)
            },
            headerViewContainerStyle: {
                backgroundColor: colors.TRANSPARENT,
                position: 'absolute',
                top: Platform.OS == "ios" ? StatusBarManager.HEIGHT : 0,
                width: '100%',
                zIndex: 5,
                paddingHorizontal: wp(5)
            },
            headerCloseIconStyle: {
                width: wp(4),
                height: wp(4),
                resizeMode: 'contain',
                tintColor: colors.PRIMARY,
                marginHorizontal: wp(1.5)
            },
            userLocationIconBtnStyle: {
                backgroundColor: colors.SECONDARY,
                position: 'absolute',
                padding: wp(3),
                borderRadius: wp(10),
                right: '4%',
                bottom: hp(15),
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
            pickLocationTextInputStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                marginTop: wp(1.5),
                textAlign: locale ? 'right' : 'left'
            },
            headerStyle: {
                paddingVertical: wp(3),
                alignItems: "center",
                flexDirection: 'row',
            },
            pickUpheaderTxtStyle: {
                marginHorizontal: wp(4),
                color: colors.PRIMARY_TEXT,
                fontSize: FontSizes.FONT_SIZE_15,
                fontFamily: Fonts.FONT_POP_MEDIUM,
            },
            customConfirmLocationBtnStyle: {
                alignSelf: 'center',
                position: "absolute",
                width: '100%',
                bottom: 0
            },
            googleTextInputListView: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                alignSelf: 'center',
                maxHeight: hp(25)
            },
            googleTextInputDescription: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                color: colors.PRIMARY_TEXT,
                fontSize: FontSizes.FONT_SIZE_14,
                opacity: 0.7,
            },
            googleTextInputContainer: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                color: colors.PRIMARY_LIGHT_BACKGROUND,
                height: wp(6),
                alignItems: "center",
                overflow: 'hidden'
            },
            mapMarkerCenterPinImage: {
                width: 40,
                height: 45,
                marginVertical: hp(45.5),
                resizeMode: 'contain',
                position: 'absolute',
                alignSelf: 'center',
                zIndex: 50,
                tintColor: colors.PRIMARY
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
            }
        })
    );
};
