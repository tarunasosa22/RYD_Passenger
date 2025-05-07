import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState, useTransition } from 'react'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useTranslation } from 'react-i18next';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import CustomHeader from '../../components/CustomHeader';
import { TranslationKeys } from '../../localization/TranslationKeys';
import CustomContainer from '../../components/CustomContainer';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import { useLanguage } from '../../context/LanguageContext';
import { setPrice } from '../../utils/HelperFunctions';
import { PICK_UP_MODE, RIDE_STATUS } from '../../utils/Constats';
import { createDeliveryRide, setAppliedCoupon, setCreateDeliveryRideData, setIsComplateTimer, setLastActibeStep, setPaymentMethod } from '../../redux/slice/homeSlice/HomeSlice';
import CommonStepersContainer from '../../components/CommonStepersContainer';
import RazorpayCheckout from 'react-native-razorpay';
import { cancelRide, deleteRideBooking, makeRidePayment, riderActiveRide } from '../../redux/slice/rideSlice/RideSlice';
import { RAZORPAY_KEY_ID } from '../../config/Host';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { Alert } from 'react-native';
import { AppAlert } from '../../utils/AppAlerts';
import { paymentBeforeAfter } from '../../redux/slice/paymentSlice/PaymentSlice';
import moment from 'moment';
import { useIsFocused } from '@react-navigation/native';


