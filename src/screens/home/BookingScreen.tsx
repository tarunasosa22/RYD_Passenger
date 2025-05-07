import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageSourcePropType, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View, Modal, Linking, PermissionsAndroid, Alert, NativeSyntheticEvent, NativeScrollEvent, Share } from 'react-native';
import { BottomSheetFooter, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CommonDraggableDashView from '../../components/CommonDraggableDashView';
import CommonDraggableItem from '../../components/CommonDraggableItem';
import CustomBottomSheet from '../../components/CustomBottomSheet';
import CustomHeader from '../../components/CustomHeader';
import CustomMapContainer from '../../components/CustomMapContainer';
import CustomUserMarkerView from '../../components/CustomUserMarkerView';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
import { Icons } from '../../utils/IconsPaths';
import CustomIconTextView from '../../components/CustomIconTextView';
import { AppStrings } from '../../utils/AppStrings';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import CustomRadioButton, { ContactsProps } from '../../components/CustomRadioButton';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { DestinationsProps, QuotationListTypes, createDeliveryRide, createRide, getRideQuotationList, latLongTypes, resetRideQuotationList, setAppliedCoupon, setBookingDestinations, setCreateDeliveryRideData, setCreateRideData, setIsComplateTimer, setLastActibeStep, setPaymentMethod, setRoutesTrackList } from '../../redux/slice/homeSlice/HomeSlice';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAP_API, RAZORPAY_KEY_ID, SOS_URL } from '../../config/Host';
import Contacts from 'react-native-contacts'
import ContactListView from '../../components/ContactListView';
import CommonDropDownComponent from '../../components/CommonDropDownComponent';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import FastImage from 'react-native-fast-image';
import { PICK_UP_MODE, RIDE_STATUS } from '../../utils/Constats';
import { AppAlert } from '../../utils/AppAlerts';
import { ContactsDetailsRegExp } from '../../utils/ScreenUtils';
import { applyDiscountCoupons, cancelRide, deleteRideBooking, discountCoupans, enableSecureMode, getDiscountListApi, makeRidePayment, riderActiveRide, setDeliveryDetails, setRideBookingData } from '../../redux/slice/rideSlice/RideSlice';
import CustomModelAlert from '../../components/CustomAlertModal';
import CustomIconButton from '../../components/CustomIconButton';
import CustomDiscountCouponComponent from '../../components/CustomDiscountCouponComponent';
import Lottie from 'lottie-react-native';
import { decode, minuteToHoursTransform, setPrice } from '../../utils/HelperFunctions';
import { ANALYTICS_ID } from '../../utils/AnalyticsStringID';
import analytics from '@react-native-firebase/analytics';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/RootStackType';
import CustomDeliveryBooking from '../../components/CustomDeliveryBooking';
import { paymentBeforeAfter } from '../../redux/slice/paymentSlice/PaymentSlice';
import RazorpayCheckout from 'react-native-razorpay';
import { BottomSheetDefaultFooterProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetFooter/types';

interface PolylineProps {
    latitude: number,
    longitude: number
};
interface ScheduleRideArrayProps {
    id: number,
    label: string,
    value: string,
};

const selfUser = {
    id: 0,
    name: AppStrings.myself,
    mobileNumber: AppStrings.myself
};

interface CoordsTypes {
    latitude: number
    longitude: number
};

const BookingScreen = () => {

    const navigation = useCustomNavigation("BookingScreen");
    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const focus = useIsFocused();
    type NestedScreenRouteProp = RouteProp<RootStackParamList, 'BookingScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const isDeliveryModule = route?.params?.isDeliveryModule ?? false
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { userDetail, userCordinates, tokenDetail } = useAppSelector(state => state.AuthSlice)
    const { paymentMethod, bookingDestinations, lastActiveTime, createRideData, createDeliveryRideData, isComplateTimer,
        isLoading, rideQuotationList, rideQuotationError, globalLang, routeTrackList, appliedCoupon } = useAppSelector(state => state.HomeSlice);
    const { isLoading: enableSecureModeLoader, discountCouponList, rideBookingData, rideDetails, deliveryDetails } = useAppSelector(state => state.RideSlice)
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [contacts, setContacts] = useState<ContactsProps[] | []>([]);
    const [selectedCarType, setSelectedCarType] = useState<QuotationListTypes | undefined>(undefined);
    const [selectedTempCarType, setSelectedTempCarType] = useState<QuotationListTypes>();
    const [bottomSheetHeight, setBottomSheetHeight] = useState<string[]>(isDeliveryModule ? ["30%", "90%"] : ["30%", "90%"]);
    const [showContactBottomSheet, setShowContactBottomSheet] = useState<boolean>(false);
    const [showdatePickerSheet, setShowdatePickerSheet] = useState<boolean>(false);
    const [date, setDate] = useState(new Date(new Date().getTime() + 30 * 60 * 1000));
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [pickUpTime, setPickUpTime] = useState<string>("NOW");
    const dispatch = useAppDispatch();
    const [selectedContact, setSelectedContact] = useState<ContactsProps>(selfUser);
    const [selectedTempContact, setSelectedTempContact] = useState<ContactsProps>();
    const [showContactListModal, setshowContactListModal] = useState<boolean>(false);
    const [contactLoader, setContactLoader] = useState<boolean>(false);
    const [selectedCarImageError, setSelectedCarImageError] = useState<boolean>(false);
    const [showPrebookSuccessPopup, setShowPrebookSuccessPopup] = useState(false);
    const [pickupMode, setPickupMode] = useState<string>(PICK_UP_MODE.NOW)
    const [isEnablesecureMode, setIsEnablesecureMode] = useState<"on" | "off">("off");
    const [isAlertVisible, setIsAlertVisible] = useState<{ visible: boolean, message: string }>({ message: "", visible: false });
    // const [routePath, setRoutePath] = useState<PolylineProps[]>([]);
    const mapRef = useRef<MapView>(null);
    const snapPoints = useMemo(() => bottomSheetHeight, [bottomSheetHeight]);
    const [directionCoords, setDirectionCoords] = useState<CoordsTypes[]>([]);
    const [isOpenDiscountCouponsModal, setIsOpenDiscountCouponsModal] = useState<boolean>(false);
    const [pricingModal, setPricingModal] = useState(rideQuotationList?.result ?? [])
    const [rideQuatationData, setrideQuatationData] = useState(rideQuotationList?.result ?? [])
    const [isVisibleApplyCoupanAnimation, setIsVisibleApplyCoupanAnimation] = useState<boolean>(false);
    const { top } = useSafeAreaInsets();
    const [currentPricingModal, setCurrentPricingModal] = useState(0);
    const [disocuntCode, setDisocuntCode] = useState<string>('');
    const { t } = useTranslation();
    const [disabled, setDisabled] = useState(false)
    const [sheetIndex, setSheetIndex] = useState(0);
    const [isPickUpMode, setisPickUpMode] = useState<{ visible: boolean, message: string }>({ message: "", visible: false });
    const { locale } = useLanguage()
    moment.locale('en')

    const ScheduleRideArray: ScheduleRideArrayProps[] = [
        { id: 1, label: t(TranslationKeys.dropdown_now), value: AppStrings.dropdown_now },
        { id: 2, label: t(TranslationKeys.dropdown_later), value: AppStrings.dropdown_later },
    ];

    const originLocation = {
        latitude: bookingDestinations[0]?.latitude,
        longitude: bookingDestinations[0]?.longitude,
        state: bookingDestinations[0]?.state
    }
    const destinationLocation = {
        latitude: bookingDestinations[bookingDestinations.length - 1]?.latitude,
        longitude: bookingDestinations[bookingDestinations.length - 1]?.longitude,
        state: bookingDestinations[bookingDestinations.length - 1]?.state
    }
    const waypoints = bookingDestinations?.slice(1, bookingDestinations?.length - 1).map((item) => {
        return {
            latitude: item?.latitude,
            longitude: item?.longitude,
            state: item?.state
        }
    })

    const IsPaymentBeforeAfter = () => {
        const params = {
            paymentType: "razorpay"
        }
        dispatch(paymentBeforeAfter(params))
    }

    useEffect(() => {
        // checkContactsPermission()
        let params: {
            pickup_locations?: any,
            destination_locations?: any,
            stops?: any
            is_time_and_distance_exists: boolean
            // is_secured: boolean
            // is_coupon_apply: boolean
        } = {
            pickup_locations: JSON.stringify(originLocation),
            destination_locations: JSON.stringify(destinationLocation),
            is_time_and_distance_exists: false,
        }
        if (waypoints.length !== 0) {
            params = {
                ...params,
                stops: JSON.stringify(waypoints)
            }
        }
        dispatch(getRideQuotationList(params)).unwrap().then((res) => {
            setPricingModal(res.result)
            setrideQuatationData(res.result)
            bottomSheetRef.current?.snapToIndex(1)
            const coordinates = decode([{
                polyline: { "points": res?.data?.points }
            }])
            setDirectionCoords(coordinates)
            dispatch(setRoutesTrackList(coordinates))
        }).catch((error) => {
        })
        IsPaymentBeforeAfter()
        dispatch(getDiscountListApi(null)).unwrap().then(res => {
        }).catch(e => { })
    }, [])

    //** Hide And Show Cab type according secure mode */
    useEffect(() => {
        setSelectedTempCarType(undefined);
        setSelectedCarType(undefined);
        if (isEnablesecureMode == "on") {
            setPricingModal(
                pricingModal?.filter((item) => item?.carType !== "Auto".toUpperCase())
            );
        } else {
            setPricingModal(rideQuatationData);
        }
    }, [isEnablesecureMode]);

    useEffect(() => {
        mapRef.current?.animateToRegion({
            latitude: originLocation?.latitude - 0.003,
            longitude: originLocation?.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
        })
    }, [originLocation])

    useEffect(() => {
        if (focus) {
            riderActiveRideDetailApiCall()
        }
    }, [focus])


    //** Handle Pickup Mode */
    useEffect(() => {
        if (pickupMode == "NOW") {
            setDate(new Date())
        } else {
            setShowdatePickerSheet(true)
            setDate(new Date(new Date().getTime() + 30 * 60 * 1000))
            setBottomSheetHeight(["50%"])
            bottomSheetRef?.current?.snapToIndex(0)
        }
    }, [pickupMode])

    const openSettingsForAskPermission = () => {
        AppAlert(t(TranslationKeys.contacts), t(TranslationKeys.Ryd_access_to_contacts_for_safety_and_emergancy_alerts),
            async () => {
                await Linking.openSettings()
            }, () => { })
    }

    // ** Handle contacts permission */
    const checkContactsPermission = async () => {
        const checkPermission = await Contacts?.checkPermission();
        if (Platform.OS === 'android') {
            const permissionResult = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
            if (permissionResult === 'never_ask_again') {
                openSettingsForAskPermission();
                return false;
            }
        }
        if (checkPermission === 'authorized') {
            getContactData();
            return true;
        } else {
            const permission = await requestPermission();
            return permission === 'authorized';
        }
    };

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
                        if (timeSpent < 185 || (isComplateTimer && (createRideData?.id == res.id))) {
                            navigation.navigate('SearchingRiderScreen', {
                                id: createRideData?.id,
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

    const requestPermission = async () => {
        const permission = await Contacts.requestPermission();
        if (permission === 'authorized') {
            getContactData();
        } else {
            await openSettingsForAskPermission();
        }
        return permission;
    };

    // ** Secure mode feature */
    const enableSecureModeApiCall = (isEnable: boolean) => {
        const data = new FormData()
        if (isEnable) {
            data.append("is_secured", isEnable)
        }
        // ** Document sharing api while secure mode but it is removed.
        // dispatch(enableSecureMode(data)).unwrap().then(res => {
        setIsEnablesecureMode(isEnablesecureMode == "off" ? "on" : "off")
        if (isEnable) {
            setIsAlertVisible({ message: t(TranslationKeys.enable_secure_mode_to_enable_secure_ride), visible: true })
        }
        let params: {
            pickup_locations?: any,
            destination_locations?: any,
            stops?: any,
            is_secured: boolean
            is_time_and_distance_exists: boolean
            distance: number | null
            duration: number | null
            pickup: string
            destination: string
            is_coupon_apply: boolean
            discount_code: string
            pickupState: string,
            cgst: number | null
            sgst: number | null
            destinationState: string
            toll: number | null
            points: string
        } = {
            pickup_locations: JSON.stringify(originLocation),
            destination_locations: JSON.stringify(destinationLocation),
            is_secured: isEnablesecureMode == "off" ? true : false,

            is_time_and_distance_exists: rideQuotationList?.data?.distance != null,
            distance: rideQuotationList?.data?.distance,
            duration: rideQuotationList?.data?.duration,
            pickup: rideQuotationList?.data?.address?.pickup,
            destination: rideQuotationList?.data?.address?.destination,
            pickupState: rideQuotationList?.data?.pickupState,
            cgst: rideQuotationList?.data?.cgst,
            sgst: rideQuotationList?.data?.sgst,
            destinationState: rideQuotationList?.data?.destinationState,
            toll: rideQuotationList?.data?.toll,
            points: rideQuotationList?.data?.points
        }
        if (rideQuotationList?.data?.address?.stops?.length !== 0) {
            params = {
                ...params,
                stops: JSON.stringify(rideQuotationList?.data?.address?.stops)
            }
        }
        if (disocuntCode !== "") {
            params = {
                ...params,
                is_coupon_apply: true,
                discount_code: disocuntCode,
            }
        }
        dispatch(getRideQuotationList(params)).unwrap().then((res) => {
            setrideQuatationData(res.result)
            setPricingModal(res.result)
            setIsEnablesecureMode(isEnablesecureMode == "off" ? "on" : "off")
            if (isEnable) {
                setPricingModal(res.result.filter((item) => item.carType !== "Auto"))
                setIsAlertVisible({ message: t(TranslationKeys.enable_secure_mode_to_enable_secure_ride), visible: true })
            }
        }).catch((error) => {
        })
        dispatch(getDiscountListApi(null)).unwrap().then(res => {
        }).catch(e => { })
        // }).catch(e => {
        //     if (e?.status == 400 && e?.data) {
        //         setIsAlertVisible({ message: e?.data?.message, visible: true })
        //     } else {
        //         AppAlert(AppStrings.error, e?.data?.message)
        //     }
        //     console.log({ e })
        // })
    }

    //** Get All  Device's Contacts */
    const getContactData = () => {
        setContactLoader(true);
        Contacts.getAll()
            .then((contacts) => {
                const uniqueContacts: {
                    id: number,
                    name: string,
                    mobileNumber: string
                    familyname: string
                }[] = []; // Create an array to store unique contacts
                const contactNumbers = new Set(); // Create a Set to keep track of unique phone numbers
                uniqueContacts.push(selfUser);
                setSelectedTempContact(selectedTempContact ?? selfUser);
                contacts.forEach((res) => {
                    if (res?.phoneNumbers?.length !== 0) {
                        res?.phoneNumbers?.forEach((phoneNumber) => {
                            const formattedNumber = phoneNumber?.number.replace(ContactsDetailsRegExp, "");
                            // Check if the phone number is already added
                            if (!contactNumbers?.has(formattedNumber)) {
                                uniqueContacts?.push({
                                    id: Math.random(),
                                    name: `${res.givenName} ${res.familyName}`,
                                    familyname: `${res.familyName}`,
                                    mobileNumber: formattedNumber
                                });
                                contactNumbers?.add(formattedNumber);
                            }
                        });
                    }
                });
                if (Platform.OS === 'ios') {
                    setContacts(uniqueContacts?.sort((a, b) => a?.familyname !== "" ? a?.familyname?.localeCompare(b?.familyname) : a?.name?.localeCompare(b?.name)));
                } else {
                    setContacts(uniqueContacts?.sort((a, b) => a?.name?.localeCompare(b?.name)));
                }
                setContactLoader(false);
            })
            .catch((error) => {
                setContactLoader(false);
                console.log("🚀 ~ file: BookingScreen.tsx:256 ~ getContactData ~ error:", error);
            });
    };

    const renderItem = ({ item, index }: { item: DestinationsProps, index: number }) => {
        return (
            <>
                <CommonDraggableItem
                    disabled={true}
                    icon={index == 0 ? Icons.ROUND_LOCATION_ICON : Icons.LOCATION_MARKER_ICON}
                    iconStyle={{
                        tintColor: index == 0 ? colors.SECONDARY_ICON : colors.SECONDARY
                    }}
                    item={item}
                />
                {index == bookingDestinations.length - 1 ?
                    null :
                    <CommonDraggableDashView
                        dashGap={3}
                        dashLength={6}
                        dashThickness={2.5}
                    />
                }
            </>
        );
    };

    const generateCustomMessage = (coupon: discountCoupans): { subtitle: string } => {
        let subtitle = `Enjoy a ${coupon?.coupon?.discountPercentage}% discount with code "${coupon?.coupon?.discountCode}" on your next ride. Minimum ride amount ${coupon?.coupon?.minRideAmount} is required to apply the coupon`;
        return { subtitle };
    }

    //** Apply Discount Coupon api management */
    const handleApplyCoupan = (coupanCode: string) => {
        let params: {
            pickup_locations?: any,
            destination_locations?: any,
            stops?: any,
            is_coupon_apply: boolean,
            discount_code: string,
            is_secured: boolean,
            is_time_and_distance_exists: boolean
            distance: number | null
            duration: number | null
            pickup: string
            destination: string
            pickupState: string,
            cgst: number | null
            sgst: number | null
            destinationState: string
            toll: number | null
            points: string
        } = {
            pickup_locations: JSON.stringify(originLocation),
            destination_locations: JSON.stringify(destinationLocation),
            // is_coupon_apply: true,
            // discount_code: coupanCode,
            is_secured: isEnablesecureMode == "on" ? true : false,
            is_time_and_distance_exists: rideQuotationList?.data?.distance != null,
            distance: rideQuotationList?.data?.distance,
            duration: rideQuotationList?.data?.duration,
            pickup: rideQuotationList?.data?.address?.pickup,
            destination: rideQuotationList?.data?.address?.destination,
            pickupState: rideQuotationList?.data?.pickupState,
            cgst: rideQuotationList?.data?.cgst,
            sgst: rideQuotationList?.data?.sgst,
            destinationState: rideQuotationList?.data?.destinationState,
            toll: rideQuotationList?.data?.toll,
            points: rideQuotationList?.data?.points
        }
        if (rideQuotationList?.data?.address?.stops.length !== 0) {
            params = {
                ...params,
                stops: JSON.stringify(rideQuotationList?.data?.address?.stops)
            }
        }

        if (coupanCode !== "") {
            params = {
                ...params,
                is_coupon_apply: true,
                discount_code: coupanCode,
            }
        }
        dispatch(getRideQuotationList(params)).unwrap().then((res) => {
            setPricingModal(res.result)
            if (selectedTempCarType && res?.result?.length !== 0) {
                let findIndex = res.result.findIndex(item => item?.id == selectedTempCarType.id)
                selectCarType(findIndex)
                if (selectedCarType) {
                    setSelectedCarType(res.result[findIndex])
                }
            }
            setrideQuatationData(res.result)
            setDisocuntCode(coupanCode)
            bottomSheetRef.current?.snapToIndex(1)
        }).catch((error) => {
        })
        dispatch(getDiscountListApi(null)).unwrap().then(res => {
        }).catch(e => { })
    }

    const renderDiscountList = ({ item, index }: { item: discountCoupans, index: number }) => {
        return (
            <CustomDiscountCouponComponent
                id={item?.coupon?.id?.toString()}
                title={item?.coupon?.offerName}
                subTitle={generateCustomMessage(item)?.subtitle}
                onPress={() => {
                    if (appliedCoupon == item?.coupon?.id?.toString()) {
                        dispatch(setAppliedCoupon(""))
                        handleApplyCoupan("")
                        setIsOpenDiscountCouponsModal(false)
                    } else {
                        dispatch(setAppliedCoupon(item?.coupon?.id?.toString()))
                        handleApplyCoupan(item?.coupon?.discountCode)
                        setIsOpenDiscountCouponsModal(false)
                    }
                }}
                toDate={item?.coupon?.toDate}
                fromDate={item?.coupon?.fromDate}
            />
        )
    }

    const discountNotFoundEmptyComponent = () => {
        return (
            <View style={[GlobalStyle.centerContainer, { marginVertical: wp(40) }]}>
                <Lottie source={Icons.DISCOUNT_COUPON_NOT_FOUND} resizeMode='cover' autoPlay loop style={Styles.couponNotFoundAnimation} />
                <Text style={[Styles.discountNotFoundText]}>{t(TranslationKeys.oops)}</Text>
                <Text style={[GlobalStyle.subTitleStyle, { textAlign: 'center', paddingHorizontal: wp(4) }]}>{t(TranslationKeys.discount_not_found)}</Text>
            </View>
        )
    }

    const selectCarType = (selectedIndex: number) => {
        if (store.getState().HomeSlice?.rideQuotationList?.result.length !== 0) {
            setSelectedTempCarType(store.getState().HomeSlice?.rideQuotationList?.result?.find((item, index) => index == selectedIndex))
        }
    };

    const closeDatePickerBottomSheet = (type: string) => {
        setSelectedDate(moment(type == "close" ? new Date : date).format("YYYY-MM-DDTHH:mm:ss"))
        setBottomSheetHeight(["30%", "85%"])
        bottomSheetRef.current?.snapToPosition("85%", { duration: 700 });
        setSheetIndex(1)
        setShowdatePickerSheet(false)
    };

    const createRideApi = () => {
        const params: any = {};

        // Add pickup and destination locations
        if (originLocation) {
            params.pickup_locations = JSON.stringify(originLocation);
        }
        if (destinationLocation) {
            params.destination_locations = JSON.stringify(destinationLocation);
        }

        // Rider information
        const userInfo = {
            rider_name: selectedContact?.name === AppStrings.myself ? 'self' : selectedContact?.name,
            phone: selectedContact?.name === AppStrings.myself ? 'self' : selectedContact?.mobileNumber,
        };
        params.rider_info = JSON.stringify(userInfo);

        // Pickup mode and time
        if (pickUpTime === PICK_UP_MODE.NOW) {
            params.pickup_mode = PICK_UP_MODE.NOW;
        } else {
            params.pickup_mode = PICK_UP_MODE.LATER;
            params.preBookedTime = selectedDate;
        }

        // Payment method
        if (paymentMethod) {
            params.payment_method = paymentMethod.toUpperCase();
        }

        // Discount code
        if (disocuntCode) {
            params.discount_code = disocuntCode;
        }

        // Secure mode
        if (isEnablesecureMode === "on") {
            params.is_secured = true;
        }

        // Selected pricing model car
        if (selectedCarType?.id || selectedTempCarType?.id) {
            params.price_model = selectedCarType?.id;
        }

        // Stops (waypoints)
        if (waypoints.length !== 0) {
            params.stops_lat_long = JSON.stringify(waypoints);
        }

        // Estimated time and distance
        if (rideQuotationList?.data.duration !== null) {
            params.estimatedTime = rideQuotationList?.data.duration;
        }
        params.distance = rideQuotationList?.data.distance;
        params.points = rideQuotationList?.data.points;

        // Pickup and destination addresses
        params.pickup = rideQuotationList?.data.address.pickup;
        params.destination = rideQuotationList?.data?.address?.destination;
        params.pickupState = rideQuotationList?.data.pickupState,
            params.cgst = rideQuotationList?.data.cgst,
            params.sgst = rideQuotationList?.data.sgst,
            params.destinationState = rideQuotationList?.data.destinationState,
            params.toll = rideQuotationList?.data.toll
        // Stops in ride quotation
        if (rideQuotationList?.data.address.stops.length !== 0) {
            params.stops = JSON.stringify(rideQuotationList?.data.address.stops);
        }
        if (deliveryDetails) {
            params.senderFullName = deliveryDetails?.senderFullName;
            params.senderPhoneNumber = deliveryDetails.senderPhoneNumber;
            params.senderPickupAddress = deliveryDetails.senderPickupAddress;
            params.receiverFullName = deliveryDetails.receiverFullName;
            params.receiverPhoneNumber = deliveryDetails.receiverPhoneNumber;
            params.receiverDeliveryAddress = deliveryDetails.receiverDeliveryAddress;
            params.goodsType = deliveryDetails.goodsType;
            params.goodsPackage = deliveryDetails.goodsPackage;
            params.goodsWeight = deliveryDetails.goodsWeight;
        }
        const paramss = {
            paymentType: "razorpay"
        }
        setDisabled(true)
        dispatch(paymentBeforeAfter(paramss)).unwrap().then((BeforeRidRes) => {
            dispatch(createRide(params)).unwrap().then((res) => {
                dispatch(setLastActibeStep(0))
                dispatch(setIsComplateTimer(false))
                analytics().logEvent(ANALYTICS_ID.RIDE_BOOKING_SUCCESSFULLY, {
                    'userDetails': {
                        'id': userDetail?.id,
                        'name': userDetail?.name,
                        'phoneNumber': userDetail?.phoneNumber
                    }
                })
                if (res.pickupMode === PICK_UP_MODE.NOW) {
                    if (res?.ridePayment?.paymentMethod === "CARD" && BeforeRidRes?.takePaymentBeforeRide) {
                        const data = new FormData()
                        data.append("payment_type", res?.ridePayment?.paymentMethod)
                        data.append("total_amount", res?.ridePayment?.totalFare)
                        const rideParams = {
                            rideId: res?.id,
                            formData: data
                        }
                        dispatch(makeRidePayment(rideParams)).unwrap()
                            .then(response => {
                                var options = {
                                    description: 'RYD Now',
                                    image: tokenDetail?.userData?.profilePic ?? ImagesPaths.EMPTY_IMAGE,
                                    currency: 'INR',
                                    key: store.getState().AuthSlice.commonCredentialsData?.keyId,
                                    // callback_url: 'https://www.figma.com/file/9X2YMvbPn5jaOuTcFwD1cx/Taxi-booking-Mobille-App-Driver-%26-Passenger-%26-Admin-(Copy)?type=design&node-id=2923-30541&t=PMTCn4rno94UCJHP-0',
                                    redirect: true,
                                    amount: res?.totalFare * 100,
                                    name: tokenDetail?.userData?.name,
                                    order_id: response?.razorpayResponse?.orderId,//Replace this with an order_id created using Orders API.
                                    prefill: {
                                        // email: tokenDetail?.userData?.email,
                                        contact: tokenDetail?.userData?.phoneNumber,
                                        // name: 'testing'
                                    },
                                    theme: { color: colors.PRIMARY },
                                    method: {
                                        // credit: false, // Disable Pay Later option
                                        netbanking: true,
                                        card: true,
                                        upi: true,
                                        wallet: true,
                                        paylater: false
                                    }
                                }
                                RazorpayCheckout.open(options as any).then((data: { razorpay_payment_id: any; }) => {
                                    console.log("🚀  file: SelectPaymentModeScreen.tsx:163  RazorpayCheckout.open ~ data:", data)
                                    navigation.navigate("SearchingRiderScreen", { id: res?.id, from: 'BookingScreen' })
                                    setDisabled(false)

                                }).catch((error: { code: any; description: any; }) => {
                                    setDisabled(false)
                                    // handle failure
                                    if (error.code == 0) {
                                        AppAlert(t(TranslationKeys.Message), 'Cancelled by user')
                                    } else {
                                        Alert.alert(`${t(TranslationKeys.error)} ${error.code} \n ${error.description}`);
                                    };
                                    dispatch(deleteRideBooking(res?.id)).unwrap().then(res => {
                                        dispatch(setCreateRideData(null))
                                    }).catch(e => console.log({ e }))
                                });
                            }).catch((e: any) => {
                                console.log({ e })
                                dispatch(deleteRideBooking(res?.id)).unwrap().then(res => {
                                    dispatch(setCreateRideData(null))
                                }).catch(e => console.log({ e }))
                            })
                    } else {
                        setDisabled(false)
                        navigation.navigate("SearchingRiderScreen", { id: res?.id, from: "BookingScreen" })
                    }
                } else if (res.pickupMode === PICK_UP_MODE.LATER) {
                    if (res?.ridePayment?.paymentMethod === "CARD" && BeforeRidRes?.takePaymentBeforeRide) {
                        const data = new FormData()
                        data.append("payment_type", res?.ridePayment?.paymentMethod)
                        data.append("total_amount", res?.ridePayment?.totalFare)
                        const rideParams = {
                            rideId: res?.id,
                            formData: data
                        }
                        dispatch(makeRidePayment(rideParams)).unwrap()
                            .then(response => {
                                var options = {
                                    description: 'RYD Now',
                                    image: tokenDetail?.userData?.profilePic ?? ImagesPaths.EMPTY_IMAGE,
                                    currency: 'INR',
                                    key: store.getState().AuthSlice.commonCredentialsData?.keyId,
                                    // callback_url: 'https://www.figma.com/file/9X2YMvbPn5jaOuTcFwD1cx/Taxi-booking-Mobille-App-Driver-%26-Passenger-%26-Admin-(Copy)?type=design&node-id=2923-30541&t=PMTCn4rno94UCJHP-0',
                                    redirect: true,
                                    amount: res?.totalFare * 100,
                                    name: tokenDetail?.userData?.name,
                                    order_id: response?.razorpayResponse?.orderId,//Replace this with an order_id created using Orders API.
                                    prefill: {
                                        // email: tokenDetail?.userData?.email,
                                        contact: tokenDetail?.userData?.phoneNumber,
                                        // name: 'testing'
                                    },
                                    theme: { color: colors.PRIMARY },
                                    method: {
                                        // credit: false, // Disable Pay Later option
                                        netbanking: true,
                                        card: true,
                                        upi: true,
                                        wallet: true,
                                        paylater: false
                                    }
                                }
                                RazorpayCheckout.open(options as any).then((data: { razorpay_payment_id: any; }) => {
                                    console.log("🚀  file: SelectPaymentModeScreen.tsx:163  RazorpayCheckout.open ~ data:", data)
                                    // navigation.navigate("SearchingRiderScreen", { id: res?.id, from: 'BookingScreen' })
                                    setDisabled(false)
                                    setShowPrebookSuccessPopup(true)
                                }).catch((error: { code: any; description: any; }) => {
                                    setDisabled(false)
                                    // handle failure
                                    if (error.code == 0) {
                                        AppAlert(t(TranslationKeys.Message), 'Cancelled by user')
                                    } else {
                                        Alert.alert(`${t(TranslationKeys.error)} ${error.code} \n ${error.description}`);
                                    };
                                    dispatch(deleteRideBooking(res?.id)).unwrap().then(res => {
                                        dispatch(setCreateRideData(null))
                                    }).catch(e => console.log({ e }))
                                });
                            }).catch((e: any) => {
                                console.log({ e })
                                dispatch(deleteRideBooking(res?.id)).unwrap().then(res => {
                                    dispatch(setCreateRideData(null))
                                }).catch(e => console.log({ e }))
                            })
                    } else {
                        setDisabled(false)
                        setShowPrebookSuccessPopup(true)
                    }
                    setDisabled(false)
                    dispatch(setPaymentMethod("Card"))
                    dispatch(setRideBookingData(res))
                }
                else {
                    setDisabled(false)
                    dispatch(resetRideQuotationList())
                    dispatch(setBookingDestinations([]))
                }
            }).catch((error) => {
                setDisabled(false)
                console.log("ERROR", error);
            })
        })
    };


    const renderFooter = useCallback(
        (props: React.JSX.IntrinsicAttributes & BottomSheetDefaultFooterProps) => {
            console.log("PROPSSSS--->", props)
            if (!showContactBottomSheet && sheetIndex === 0 && !showdatePickerSheet) return null;
            return (
                <BottomSheetFooter {...props} bottomInset={0}>
                    {
                        showdatePickerSheet ?
                            <View style={Styles.datePickerMainContainerStyle}>
                                <CustomBottomBtn
                                    containerStyle={Styles.commonDatePickerBottomBtn}
                                    style={Styles.datePicketCancelBtn}
                                    txtStyle={{
                                        color: colors.PRIMARY
                                    }}
                                    onPress={() => {
                                        setPickUpTime("NOW");
                                        closeDatePickerBottomSheet("cancel")
                                        setPickupMode("NOW")
                                        // if (Platform.OS == 'android') {
                                        bottomSheetRef.current?.snapToPosition("98%", {
                                            duration: 600
                                        })
                                        // bottomSheetRef.current?.expand({ duration: 600 })
                                        setSheetIndex(1)
                                        // } else {
                                        //     setBottomSheetHeight(["30%", "85%"])
                                        // }
                                    }}
                                    title={t(TranslationKeys.cancel)} />
                                <CustomBottomBtn
                                    containerStyle={Styles.commonDatePickerBottomBtn}
                                    onPress={() => {
                                        closeDatePickerBottomSheet("confirm")
                                        // if (Platform.OS == 'android') {
                                        bottomSheetRef.current?.snapToPosition("98%", {
                                            duration: 600
                                        })
                                        // bottomSheetRef.current?.expand({ duration: 600 })
                                        setSheetIndex(1)
                                        // bottomSheetRef.current?.expand()
                                        // } else {
                                        //     setBottomSheetHeight(["30%", "85%"])
                                        // }
                                    }}
                                    title={t(TranslationKeys.confirm)} />
                            </View>
                            :
                            <CustomBottomBtn
                                // containerStyle={{ paddingVertical: wp(2), }}
                                disabled={rideQuotationError}
                                style={{ backgroundColor: !rideQuotationError ? colors.PRIMARY : colors.SECONDARY_LIGHT_ICON }}
                                onPress={() => {
                                    if (showContactBottomSheet) {
                                        selectedTempContact && setSelectedContact(selectedTempContact)
                                        setBottomSheetHeight(["30%", "85%"])
                                        // bottomSheetRef.current?.snapToPosition("70%", {
                                        //     duration: 600
                                        // })
                                        // setTimeout(() => {
                                        //     bottomSheetRef.current?.snapToIndex(1)
                                        // }, 200);
                                        setShowContactBottomSheet(false)
                                    } else {
                                        if (selectedCarType && selectedContact && !isDeliveryModule) {
                                            if (!selectedDate) {
                                                AppAlert(t(TranslationKeys.Message), t(TranslationKeys.please_select_date))
                                            } else {
                                                console.log("if-1--else", selectedTempCarType)
                                                // create ride api call
                                                createRideApi()
                                            }
                                        } else {
                                            // const selectedCarData = carsType.filter((item, index) => item.selected == true)[0]
                                            setSelectedCarType(selectedTempCarType)
                                            if (selectedTempCarType) {
                                                setSelectedCarImageError(false)
                                                if (isDeliveryModule) {
                                                    // createRideApi()
                                                    dispatch(setDeliveryDetails({ ...deliveryDetails, selectedCar: selectedTempCarType }));
                                                    navigation.navigate('DeliveyReviewScreen')
                                                } else {
                                                    setSelectedDate(moment(date).format("YYYY-MM-DDTHH:mm:ss"))
                                                    setBottomSheetHeight(["30%", "85%"])
                                                    // setTimeout(() => {
                                                    //     bottomSheetRef.current?.snapToIndex(1)
                                                    // }, 200);
                                                    // bottomSheetRef.current?.snapToPosition("70%", {
                                                    //     duration: 600
                                                    // })
                                                    setShowContactBottomSheet(false)
                                                }
                                            } else {
                                                AppAlert('RYD Now', t(TranslationKeys.please_choose_a_vehicle))
                                            }
                                        }
                                    }

                                }}
                                title={isDeliveryModule ? t(TranslationKeys.next) : showContactBottomSheet ? t(TranslationKeys.share_trip_details) :
                                    selectedCarType ? t(TranslationKeys.confirm_ride) : t(TranslationKeys.book_ride)} />
                    }
                </BottomSheetFooter>
            )
        },
        [sheetIndex, showdatePickerSheet, selectedTempCarType, selectedCarType]
    );

    return (
        <>{!isDeliveryModule ?
            <SafeAreaView edges={['top']} style={[GlobalStyle.container, { backgroundColor: colors.SECONDARY_BACKGROUND }]}>
                {(isLoading || contactLoader || enableSecureModeLoader) ? <CustomActivityIndicator /> : null}
                <View style={Styles.headerContainerStyle}>
                    <CustomHeader
                        edges={['top']}
                        safeAreacontainer={Styles.transparentContainer}
                        headerStyle={Styles.transparentContainer}
                        iconStyle={{
                            tintColor: colors.SECONDARY_ICON
                        }}
                        onPress={() => {
                            if ((showContactBottomSheet || showdatePickerSheet) && !isDeliveryModule) {
                                setBottomSheetHeight(["30%", "85%"])
                                // bottomSheetRef.current?.snapToPosition("70%", {
                                //     duration: 600
                                // })
                                showContactBottomSheet && setShowContactBottomSheet(false)
                                showdatePickerSheet && setShowdatePickerSheet(false)
                            } else if (selectedCarType && !isDeliveryModule) {
                                // bottomSheetRef.current?.snapToPosition("70%", {
                                //     duration: 600
                                // })
                                setSelectedCarType(undefined)
                                setBottomSheetHeight(["30%", "85%"])
                            }
                            else {
                                dispatch(setAppliedCoupon(-1))
                                navigation.goBack()
                            }
                        }}
                    />
                </View>
                <CustomMapContainer
                    ref={mapRef}
                    region={{
                        latitude: userCordinates?.latitude - 0.003 ?? 21.23814020005119 - 0.003,
                        longitude: userCordinates?.longitude ?? 72.88746321772949,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.0121,
                    }}>
                    {routeTrackList ?
                        <Polyline
                            coordinates={routeTrackList}
                            strokeWidth={3}
                            fillColor={colors.SECONDARY_ICON}
                            strokeColor={colors.SECONDARY_ICON}
                        /> : null}

                    {((directionCoords && directionCoords?.length !== 0) && (bookingDestinations && bookingDestinations?.length != 0)) ? (
                        <Polyline
                            coordinates={[
                                bookingDestinations[0],
                                directionCoords[0],
                            ]}
                            strokeWidth={3}
                            strokeColor={colors.SECONDARY_ICON}
                            fillColor={colors.SECONDARY_ICON}
                            lineDashPattern={[2, 2]}
                        />
                    ) : null}

                    {((directionCoords && directionCoords?.length !== 0) && (bookingDestinations && bookingDestinations?.length != 0)) ? (
                        <Polyline
                            coordinates={[
                                bookingDestinations[bookingDestinations.length - 1],
                                directionCoords[directionCoords?.length - 1],
                            ]}
                            strokeWidth={3}
                            strokeColor={colors.SECONDARY_ICON}
                            fillColor={colors.SECONDARY_ICON}
                            lineDashPattern={[2, 2]}
                        />
                    ) : null}
                    {
                        bookingDestinations.map((item, index) => {
                            return (
                                <>
                                    {index == 0 ? <CustomUserMarkerView
                                        style={{
                                            zIndex: index + 1
                                        }}
                                        iconStyle={{ tintColor: colors.GREEN_ICON }}
                                        coordinate={{
                                            latitude: item.latitude,
                                            longitude: item.longitude,
                                        }}
                                    /> : null}

                                    {
                                        index !== 0 && index !== bookingDestinations.length - 1 ?
                                            <CustomUserMarkerView
                                                style={{
                                                    zIndex: index + 1,
                                                }}
                                                iconStyle={Styles.stopesMarkerStyle}
                                                coordinate={{
                                                    latitude: item.latitude,
                                                    longitude: item.longitude,
                                                }}
                                            /> : null
                                    }

                                    {index == bookingDestinations.length - 1 ? <Marker
                                        coordinate={{
                                            latitude: item.latitude,
                                            longitude: item.longitude,
                                        }}
                                        anchor={{ x: 0.5, y: 0.5 }}
                                    >
                                        <Image source={Icons.DESTINATION_LOCATION_ICON} style={{ width: wp(15), height: wp(15), resizeMode: "contain" }} ></Image>
                                    </Marker>
                                        : null}
                                </>
                            )
                        })
                    }
                </CustomMapContainer>
                <CustomBottomSheet
                    ref={bottomSheetRef}
                    snapPoints={snapPoints}
                    index={0}
                    enablePanDownToClose={false}
                    animateOnMount={false}
                    enableOverDrag={false}
                    enableDynamicSizing={showdatePickerSheet ? false : true}
                    backgroundStyle={{
                        backgroundColor: showdatePickerSheet ? colors.PRIMARY_BACKGROUND : colors.PRIMARY_BACKGROUND
                    }}
                    containerStyle={Styles.bottomSheetContainerStyle}
                    footerComponent={renderFooter}
                    onChange={(index) => {
                        setSheetIndex(index)
                        mapRef.current?.animateToRegion({
                            latitude: originLocation?.latitude - 0.003,
                            longitude: originLocation?.longitude,
                            latitudeDelta: 0.015,
                            longitudeDelta: 0.0121,
                        }, 1000)
                        let data = {
                            latitude: originLocation?.latitude - 0.003,
                            longitude: originLocation?.longitude,
                        }
                        mapRef.current?.animateCamera({
                            center: data,
                            zoom: index == 1 ? 14 : 16,
                        }, {
                            duration: 1200
                        })
                    }}
                >
                    {(!showContactBottomSheet && !showdatePickerSheet) ?
                        <BottomSheetScrollView nestedScrollEnabled style={Styles.bottomSheetScrollView}>
                            {/* destinations location list */}
                            <FlatList
                                data={bookingDestinations}
                                renderItem={renderItem}
                                style={[Styles.destiantionListContainerStyle, Styles.commonBackShadow]}
                                ItemSeparatorComponent={() => {
                                    return (
                                        <View style={Styles.itemSepratorLine} />
                                    )
                                }}
                            />

                            {/* //* Pick Up & Secure Mode Btns */}
                            <>
                                <View style={{ paddingVertical: wp(2), backgroundColor: colors.SECONDARY_BACKGROUND, marginHorizontal: wp(5), borderRadius: wp(4), paddingHorizontal: wp(2) }}>
                                    <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: wp(1) }]}>
                                        <View style={GlobalStyle.rowContainer}>
                                            <Text style={Styles.toggleBtnText}>{t(TranslationKeys.ride)}</Text>
                                            <TouchableOpacity activeOpacity={1} onPress={() => {
                                                if (rideQuotationError || disabled) {
                                                    AppAlert(t(TranslationKeys.error), t(TranslationKeys.no_route_found))
                                                } else {
                                                    setPickupMode(pickupMode == "NOW" ? PICK_UP_MODE.LATER : PICK_UP_MODE.NOW)
                                                    setPickUpTime(pickupMode == "NOW" ? PICK_UP_MODE.LATER : PICK_UP_MODE.NOW);
                                                }
                                                // setisPickUpMode({ visible: true, message: "This features will be unlocked soon." })
                                            }} style={[Styles.toggleContainerStyle, {
                                                backgroundColor: pickupMode !== "NOW" ? colors.GREEN_LIGHT : colors.SHADOW_1,
                                            }]}>
                                                {pickupMode == PICK_UP_MODE.NOW ? <View style={[Styles.toggleStyle, { backgroundColor: colors.SECONDARY }]} /> : null}
                                                <Text style={[Styles.toggleTextStyle, { color: colors.SECONDARY_TEXT, fontFamily: Fonts.FONT_POP_SEMI_BOLD }]}>{pickupMode == PICK_UP_MODE.NOW ? t(TranslationKeys.now) : t(TranslationKeys.later)}</Text>
                                                {pickupMode == PICK_UP_MODE.LATER ? <View style={{ ...Styles.toggleStyle }} /> : null}
                                            </TouchableOpacity>
                                        </View>
                                        <View style={GlobalStyle.rowContainer}>
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={{ ...Styles.toggleBtnText, marginLeft: wp(3) }}>{t(TranslationKeys.secure)}</Text>
                                                <Text style={{ ...Styles.toggleBtnText, marginLeft: wp(3) }}>{t(TranslationKeys.mode)}</Text>
                                            </View>
                                            <TouchableOpacity
                                                activeOpacity={1}
                                                onPress={() => {
                                                    if (rideQuotationError || disabled) {
                                                        AppAlert(t(TranslationKeys.error), t(TranslationKeys.no_route_found))
                                                    } else {
                                                        enableSecureModeApiCall(isEnablesecureMode == "on" ? false : true)
                                                    }
                                                }}
                                                style={{
                                                    ...Styles.toggleContainerStyle,
                                                    // width: wp(13.5),
                                                    backgroundColor: isEnablesecureMode == "on" ? colors.GREEN_LIGHT : colors.SHADOW_1,
                                                }}
                                            >
                                                {isEnablesecureMode == "off" ? <View style={[Styles.toggleStyle, { backgroundColor: colors.SECONDARY }]} /> : null}
                                                <Text style={[Styles.toggleTextStyle, { color: colors.SECONDARY_TEXT, fontFamily: Fonts.FONT_POP_SEMI_BOLD }]}>{isEnablesecureMode == "on" ? t(TranslationKeys.on) : t(TranslationKeys.off)}</Text>
                                                {isEnablesecureMode == "on" ? <View style={{ ...Styles.toggleStyle }} /> : null}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </>

                            {/* //* Discount Coupans Container */}
                            <>
                                <View style={Styles.discountCouponContainer}>
                                    <TouchableOpacity activeOpacity={1} onPress={() => {
                                        if (rideQuotationError || disabled) {
                                            AppAlert(t(TranslationKeys.error), t(TranslationKeys.no_route_found))
                                        } else {
                                            setIsOpenDiscountCouponsModal(true)
                                        }
                                    }
                                    } style={[GlobalStyle.rowContainer, Styles.discountRowContainer]}>
                                        <Text style={Styles.discountCouponsText}>{t(TranslationKeys.discount_coupons)}</Text>
                                        <Image source={Icons.RIGHT_ARROW_ICON} style={Styles.rightArrowIconStyle} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={[Styles.timeTxtStyle, { marginHorizontal: wp(6) }]}>{t(TranslationKeys.discount_base_on_basefare)}</Text>
                            </>

                            {/* qutation car list */}
                            {(selectedCarType && !isDeliveryModule) ?
                                <View style={Styles.selectedCarContainerStyle}>
                                    <FastImage
                                        resizeMode={selectedCarType.carTypeImage && !selectedCarImageError ? 'contain' : 'cover'}
                                        source={selectedCarType.carTypeImage && !selectedCarImageError ? { uri: selectedCarType.carTypeImage } : ImagesPaths.EMPTY_IMAGE}
                                        onError={() => {
                                            setSelectedCarImageError(true)
                                        }} style={[selectedCarType.carTypeImage && !selectedCarImageError ? Styles.carImageStyle : Styles.carTypeEmptyImageStyle]} />
                                    <View style={{
                                        alignItems: 'center'
                                    }}>
                                        <Text numberOfLines={1} style={[Styles.carTypeTxtStyle, { width: wp(30), textAlign: 'center' }]}>{selectedCarType.carType}</Text>
                                        <Text numberOfLines={1} style={[Styles.timeTxtStyle, { textAlign: 'center', width: wp(20) }]}>{minuteToHoursTransform(rideQuotationList?.data?.duration ?? 0, t).totalTime}&nbsp;{minuteToHoursTransform(rideQuotationList?.data?.duration ?? 0, t).timeInMinOrHr}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                                        <Text numberOfLines={1} style={[Styles.currencyStyle, { bottom: wp(0.5), marginRight: wp(1) }]}>{setPrice(t, selectedCarType.fare, true, false)}</Text>
                                        <Text numberOfLines={1} style={Styles.rupeeSymbolTxtStyle}>{setPrice(t, selectedCarType.fare, false, false, true)}</Text>
                                    </View>
                                </View>
                                : (
                                    <FlatList
                                        data={pricingModal}
                                        renderItem={(props) => <RenderCarItem {...props} selectedItem={selectedTempCarType} onPress={selectCarType} t={t} />}
                                        contentContainerStyle={[Styles.carlistContentContainerStyle]}
                                        style={[Styles.carsListConatinerStyle, Styles.commonBackShadow, { marginTop: wp(1) }]}
                                        showsHorizontalScrollIndicator={false}
                                        ItemSeparatorComponent={() => {
                                            return (
                                                <View style={Styles.carsItemSepratorStyle} />
                                            )
                                        }}
                                    />
                                )
                            }

                            {/* select payment method */}
                            <CustomIconTextView
                                onPress={() => {
                                    if (rideQuotationError || disabled) {
                                        AppAlert(t(TranslationKeys.error), t(TranslationKeys.no_route_found))
                                    } else {
                                        navigation.navigate('SelectPaymentModeScreen')
                                    }
                                }}
                                activeOpacity={1}
                                title={paymentMethod == "Cash" ? t(TranslationKeys.cash) : paymentMethod == "Card" ? t(TranslationKeys.card_payment) : t(TranslationKeys.upi_payment)}
                                leftIcon={paymentMethod == "Cash" ? Icons.CASH_ICON : paymentMethod == "Card" ? Icons.CARD : Icons.QR_CODE_ICONS}
                                leftIconStyle={{ tintColor: colors.SECONDARY }}
                                rightIcon={Icons.RIGHT_ARROW_ICON}
                                rightIconStyle={{ transform: [{ rotate: locale ? '180deg' : '0deg' }] }}
                                style={[Styles.commonPaddingContainer, Styles.commonBackShadow]}
                                onCloseIcon={() => navigation.navigate('SelectPaymentModeScreen')}
                            />

                            {selectedContact?.name ?
                                <TouchableOpacity
                                    onPress={async () => {
                                        if (rideQuotationError || disabled) {
                                            AppAlert(t(TranslationKeys.error), t(TranslationKeys.no_route_found))
                                        } else {
                                            await checkContactsPermission().then(res => {
                                                if (res) {
                                                    setShowContactBottomSheet(true);
                                                    setBottomSheetHeight(["50%"]);
                                                    bottomSheetRef.current?.snapToIndex(0);
                                                }
                                            })
                                        }
                                    }}
                                    activeOpacity={1} style={[Styles.contactPickerContainer, Styles.commonBackShadow, Styles.commonPaddingContainer]}>
                                    <View style={GlobalStyle.rowContainer}>
                                        {selectedContact.name != AppStrings.myself ?
                                            <View style={[Styles.labelContainerStyle, { backgroundColor: colors.SECONDARY }]}>
                                                <Text style={Styles.labelTxtStyle}>{selectedContact?.name?.trim().charAt(0).toUpperCase()}</Text>
                                            </View>
                                            :
                                            <Image
                                                source={Icons.USER_ICON}
                                                style={Styles.userIconStyle} />}
                                        <Text numberOfLines={1} style={[Styles.contactNameTxtStyle,]}>{selectedContact?.name !== AppStrings.myself ? selectedContact?.name : t(TranslationKeys.book_for_self)}</Text>
                                        {selectedContact?.mobileNumber && (selectedContact.name != AppStrings.myself) ?
                                            <View style={Styles.dotViewStyle} />
                                            : null
                                        }
                                        {
                                            (selectedContact.name != AppStrings.myself) ?
                                                <Text numberOfLines={1} style={Styles.mobileNumberTxtStyle}>{selectedContact?.mobileNumber}</Text>
                                                :
                                                null
                                        }
                                    </View>
                                    <Image source={Icons.RIGHT_ARROW_ICON}
                                        style={[Styles.rightArrowIconStyle]} />
                                </TouchableOpacity>
                                :
                                <CustomIconTextView
                                    onPress={() => {
                                        if (rideQuotationError || disabled) {
                                            AppAlert(t(TranslationKeys.error), t(TranslationKeys.no_route_found))
                                        } else {
                                            setShowContactBottomSheet(true);
                                            setBottomSheetHeight(["50%"]);
                                            bottomSheetRef.current?.snapToIndex(0);
                                        }
                                    }}
                                    activeOpacity={1}
                                    title={(selectedContact?.name && (selectedContact?.name !== AppStrings.myself)) ? selectedContact?.name : t(TranslationKeys.book_for_self)}
                                    leftIcon={Icons.USER_ICON}
                                    rightIcon={Icons.RIGHT_ARROW_ICON}
                                    style={[Styles.commonPaddingContainer, Styles.commonBackShadow, {
                                        marginBottom: wp(5),
                                    }]}
                                    onCloseIcon={() => {
                                        setShowContactBottomSheet(true);
                                        setBottomSheetHeight(["50%"]);
                                        bottomSheetRef.current?.snapToIndex(0);
                                    }}
                                />
                            }

                        </BottomSheetScrollView> : null
                    }

                    {showContactBottomSheet ?
                        <BottomSheetScrollView bounces={false} nestedScrollEnabled style={Styles.contactBottomSheetContainerStyle}>
                            <Text numberOfLines={2} style={Styles.someOneElseTxtStyle}>{t(TranslationKeys.someone_else_taking_ride)}</Text>
                            <Text numberOfLines={2} style={Styles.chooseContactStyle}>{t(TranslationKeys.choose_a_contact)}</Text>
                            {
                                contacts?.slice(0, 2).map((item, index) => {
                                    return (
                                        <>
                                            <CustomRadioButton
                                                selectedItem={selectedTempContact?.mobileNumber == item?.mobileNumber}
                                                onPress={() => {
                                                    setSelectedTempContact(item)
                                                }}
                                                item={item}
                                                labelIcon={index == 0 ? Icons.USER_ICON : undefined}
                                                labelTextStyle={{ color: colors.WHITE_ICON }}
                                                labelIconStyle={{ tintColor: colors.SECONDARY }}
                                                radioIconStyle={{ tintColor: colors.PRIMARY }}
                                            />
                                            <View style={Styles.contactItemSepratorLine} />
                                        </>
                                    )
                                })
                            }
                            <CustomRadioButton
                                onPress={() => {
                                    setshowContactListModal(true)
                                }}
                                labelIcon={Icons.CONTACT_ICON}
                                labelIconStyle={Styles.contactIconStyle}
                                radioIconStyle={Styles.contactRadioIconStyle}
                                containerStyle={Styles.contactContainerStyle}
                                item={{
                                    id: 1,
                                    name: t(TranslationKeys.choose_another_contacts)
                                }}
                                titleStyle={Styles.contactTitleStyle}
                            />
                        </BottomSheetScrollView> : null
                    }

                    {showdatePickerSheet ?
                        <View style={Styles.datePickerContainerStyle}>
                            <View style={{
                                backgroundColor: colors.SECONDARY_BACKGROUND,
                                marginHorizontal: wp(5),
                                borderRadius: wp(2),
                            }}>
                                <DatePicker
                                    date={date}
                                    onDateChange={(value) => {
                                        setDate(value)
                                    }}
                                    locale={globalLang}
                                    minimumDate={new Date(new Date().getTime() + 30 * 60 * 1000)}
                                    style={Styles.datePickerStyle}
                                    textColor={colors.PRIMARY_TEXT}
                                />
                            </View>
                        </View> : null
                    }

                    {/* contact list modal */}
                    {showContactListModal ?
                        <ContactListView
                            isLoading={false}
                            isVisible={showContactListModal}
                            selectedItem={selectedTempContact}
                            onClose={() => {
                                setshowContactListModal(false)
                            }}
                            data={contacts}
                            onButtonPress={(item) => {
                                item && setSelectedContact(item)
                                setSelectedTempContact(item)
                                setshowContactListModal(false)
                                setTimeout(() => {
                                    setShowContactBottomSheet(false)
                                    setBottomSheetHeight(["30%", "85%"])
                                    bottomSheetRef.current?.snapToPosition("98%", {
                                        duration: 600
                                    })
                                    setSheetIndex(1)
                                    // bottomSheetRef.current?.snapToIndex(0)
                                }, 500);
                            }}
                        /> : null}

                    {/* {showdatePickerSheet ?
                        <View style={Styles.datePickerMainContainerStyle}>
                            <CustomBottomBtn
                                containerStyle={Styles.commonDatePickerBottomBtn}
                                style={Styles.datePicketCancelBtn}
                                txtStyle={{
                                    color: colors.PRIMARY
                                }}
                                onPress={() => {
                                    setPickUpTime("NOW");
                                    closeDatePickerBottomSheet("cancel")
                                    setPickupMode("NOW")
                                    if (Platform.OS == 'android') {
                                        bottomSheetRef.current?.snapToPosition("85%", {
                                            duration: 600
                                        })
                                    } else {
                                        setBottomSheetHeight(["30%", "85%"])
                                    }
                                }}
                                title={t(TranslationKeys.cancel)} />
                            <CustomBottomBtn
                                containerStyle={Styles.commonDatePickerBottomBtn}
                                onPress={() => {
                                    closeDatePickerBottomSheet("confirm")
                                    if (Platform.OS == 'android') {
                                        bottomSheetRef.current?.snapToPosition("85%", {
                                            duration: 600
                                        })
                                    } else {
                                        setBottomSheetHeight(["30%", "85%"])
                                    }
                                }}
                                title={t(TranslationKeys.confirm)} />
                        </View>
                        :
                        <CustomBottomBtn
                            disabled={rideQuotationError || disabled}
                            style={{ backgroundColor: !rideQuotationError ? colors.PRIMARY : colors.SECONDARY_LIGHT_ICON }}
                            onPress={() => {
                                if (showContactBottomSheet) {
                                    selectedTempContact && setSelectedContact(selectedTempContact)
                                    setBottomSheetHeight(["30%", "85%"])
                                    // bottomSheetRef.current?.snapToPosition("70%", {
                                    //     duration: 600
                                    // })
                                    // setTimeout(() => {
                                    //     bottomSheetRef.current?.snapToIndex(1)
                                    // }, 200);
                                    setShowContactBottomSheet(false)
                                } else {
                                    if (selectedCarType && selectedContact && !isDeliveryModule) {
                                        if (!selectedDate) {
                                            AppAlert(t(TranslationKeys.Message), t(TranslationKeys.please_select_date))
                                        } else {
                                            console.log("if-1--else", selectedTempCarType)
                                            // create ride api call
                                            createRideApi()
                                        }
                                    } else {
                                        // const selectedCarData = carsType.filter((item, index) => item.selected == true)[0]
                                        setSelectedCarType(selectedTempCarType)
                                        if (selectedTempCarType) {
                                            setSelectedCarImageError(false)
                                            if (isDeliveryModule) {
                                                // createRideApi()
                                                dispatch(setDeliveryDetails({ ...deliveryDetails, selectedCar: selectedTempCarType }));
                                                navigation.navigate('DeliveyReviewScreen')
                                            } else {
                                                setSelectedDate(moment(date).format("YYYY-MM-DDTHH:mm:ss"))
                                                setBottomSheetHeight(["30%", "85%"])
                                                // setTimeout(() => {
                                                //     bottomSheetRef.current?.snapToIndex(1)
                                                // }, 200);
                                                // bottomSheetRef.current?.snapToPosition("70%", {
                                                //     duration: 600
                                                // })
                                                setShowContactBottomSheet(false)
                                            }
                                        } else {
                                            AppAlert('RYD Now', t(TranslationKeys.please_choose_a_vehicle))
                                        }
                                    }
                                }

                            }}
                            title={isDeliveryModule ? t(TranslationKeys.next) : showContactBottomSheet ? t(TranslationKeys.share_trip_details) :
                                selectedCarType ? t(TranslationKeys.confirm_ride) : t(TranslationKeys.book_ride)} />
                    } */}
                </CustomBottomSheet>

                {/* //* Discount Coupons Modal */}
                <Modal
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setIsOpenDiscountCouponsModal(false)}
                    visible={isOpenDiscountCouponsModal} >
                    {isVisibleApplyCoupanAnimation ?
                        <View style={Styles.applyDiscountCouponApplyContainer}>
                            <Lottie source={Icons.COUPON_APPLY} resizeMode='cover' autoPlay loop style={Styles.applyCouponAnimation} />
                        </View> : null}
                    <View style={{ padding: wp(5) }}>
                        <View style={[GlobalStyle.rowContainer, Styles.discountRowContainer, { marginVertical: top }]}>
                            <Text style={Styles.discountTitleText}>{t(TranslationKeys.discount_coupons)}</Text>
                            <CustomIconButton icon={Icons.CLOSE_ICON}
                                style={{ padding: wp(1) }}
                                iconStyle={Styles.rightArrowIconStyle}
                                onPress={() => setIsOpenDiscountCouponsModal(false)} />
                        </View>
                        <FlatList
                            data={discountCouponList}
                            renderItem={renderDiscountList}
                            ListEmptyComponent={discountNotFoundEmptyComponent}
                            contentContainerStyle={{ paddingBottom: wp(20) }}
                            bounces={false}
                            showsVerticalScrollIndicator={false}
                            keyExtractor={(index) => index?.toString()}
                        />
                    </View>
                </Modal>

                {/* //* Security Alert Modal */}
                {
                    isAlertVisible?.visible ?
                        <CustomModelAlert
                            title={t(TranslationKeys.secure_mode_activated)}
                            subTitle={isAlertVisible.message}
                            isOpen={isAlertVisible?.visible}
                            isIconVisible
                            animationSource={Icons.ENABLE_SECURE_MODE}
                            yesBtnTitle='Ok'
                            onPressYes={() => {
                                setIsAlertVisible({ message: "", visible: false })
                            }}
                        /> : null
                }
                {
                    isPickUpMode?.visible ?
                        <CustomModelAlert
                            title={t(TranslationKeys.pick_up)}
                            subTitle={isPickUpMode.message}
                            isOpen={isPickUpMode?.visible}
                            yesBtnTitle='Ok'
                            onPressYes={() => {
                                setisPickUpMode({ message: "", visible: false })
                            }}
                        /> : null
                }
                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={showPrebookSuccessPopup}>
                    <View style={[GlobalStyle.centerContainer, { flex: 1 }]}>
                        <Image source={Icons.CHECKBOX} style={Styles.bookingSuccessIcon} />
                        <Text style={Styles.headingText}>{t(TranslationKeys.ride_booked_successfully)}</Text>
                        <Text style={[GlobalStyle.subTitleStyle, Styles.subtitleText]}>{t(TranslationKeys.booking_statement)}</Text>
                    </View>
                    <CustomBottomBtn
                        onPress={() => {
                            try {
                                setShowPrebookSuccessPopup(false)
                                navigation.reset({
                                    index: 1,
                                    routes: [{
                                        name: 'DrawerStack',
                                        params: {
                                            screen: 'PreBookScreen'
                                        }
                                    }]
                                })
                            } catch (error: any) {
                                Alert.alert(t(TranslationKeys.warning), error.toString())
                            }
                        }} title={t(TranslationKeys.got_it)} />
                </Modal>
            </SafeAreaView> :
            <CustomDeliveryBooking
                pricingModal={pricingModal}
                renderItem={(props: any) => <RenderCarItem {...props} selectedItem={selectedTempCarType} onPress={selectCarType} t={t} />}
                disabled={rideQuotationError}
                onPress={() => {
                    setSelectedCarType(selectedTempCarType)
                    if (selectedTempCarType) {
                        setSelectedCarImageError(false)
                        if (isDeliveryModule) {
                            // createRideApi()
                            dispatch(setDeliveryDetails({ ...deliveryDetails, selectedCar: selectedTempCarType }));
                            navigation.navigate('DeliveyReviewScreen')
                        }
                    } else {
                        AppAlert('RYD Now', t(TranslationKeys.please_choose_a_vehicle))
                    }
                }} />
        }
        </>
    );
};