const DeliveyReviewScreen = () => {
    const { t } = useTranslation()
    const GlobalStyles = useGlobalStyles();
    const Styles = useStyles();
    const focus = useIsFocused();
    const dispatch = useAppDispatch();
    const navigation = useCustomNavigation('DeliveyReviewScreen');
    const [disabled, setDisabled] = useState(false)
    const { colors } = useAppSelector(state => state.CommonSlice)
    const { deliveryDetails } = useAppSelector(state => state.RideSlice)
    const { userDetail, tokenDetail } = useAppSelector(state => state.AuthSlice)
    const { bookingDestinations, paymentMethod, rideQuotationList, isLoading, lastActiveTime, createRideData, createDeliveryRideData, isComplateTimer, } = useAppSelector(state => state.HomeSlice)

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

    useEffect(() => {
        if (focus) {
            riderActiveRideDetailApiCall()
        }
    }, [focus])

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
                        if (timeSpent < 185 || (isComplateTimer && (createDeliveryRideData?.id == res.id))) {
                            navigation.navigate('SearchingRiderScreen', {
                                id: createDeliveryRideData?.id,
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
            rider_name: 'self',
            phone: 'self'
        };
        params.rider_info = JSON.stringify(userInfo);

        // Pickup mode and time
        params.pickup_mode = PICK_UP_MODE.NOW;


        // Payment method
        if (paymentMethod) {
            params.payment_method = paymentMethod.toUpperCase();
        }

        // // Discount code
        // if (disocuntCode) {
        //     params.discount_code = disocuntCode;
        // }

        // // Secure mode
        // if (isEnablesecureMode === "on") {
        //     params.is_secured = true;
        // }

        // Selected pricing model car
        params.price_model = deliveryDetails?.selectedCar.id;

        // // Stops (waypoints)
        // if (waypoints.length !== 0) {
        //     params.stops_lat_long = JSON.stringify(waypoints);
        // }

        // Estimated time and distance
        if (rideQuotationList?.data?.duration !== null) {
            params.estimatedTime = rideQuotationList?.data?.duration;
        }
        params.distance = rideQuotationList?.data?.distance;
        params.points = rideQuotationList?.data?.points;

        // Pickup and destination addresses
        params.pickup = rideQuotationList?.data?.address?.pickup;
        params.destination = rideQuotationList?.data?.address?.destination;
        params.pickupState = rideQuotationList?.data?.pickupState;
        params.cgst = rideQuotationList?.data?.cgst;
        params.sgst = rideQuotationList?.data?.sgst
        params.destinationState = rideQuotationList?.data?.destinationState
        params.toll = rideQuotationList?.data?.toll
        // Stops in ride quotation
        // if (rideQuotationList.data.address.stops.length !== 0) {
        //     params.stops = JSON.stringify(rideQuotationList.data.address.stops);
        // }
        params.senderFullName = deliveryDetails?.senderFullName;
        params.senderPhoneNumber = deliveryDetails?.senderPhoneNumber;
        params.senderPickupAddress = deliveryDetails?.senderPickupAddress;
        params.receiverFullName = deliveryDetails?.receiverFullName;
        params.receiverPhoneNumber = deliveryDetails?.receiverPhoneNumber;
        params.receiverDeliveryAddress = deliveryDetails?.receiverDeliveryAddress;
        params.goodsType = deliveryDetails?.goodsType;
        params.goodsPackage = deliveryDetails?.goodsPackage;
        params.goodsWeight = deliveryDetails?.goodsWeight;

        const paramss = {
            paymentType: "razorpay"
        }
        dispatch(paymentBeforeAfter(paramss)).unwrap().then((BeforeRidRes) => {
            setDisabled(true)
            dispatch(createDeliveryRide(params)).unwrap().then((res: any) => {
                dispatch(setLastActibeStep(0))
                dispatch(setIsComplateTimer(false))
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
                                    netbanking: true, // Enable net banking
                                    card: true, // Enable card payments
                                    upi: true,
                                    wallet: true, // Disable wallets
                                    paylater: false
                                }
                            }
                            RazorpayCheckout.open(options as any).then((data: { razorpay_payment_id: any; }) => {
                                console.log("🚀  file: SelectPaymentModeScreen.tsx:163  RazorpayCheckout.open ~ data:", data)
                                // handle success
                                // Alert.alert(`Success: ${data.razorpay_payment_id}`);
                                setDisabled(false)
                                navigation.navigate("SearchingRiderScreen", { id: res?.id, from: "DeliveyReviewScreen", isDeliveryModule: true })

                            }).catch((error: { code: any; description: any; }) => {
                                setDisabled(false)
                                if (error.code == 0) {
                                    AppAlert(t(TranslationKeys.Message), 'Cancelled by user')
                                } else {
                                    Alert.alert(`${t(TranslationKeys.error)} ${error.code} \n ${error.description}`);
                                }

                                dispatch(deleteRideBooking(res?.id)).unwrap().then(res => {
                                    dispatch(setCreateDeliveryRideData(null))
                                }).catch(e => console.log({ e }))
                                // handle failure
                            });
                        }).catch((e: any) => {
                            setDisabled(false)
                            console.log({ e })
                            dispatch(deleteRideBooking(res?.id)).unwrap().then(res => {
                                dispatch(setCreateDeliveryRideData(null))
                            }).catch(e => console.log({ e }))
                        })
                } else {
                    setDisabled(false)
                    navigation.navigate("SearchingRiderScreen", { id: res?.id, from: "DeliveyReviewScreen", isDeliveryModule: true })
                }
            })
        })

    };

    return (
        <View style={GlobalStyles.container}>
            {isLoading ? <CustomActivityIndicator /> : null}
            <CommonStepersContainer step={4} />
            <CustomHeader
                edges={['left']}
                title={t(TranslationKeys.review_booking)} onPress={() => {
                    if (navigation?.getId() == "DrawerStack") {
                        navigation.openDrawer()
                    } else {
                        navigation.goBack()
                    }
                }}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
                <CustomContainer>
                    <View style={Styles.mainContainerStyle}>
                        <Text style={{
                            color: colors.PRIMARY_TEXT,
                            fontSize: FontSizes.FONT_SIZE_15,
                            fontFamily: Fonts.FONT_POP_MEDIUM,
                            textAlign: 'left'
                        }}>{t(TranslationKeys.booking_details)}</Text>
                        <View style={Styles.detailContainer}>
                            <Text style={Styles.titleTxt}>{t(TranslationKeys.vehicle_type)}</Text>
                            <Text style={Styles.detailTxt1}>{deliveryDetails?.selectedCar?.carType}</Text>
                        </View>
                        <View style={Styles.itemSeprator} />
                        <View style={Styles.detailContainer}>
                            <Text style={Styles.titleTxt}>{t(TranslationKeys.sender_details)}</Text>
                            <Text style={Styles.detailTxt1}>{deliveryDetails?.senderFullName}</Text>
                            <Text style={Styles.detailTxt2}>{deliveryDetails?.senderPhoneNumber}</Text>
                            <Text style={Styles.detailTxt3}>{deliveryDetails?.senderPickupAddress}</Text>
                        </View>
                        <View style={[Styles.detailContainer, { marginTop: wp(1) }]}>
                            <Text style={Styles.titleTxt}>{t(TranslationKeys.receiver_details)}</Text>
                            <Text style={Styles.detailTxt1}>{deliveryDetails?.receiverFullName}</Text>
                            <Text style={Styles.detailTxt2}>{deliveryDetails?.receiverPhoneNumber}</Text>
                            <Text style={Styles.detailTxt3}>{deliveryDetails?.receiverDeliveryAddress}</Text>
                        </View>
                        <View style={Styles.itemSeprator} />
                        <View style={Styles.detailContainer}>
                            <Text style={Styles.titleTxt}>{t(TranslationKeys.pickup)}</Text>
                            <Text style={Styles.detailTxt4}>{deliveryDetails?.senderPickupAddress}</Text>
                        </View>
                        <View style={Styles.detailContainer}>
                            <Text style={Styles.titleTxt}>{t(TranslationKeys.drop_off)}</Text>
                            <Text style={Styles.detailTxt4}>{deliveryDetails?.receiverDeliveryAddress}</Text>
                        </View>
                        <View style={[Styles.detailContainer, { marginTop: wp(1) }]}>
                            <Text style={Styles.titleTxt}>{t(TranslationKeys.package_details)}</Text>
                            <Text style={Styles.detailTxt1}>{deliveryDetails?.goodsType}</Text>
                            <Text style={Styles.detailTxt2}>{deliveryDetails?.goodsPackage}</Text>
                            <Text style={Styles.detailTxt3}>{deliveryDetails?.goodsWeight}{t(TranslationKeys.kg)}</Text>
                        </View>
                        <View style={Styles.itemSeprator} />
                        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                            <Text style={Styles.baseFare}>{t(TranslationKeys.base_fare)}</Text>
                            <Text style={Styles.baseFare}>{setPrice(t, deliveryDetails?.selectedCar?.baseFare, false, false)}</Text>
                        </View>
                        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                            <Text style={Styles.totalAmount}>{t(TranslationKeys.total_amount)}</Text>
                            <Text style={Styles.totalAmount}>{setPrice(t, deliveryDetails?.selectedCar?.fare, false, false)}</Text>
                        </View>
                    </View>

                    <Text style={[Styles.detailTxt3, { fontSize: FontSizes.FONT_SIZE_14 }]}>{t(TranslationKeys.important_information)}</Text>
                    {store.getState().RideSlice.goodsInfo?.notes && (
                        <View style={[GlobalStyles.rowContainer, { marginVertical: wp(2) }]}>
                            <View style={Styles.currentLocationDotView} />
                            <Text style={[Styles.detailTxt3, { width: '88%' }]}>{store.getState().RideSlice.goodsInfo?.notes}</Text>
                        </View>
                    )}
                </CustomContainer>
            </ScrollView>
            <CustomBottomBtn
                disabled={disabled}
                title={t(TranslationKeys.confirm_booking)}
                onPress={() => {
                    createRideApi()
                }} />
        </View>
    )
}