export default BookingScreen;

const RenderCarItem = ({ item, index, selectedItem, onPress, t }: { item: QuotationListTypes, index: number, selectedItem?: QuotationListTypes, onPress: (index: number) => void, t: any }) => {

    const Styles = useStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { rideQuotationList } = useAppSelector(state => state.HomeSlice);
    const [carTypeImageError, setCarTypeImageError] = useState<boolean>(false);

    return (
        <TouchableOpacity onPress={() => {
            onPress(index)
        }} style={[Styles.carContainerStyle, {
            backgroundColor: selectedItem?.id == item.id ? colors.PRIMARY_BACKGROUND : colors.SECONDARY_BACKGROUND,
            borderColor: selectedItem?.id == item.id ? colors.SECONDARY : colors.SECONDARY_BACKGROUND,
        }, selectedItem?.id == item.id ? { transform: [{ scaleY: 1.09 }] } : undefined]}>
            {
                selectedItem?.id == item.id ?
                    <Image source={Icons.RIGHT_ARROW_ROUND_ICON} style={Styles.roundArrowIconStyle} />
                    : null
            }

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1, alignItems: 'center', width: '100%', marginVertical: wp(1) }}>
                <FastImage
                    onError={() => {
                        setCarTypeImageError(true)
                    }}
                    resizeMode={item.carTypeImage && !carTypeImageError ? 'contain' : 'cover'}
                    source={(item.carTypeImage && !carTypeImageError) ? { uri: item.carTypeImage } : ImagesPaths.EMPTY_IMAGE}
                    style={[item.carTypeImage && !carTypeImageError ? Styles.carImageStyle : Styles.carTypeEmptyImageStyle, {}]}
                />
                <View style={{
                    alignItems: 'center'
                }}>
                    <Text numberOfLines={1} style={Styles.carTypeTxtStyle}>{item.carType}</Text>
                    <Text style={Styles.timeTxtStyle}>{minuteToHoursTransform(rideQuotationList?.data?.duration ?? 0, t).totalTime}&nbsp;{minuteToHoursTransform(rideQuotationList?.data?.duration ?? 0, t).timeInMinOrHr}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    <Text numberOfLines={1} style={[Styles.currencyStyle, { bottom: wp(0.5), marginRight: wp(1) }]}>{setPrice(t, item.fare, true, false)}</Text>
                    <Text numberOfLines={1} style={Styles.rupeeSymbolTxtStyle}>{setPrice(t, item.fare, false, false, true)}</Text>
                </View>
            </View>
            {((item?.cgst == 0 && item.sgst == 0) && item?.igst == 0) ? null : <View style={Styles.carItemSepratorStyle} />}
            {(item?.cgst == 0 && item.sgst == 0) ?
                item?.igst == 0 ? null :
                    <Text style={[Styles.seactCapacityTxtStyle, { textAlign: 'center', marginTop: wp(1) }]}>{t(TranslationKeys.includes)}&nbsp;{"IGST"}&nbsp;{setPrice(t, item?.igst)} </Text>
                :
                <Text style={[Styles.seactCapacityTxtStyle, { textAlign: 'center', marginTop: wp(1) }]}>{t(TranslationKeys.includes)}&nbsp;{"CGST"}&nbsp;{setPrice(t, (item?.cgst))}&nbsp;{"SGST"}&nbsp;{setPrice(t, (item?.sgst))} </Text>
            }
        </TouchableOpacity>
    );
};

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const GlobalStyles = useGlobalStyles();
    const { locale } = useLanguage()

    return (
        StyleSheet.create({
            commonBackShadow: {
                shadowColor: colors.SHADOW_1,
                shadowOpacity: Platform.OS == "ios" ? 0.3 : 1,
                shadowRadius: 10,
                shadowOffset: { height: 0, width: 0 },
                elevation: 15,
            },
            headerContainerStyle: {
                position: 'absolute',
                top: 0,
                zIndex: 2,
                width: '100%'
            },
            itemSepratorLine: {
                backgroundColor: colors.SEPARATOR_LINE,
                height: wp(0.4),
                width: "84%",
                alignSelf: 'center',
                marginLeft: wp(7),
                borderRadius: wp(2)
            },
            destiantionListContainerStyle: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                borderRadius: wp(5),
                marginBottom: wp(2),
                marginHorizontal: wp(5)
            },
            contactContainerStyle: {
                marginBottom: wp(5)
            },
            carsListConatinerStyle: {
                backgroundColor: colors.TRANSPARENT,
                maxHeight: wp(50),
                marginBottom: wp(2)
            },
            carsItemSepratorStyle: {
                flex: 1,
            },
            carContainerStyle: {
                paddingHorizontal: wp(2),
                paddingBottom: wp(1),
                marginTop: Platform.OS == "ios" ? wp(3) : wp(3.5),
                marginBottom: wp(1.5),
                marginRight: wp(2),
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: wp(0.5),
                borderRadius: wp(3),
                minWidth: wp(42),
                flex: 1,
            },
            roundArrowIconStyle: {
                width: wp(5),
                height: wp(5),
                tintColor: colors.SECONDARY,
                position: 'absolute',
                borderRadius: wp(7),
                top: wp(-2),
                right: wp(-2),
                zIndex: 5,
                backgroundColor: colors.WHITE_ICON
            },
            carImageStyle: {
                width: wp(15),
                height: wp(9),
                resizeMode: 'contain',
            },
            timeTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_10,
                color: colors.PRIMARY,
                textDecorationColor: colors.PRIMARY,
                textAlign: 'left'
            },
            carItemSepratorStyle: {
                width: '100%',
                height: wp(0.5),
                backgroundColor: colors.SEPARATOR_LINE,
            },
            carDetailViewStyle: {
                flex: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginVertical: wp(1),
                alignItems: 'center',
            },
            carTypeTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
            },
            currencyStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_11,
                color: colors.PRIMARY_TEXT,
            },
            rupeeSymbolTxtStyle: {
                fontFamily: Fonts.FONT_POP_BOLD,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                textAlign: 'right'
            },
            perKmTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_8,
                color: colors.SECONDARY_TEXT,
                letterSpacing: 0.5
            },
            seactCapacityTxtStyle: {
                alignSelf: 'flex-start',
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_8,
                color: colors.SECONDARY_TEXT,
                letterSpacing: 0.5,
            },
            selectedCarContainerStyle: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                justifyContent: 'space-between',
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: wp(5),
                paddingHorizontal: wp(3),
                paddingVertical: wp(1),
                marginVertical: wp(2),
                borderRadius: wp(3)
            },
            contactItemSepratorLine: {
                backgroundColor: colors.SEPARATOR_LINE,
                height: wp(0.4),
                width: "84%",
                alignSelf: 'center',
                marginLeft: wp(7),
                borderRadius: wp(2)
            },
            labelContainerStyle: {
                width: wp(5),
                height: wp(5),
                backgroundColor: colors.PRIMARY,
                borderRadius: wp(5),
                alignItems: 'center',
                justifyContent: 'center'
            },
            labelTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_10,
                color: colors.BUTTON_TEXT,
            },
            datePickerContainerStyle: {
                flex: 1,

                justifyContent: 'flex-start',
                alignItems: 'center'
            },
            datePickerStyle: {
                alignSelf: 'center',
            },
            bottomSheetContainerStyle: {
                backgroundColor: colors.TRANSPARENT,
                paddingHorizontal: 0,
                paddingVertical: 0,
                paddingTop: wp(2)
            },
            bottomSheetScrollView: {
                backgroundColor: colors.TRANSPARENT,
                // marginBottom: wp(23)
            },
            commonPaddingContainer: {
                paddingVertical: wp(3.5),
                marginHorizontal: wp(5)
            },
            contactPickerContainer: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                alignItems: 'center',
                flexDirection: 'row',
                borderRadius: wp(3),
                justifyContent: "space-between",
                marginVertical: wp(1.5),
                marginBottom: wp(5),
                padding: wp(3)
            },
            userIconStyle: {
                height: wp(5.5),
                width: wp(5.5),
                tintColor: colors.SECONDARY,
                resizeMode: 'contain'
            },
            contactNameTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                maxWidth: wp(40),
                marginLeft: wp(2),
            },
            dotViewStyle: {
                height: wp(2),
                width: wp(2),
                backgroundColor: colors.PRIMARY_ICON,
                borderRadius: wp(5),
                marginHorizontal: wp(2)
            },
            mobileNumberTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                maxWidth: wp(35)
            },
            rightArrowIconStyle: {
                height: wp(4),
                width: wp(4),
                tintColor: colors.SECONDARY_ICON,
                resizeMode: 'contain',
                transform: [{ rotate: locale ? '180deg' : '0deg' }]
            },
            contactBottomSheetContainerStyle: {
                flex: 1,
                padding: wp(5),
            },
            someOneElseTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_17,
                color: colors.PRIMARY_TEXT,
                marginBottom: wp(2),
                textAlign: 'left',
                marginHorizontal: wp(2)
            },
            chooseContactStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_13,
                color: colors.SECONDARY_TEXT,
                marginBottom: wp(3),
                textAlign: 'left',
                marginHorizontal: wp(1)
            },
            contactIconStyle: {
                width: wp(4.5),
                height: wp(4.5),
                resizeMode: 'contain',
                tintColor: colors.SECONDARY
            },
            contactRadioIconStyle: {
                tintColor: colors.TRANSPARENT
            },
            contactTitleStyle: {
                maxWidth: wp(70),
            },
            transparentContainer: {
                backgroundColor: colors.TRANSPARENT
            },
            carlistContentContainerStyle: {
                paddingLeft: wp(5),
                paddingRight: wp(3)
            },
            commonDatePickerBottomBtn: {
                flex: 1,
                elevation: 0,
                shadowRadius: 0,
                shadowOpacity: 0,
                paddingHorizontal: wp(5),
            },
            datePicketCancelBtn: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                borderWidth: wp(0.5),
                borderColor: colors.PRIMARY
            },
            datePickerMainContainerStyle: {
                flexDirection: "row",
                justifyContent: 'space-evenly',
                elevation: 15,
                shadowRadius: 10,
                shadowOpacity: 0.2,
                shadowColor: colors.SHADOW_2,
                shadowOffset: { height: 0, width: 0 },
            },
            carTypeEmptyImageStyle: {
                width: wp(15),
                height: wp(7.5),
                borderRadius: wp(1),
            },
            stopesMarkerStyle: {
                width: wp(10),
                height: wp(10),
                resizeMode: 'contain',
                tintColor: colors.BOX_DARK_BORDER
            },
            bookingSuccessIcon: {
                width: wp(20),
                height: wp(20),
                resizeMode: 'contain',
                borderRadius: wp(10),
            },
            headingText: {
                fontSize: FontSizes.FONT_SIZE_18,
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                color: colors.PRIMARY_TEXT,
                textAlign: 'center',
                paddingTop: wp(5),
            },
            subtitleText: {
                textAlign: 'center',
                color: colors.SECONDARY_TEXT,
                marginHorizontal: wp(5),
                marginVertical: wp(2),
            },
            toggleBtnText: {
                textAlign: 'left',
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_13,
                color: colors.SECONDARY_TEXT,
                marginHorizontal: wp(2)
            },
            toggleContainerStyle: {
                alignItems: 'center',
                flexDirection: 'row',
                borderRadius: wp(10),
                paddingVertical: wp(0.5),
                paddingHorizontal: wp(0.5),
            },
            toggleTextStyle: {
                marginHorizontal: wp(1),
                color: colors.PRIMARY,
                fontSize: FontSizes.FONT_SIZE_11,
                fontFamily: Fonts.FONT_POP_REGULAR,
                textTransform: 'uppercase',
                paddingHorizontal: wp(0)
            },
            toggleStyle: {
                height: wp(5),
                width: wp(5),
                backgroundColor: colors.GREEN_PAYMENT,
                borderRadius: wp(6),
                borderWidth: wp(0.5),
                borderColor: colors.TRANSPARENT
            },
            discountCouponContainer: {
                padding: wp(4),
                backgroundColor: colors.SECONDARY_BACKGROUND,
                marginHorizontal: wp(5),
                marginTop: wp(2),
                borderRadius: wp(4),
            },
            discountCouponsText: {
                fontSize: FontSizes.FONT_SIZE_14,
                fontFamily: Fonts.FONT_POP_REGULAR,
                color: colors.PRIMARY_TEXT,
            },
            discountRowContainer: {
                justifyContent: 'space-between',
                alignItems: 'center'
            },
            discountTitleText: {
                fontSize: FontSizes.FONT_SIZE_17,
                fontFamily: Fonts.FONT_POP_MEDIUM,
                color: colors.PRIMARY_TEXT,
            },
            discountNotFoundText: {
                fontSize: FontSizes.FONT_SIZE_20,
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                color: colors.PRIMARY_TEXT
            },
            applyDiscountCouponApplyContainer: {
                position: 'absolute',
                top: "0%",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 999999999999999,
                backgroundColor: "rgba(0, 0, 0, 0.2)",
            },
            applyCouponAnimation: {
                width: wp(65),
                height: wp(65),
                top: wp(22),
                left: wp(9.5)
            },
            couponNotFoundAnimation: {
                width: wp(10),
                height: wp(40),

            },
            leftPricingModalListScrollBtn: {
                position: 'absolute',
                left: wp(1),
                backgroundColor: colors.PRIMARY_BACKGROUND,
                padding: "1%",
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: wp(10),
                borderWidth: wp(0.2),
                borderColor: colors.BOX_PRIMARY_BACKGROUND
            }
        })
    );
};