export default DeliveyReviewScreen

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)
    const { locale } = useLanguage()

    return StyleSheet.create({
        mainContainerStyle: {
            paddingHorizontal: wp(4),
            paddingVertical: wp(3),
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3),
            marginVertical: wp(3)
        },
        titleTxt: {
            color: colors.SECONDARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_13,
            fontFamily: Fonts.FONT_POP_REGULAR,
            textAlign: 'left',
            marginVertical: wp(1)
        },
        detailTxt1: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_14,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            textAlign: 'left',
            marginVertical: wp(0.2)
        },
        detailTxt2: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_13,
            fontFamily: Fonts.FONT_POP_REGULAR,
            textAlign: 'left',
            marginVertical: wp(0.2)
        },
        detailTxt3: {
            color: colors.SECONDARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_REGULAR,
            textAlign: 'left',
            marginVertical: wp(0.2)
        },
        detailTxt4: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_13,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            textAlign: 'left',
            marginVertical: wp(0.2)
        },
        detailContainer: {
            paddingVertical: wp(2)
        },
        itemSeprator: {
            height: wp(0.4),
            backgroundColor: colors.SHEET_INDICATOR,
            marginVertical: wp(2)
        },
        baseFare: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_13,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            textAlign: 'left',
            marginVertical: wp(1)
        },
        totalAmount: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_14,
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
            textAlign: 'left',
            marginVertical: wp(1.5)
        },
        currentLocationDotView: {
            height: wp(1.5),
            width: wp(1.5),
            backgroundColor: 'transparent',
            borderRadius: wp(3),
            marginRight: wp(2),
            top: wp(0.5),
            alignSelf: 'flex-start',
            marginTop: wp(1.5)
        },

    })
};