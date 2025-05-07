import React, { Dispatch, SetStateAction, memo, useEffect, useState } from 'react';
import { Platform, StyleSheet, ScrollView, Text, TouchableOpacity, View, LayoutAnimation, Image } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppDispatch, useAppSelector } from '../redux/Store';
import CommonRideUserDetailView from './CommonRideUserDetailView';
import CommonRideIconTextView from './CommonRideIconTextView';
import { Icons } from '../utils/IconsPaths';
import { AppStrings } from '../utils/AppStrings';
import CustomMapContainer from './CustomMapContainer';
import CustomUserMarkerView from './CustomUserMarkerView';
import CustomPrimaryButton from './CustomPrimaryButton';
import CustomIconButton from './CustomIconButton';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Fonts } from '../styles/Fonts';
import { FontSizes } from '../styles/FontSizes';
import CommonDraggableItem from './CommonDraggableItem';
import CommonDraggableDashView from './CommonDraggableDashView';
import CommonRideTwoTextView from './CommonRideTwoTextView';
import useCustomNavigation from '../hooks/useCustomNavigation';
import { RideBookingListDetailsTypes, RideLocationTypes, setRideDetailsData, setnavigationDirection } from '../redux/slice/rideSlice/RideSlice';
import moment from 'moment';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAP_API } from '../config/Host';
import { RIDE_STATUS, RIDE_TYPE } from '../utils/Constats';
import { contactToDriver, decode, setPrice } from '../utils/HelperFunctions';
import { AppAlert } from '../utils/AppAlerts';
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../localization/TranslationKeys';
import { Polyline } from 'react-native-maps';
import { useLanguage } from '../context/LanguageContext';
import 'moment/locale/ar'; // Import Arabic locale
import 'moment/locale/hi'; // Import Arabic locale
import 'moment/locale/en-gb'; // Import English locale (or your preferred locale)


interface CommonRideDetailsContainerProps {
    data: RideBookingListDetailsTypes,
    type?: string,
    flatlistref?: any,
    index?: undefined | number,
    expandMore: number | null,
    setExpandMore: Dispatch<SetStateAction<number | null>>
    onCancelPress?: () => void
};

const CommonRideDetailsContainer = (props: CommonRideDetailsContainerProps) => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const { routeTrackList } = useAppSelector((state) => state.HomeSlice);
    const navigation = useCustomNavigation('DrawerStack');
    const [location, setLocation] = useState<RideLocationTypes[] | []>([]);
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const { locale, langCode } = useLanguage()

    useEffect(() => {
        getFormattedDate()
        let locationData: RideLocationTypes[] = []
        if (props?.data?.rideLocation?.stop) {
            locationData = [props?.data?.rideLocation?.pickup, ...props?.data?.rideLocation?.stop, props?.data?.rideLocation?.destination]
        } else {
            locationData = [props?.data?.rideLocation?.pickup, props?.data?.rideLocation?.destination]
        }
        setLocation(locationData)
    }, [props?.data?.rideLocation])

    const dropDown = () => {
        if (props.expandMore === props?.data?.id) {
            props.setExpandMore(0)
        } else {
            props?.setExpandMore(props?.data?.id)
        }
        props?.flatlistref?.current.scrollToIndex({ animated: true, index: props.index, viewPosition: 0.5, viewOffset: wp(5), })
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    const getFormattedDate = () => {
        moment.locale(langCode);
    }

    const renderItem = ({ item, index }: { item: RideLocationTypes, index: number }) => {
        return (
            <View>
                <CommonDraggableItem
                    disabled={true}
                    icon={index == 0 ? Icons.ROUND_LOCATION_ICON : Icons.LOCATION_MARKER_ICON}
                    iconStyle={{
                        tintColor: index == 0 ? colors.SECONDARY_ICON : colors.PRIMARY_ICON
                    }}
                    item={item}
                />
                {index == location?.length - 1 ?
                    null :
                    <CommonDraggableDashView
                        dashGap={3}
                        dashLength={6}
                        dashThickness={2.5}
                    />
                }
                {index == location?.length - 1 ?
                    null :
                    <View style={Styles.listItemSepratorStyle} />
                }
            </View>
        );
    };

    const coordinates = decode([{
        polyline: { "points": props?.data?.points }
    }])

    const isDispute = (props.data?.rideStatus == RIDE_STATUS.ONGOING || props.data?.rideStatus == RIDE_STATUS.DRIVER_ENDED)

    return (
        <View style={[Styles.mainContainerStyle, Styles.mainContainerShadowStyle]}>
            {/* {(props.type == RIDE_TYPE.PREBOOKED && (props.data?.rideStatus == RIDE_STATUS.CREATED || props.data?.rideStatus == RIDE_STATUS.PAYMENT_HOLD)) &&
                <View style={{ flex: 1, justifyContent: 'space-between', flexDirection: 'row' }}>
                    {((moment(props?.data?.preBookedTime).isBefore(moment())) && props.data?.rideStatus == RIDE_STATUS.PAYMENT_HOLD) ?
                        <Text style={Styles.paymentRefundText} numberOfLines={2}>{t(TranslationKeys.get_back_ride_payment)}</Text> : <View></View>}
                </View>
            } */}
            <TouchableOpacity onPress={dropDown} activeOpacity={1} >
                <CommonRideUserDetailView
                    userData={{
                        driver: props.data?.driver,
                        driverCar: props.data?.driverCar,
                        priceModel: props.data?.priceModel,
                        rideCancelBy: props?.data?.rideCancelBy,
                        deliveryDetails: props?.data?.deliveryDetails,
                        deleteUser: props?.data?.deletedUser,
                        pickUpMode: props?.data?.pickupMode
                    }}
                    isHomeScreen={(props.data?.rideStatus == RIDE_STATUS.ONGOING || props.data?.rideStatus == RIDE_STATUS.DRIVER_ALLOCATED || props.data?.rideStatus == RIDE_STATUS.DRIVER_ENDED) ? true : false}
                    isPreBook={(props.type == RIDE_TYPE.PREBOOKED && props.data?.rideStatus !== RIDE_STATUS.COMPLETED && props.data?.rideStatus !== RIDE_STATUS.CANCELLED)}
                // cancelBy={props.data.cancelBy}
                />
                {props?.data?.deliveryDetails && (
                    <View style={[GlobalStyle.rowContainer, { marginTop: wp(1) }]}>
                        <Image source={Icons.GOODS_LOADING} style={{ width: wp(7), height: wp(7), resizeMode: 'contain', marginRight: wp(2) }} />
                        <Text style={Styles.requestTxtStyle}>{props?.data?.deliveryDetails?.goodsType}</Text>
                    </View>
                )}
                {(props.data?.rideStatus == RIDE_STATUS.COMPLETED || props.data?.rideStatus == RIDE_STATUS.CANCELLED || !props.data?.rideBookingOtp) ? null : <Text style={Styles.userNameTxtStyle}>{t(TranslationKeys.otp)} {props.data?.rideBookingOtp}</Text>}
                <View style={Styles.commonItemSeprator} />
                <View style={[GlobalStyle.rowContainer, Styles.spaceBetweenView]}>
                    <CommonRideIconTextView icon={Icons.LOCATION_MARKER_BORDER} title={`${props.data?.distance} ${props.data?.distance > 1 ? t(TranslationKeys.km) : t(TranslationKeys.km)}`} adjustsFontSizeToFit />
                    <CommonRideIconTextView icon={Icons.CLOCK_BORDER} title={props.data?.estimatedTime + t(TranslationKeys.min)} adjustsFontSizeToFit />
                    <CommonRideIconTextView icon={Icons.WALLET} title={setPrice(t, props.data?.ridePayment?.totalFare, false, false)} adjustsFontSizeToFit />
                </View>
                <CommonRideTwoTextView
                    containerStyle={{
                        marginTop: wp(3.5)
                    }} title={t(TranslationKeys.date_and_time)}
                    subTitle={props?.data?.preBookedTime ? moment(props?.data?.preBookedTime).format('DD MMM YYYY | LT') : moment(props?.data?.createdAt).format('DD MMM YYYY | LT')} />
            </TouchableOpacity>
            {
                props?.expandMore === props?.data?.id ?
                    <>
                        <TouchableOpacity onPress={dropDown} activeOpacity={1}>
                            <View style={Styles.commonItemSeprator} />
                            {/* <ScrollView
                                nestedScrollEnabled showsVerticalScrollIndicator={false} style={Styles.locationContainerStyle}> */}
                            {
                                location?.map((item, index) => {
                                    return renderItem({ item, index })
                                })
                            }
                            {/* </ScrollView> */}
                            {
                                props?.data?.driverCar?.registrationNumber &&
                                <>
                                    <CommonRideTwoTextView
                                        containerStyle={{
                                            marginTop: wp(3)
                                        }} title={t(TranslationKeys.vehicle_number)}
                                        subTitle={props.data?.driverCar?.registrationNumber.toString()} />
                                    <View style={Styles.commonItemSeprator} />
                                </>
                            }
                        </TouchableOpacity>
                        {props.type === RIDE_TYPE.YOURRIDES && (props.data?.rideStatus === RIDE_STATUS.DRIVER_ALLOCATED || props.data?.rideStatus === RIDE_STATUS.ONGOING || props.data?.rideStatus === RIDE_STATUS.DRIVER_ENDED || props.data?.rideStatus === RIDE_STATUS.CREATED) ?
                            <View>
                                <View style={[Styles.mainMapContainerStyle, { height: hp(16) }]}>
                                    <CustomMapContainer
                                        showsCompass={false}
                                        isLoaderShow={true}
                                        region={{
                                            latitude: props?.data?.rideLocation?.pickup?.latitude,
                                            longitude: props?.data?.rideLocation?.pickup?.longitude,
                                            latitudeDelta: 0.015,
                                            longitudeDelta: 0.0121,
                                        }}
                                        minZoomLevel={15}
                                        style={Styles.mapContainerStyle}>
                                        <CustomUserMarkerView
                                            iconStyle={{ tintColor: colors.GREEN_ICON }}
                                            coordinate={{
                                                latitude: props?.data?.rideLocation?.pickup?.latitude,
                                                longitude: props?.data?.rideLocation?.pickup?.longitude,
                                            }}
                                        />
                                        <CustomUserMarkerView
                                            iconImage={Icons.DESTINATION_LOCATION_ICON}
                                            iconStyle={{
                                                tintColor: undefined,
                                                width: wp(15),
                                                height: wp(15),
                                                resizeMode: 'contain'
                                            }}
                                            coordinate={{
                                                latitude: props?.data?.rideLocation?.destination?.latitude,
                                                longitude: props?.data?.rideLocation?.destination?.longitude,
                                            }}
                                        />
                                        {(routeTrackList || coordinates) && <Polyline
                                            coordinates={routeTrackList ?? coordinates}
                                            strokeWidth={3}
                                        />}
                                        {/* {globalView} */}
                                        {/* <MapViewDirections
                                            apikey={GOOGLE_MAP_API}
                                            origin={props?.data?.rideLocation?.pickup}
                                            destination={props?.data?.rideLocation?.destination}
                                            splitWaypoints
                                            mode='DRIVING'
                                            strokeWidth={3}
                                            strokeColor={colors.PRIMARY_TEXT}
                                            optimizeWaypoints={true}
                                            onReady={() => {
                                                let params = {
                                                    api_name: "Google Directions API",
                                                    ride_booking_id: props.data.id
                                                }
                                                dispatch(setApiCounter(params))
                                            }}
                                        /> */}
                                    </CustomMapContainer>
                                </View>
                                <CustomPrimaryButton
                                    onPress={() => {
                                        if (props?.data?.rideStatus === RIDE_STATUS.CREATED) {
                                            navigation.navigate("SearchingRiderScreen", {
                                                id: props?.data?.id
                                            })
                                        } else {
                                            props?.data?.id && navigation.navigate('TrackDriverScreen', { rideId: props?.data?.id })
                                        }
                                    }} title={props?.data?.rideStatus === RIDE_STATUS.CREATED ? AppStrings.find_driver : t(TranslationKeys.track_driver)} style={[GlobalStyle.primaryBtnStyle]} />
                                <TouchableOpacity
                                    // disabled={props.data?.rideStatus !== RIDE_STATUS.DRIVER_ALLOCATED}
                                    onPress={() => {
                                        props?.data?.id && navigation.navigate('CancelTaxiScreen', { id: props?.data?.id, isDispute: isDispute })
                                    }} style={Styles.cancleRideBtnStyle}>
                                    <Text style={[Styles.cancleRideTxtStyle, { color: colors.PRIMARY }]}>{isDispute ? t(TranslationKeys.submit_for_dispute) : props?.data?.deliveryDetails ? t(TranslationKeys.cancel_delivery) : t(TranslationKeys.cancel_ride)}</Text>
                                </TouchableOpacity>
                            </View>
                            :
                            null
                        }
                        {props.type === RIDE_TYPE.PREBOOKED && (props.data?.rideStatus === RIDE_STATUS.DRIVER_ALLOCATED) ?
                            <View>
                                <View style={[Styles.mainMapContainerStyle, { height: hp(16) }]}>
                                    <CustomMapContainer
                                        showsCompass={false}
                                        isLoaderShow={true}
                                        region={{
                                            latitude: props?.data?.rideLocation?.pickup?.latitude,
                                            longitude: props?.data?.rideLocation?.pickup?.longitude,
                                            latitudeDelta: 0.015,
                                            longitudeDelta: 0.0121,
                                        }}
                                        minZoomLevel={15}
                                        style={Styles.mapContainerStyle}>
                                        <CustomUserMarkerView
                                            iconStyle={{ tintColor: colors.GREEN_ICON }}
                                            coordinate={{
                                                latitude: props?.data?.rideLocation?.pickup?.latitude,
                                                longitude: props?.data?.rideLocation?.pickup?.longitude,
                                            }}
                                        />
                                        <CustomUserMarkerView
                                            iconImage={Icons.DESTINATION_LOCATION_ICON}
                                            iconStyle={{
                                                tintColor: undefined,
                                                width: wp(15),
                                                height: wp(15),
                                                resizeMode: 'contain'
                                            }}
                                            coordinate={{
                                                latitude: props?.data?.rideLocation?.destination?.latitude,
                                                longitude: props?.data?.rideLocation?.destination?.longitude,
                                            }}
                                        />
                                        {(routeTrackList || coordinates) && <Polyline
                                            coordinates={routeTrackList ?? coordinates}
                                            strokeWidth={3}
                                        />}
                                        {/* {globalView} */}
                                        {/* <MapViewDirections
                                            apikey={GOOGLE_MAP_API}
                                            origin={props?.data?.rideLocation?.pickup}
                                            destination={props?.data?.rideLocation?.destination}
                                            splitWaypoints
                                            mode='DRIVING'
                                            strokeWidth={3}
                                            strokeColor={colors.PRIMARY_TEXT}
                                            optimizeWaypoints={true}
                                            onReady={() => {
                                                let params = {
                                                    api_name: "Google Directions API",
                                                    ride_booking_id: props.data.id
                                                }
                                                dispatch(setApiCounter(params))
                                            }}
                                        /> */}
                                    </CustomMapContainer>
                                </View>
                                <CustomPrimaryButton
                                    onPress={() => {
                                        if (props?.data?.rideStatus === RIDE_STATUS.CREATED) {
                                            navigation.navigate("SearchingRiderScreen", {
                                                id: props?.data?.id
                                            })
                                        } else {
                                            props?.data?.id && navigation.navigate('TrackDriverScreen', { rideId: props?.data?.id })
                                        }
                                    }} title={props?.data?.rideStatus === RIDE_STATUS.CREATED ? AppStrings.find_driver : t(TranslationKeys.track_driver)} style={[GlobalStyle.primaryBtnStyle]} />
                                <TouchableOpacity
                                    // disabled={props.data?.rideStatus !== RIDE_STATUS.DRIVER_ALLOCATED}
                                    onPress={() => {
                                        props?.data?.id && navigation.navigate('CancelTaxiScreen', { id: props?.data?.id, isPreBook: true })
                                    }} style={Styles.cancleRideBtnStyle}>
                                    <Text style={[Styles.cancleRideTxtStyle, { color: colors.PRIMARY }]}>{props.data?.rideStatus !== RIDE_STATUS.DRIVER_ALLOCATED ? t(TranslationKeys.submit_for_dispute) : props?.data?.deliveryDetails ? t(TranslationKeys.cancel_delivery) : t(TranslationKeys.cancel_ride)}</Text>
                                </TouchableOpacity>
                            </View>
                            :
                            null
                        }
                        {
                            (props.type !== RIDE_TYPE.YOURRIDES && props.type !== RIDE_TYPE.PREBOOKED)
                                ?
                                <>
                                    {props?.data?.driverCar && props?.data?.driverCar?.seats
                                        &&
                                        <CommonRideTwoTextView title={t(TranslationKeys.no_of_seats)} subTitle={props.data?.driverCar?.seats} />
                                    }
                                    <View style={[GlobalStyle.rowContainer, Styles.buttonListContainerStyle]}>
                                        <CustomIconButton onPress={() => {
                                            props.data.id && navigation.navigate('CancelTaxiScreen', { id: props.data.id })
                                        }} icon={Icons.ROUND_CLOSE_ICON} iconStyle={{ tintColor: colors.WHITE_ICON }} style={Styles.commonRoundIconStyle} />
                                        <CustomIconButton onPress={() => {
                                            if (props?.data?.id && props?.data?.driver) {
                                                navigation.navigate('ChatScreen', {
                                                    roomId: props?.data?.id, userDetails: {
                                                        id: props?.data?.driver?.id,
                                                        name: props?.data?.driver?.name,
                                                        profilePic: props?.data?.driver?.profilePic,
                                                        phoneNumber: props?.data?.driver?.phoneNumber,
                                                    }
                                                })
                                            } else {
                                                // AppAlert("Please wait...", "Driver is not assign to you yet.")
                                            }
                                        }} icon={Icons.MESSAGE_ICON} iconStyle={{ tintColor: colors.WHITE_ICON }} style={Styles.commonRoundIconStyle} />
                                        <CustomIconButton onPress={() => {
                                            if (props?.data?.driver?.phoneNumber) {
                                                contactToDriver(props?.data?.driver?.phoneNumber)
                                            } else {
                                                // AppAlert("Please wait...", "Driver is not assign to you yet.")
                                            }
                                        }} icon={Icons.PHONE_ICON}
                                            iconStyle={{ tintColor: colors.WHITE_ICON }} style={Styles.commonRoundIconStyle} />
                                    </View>
                                </>
                                : null
                        }
                    </>
                    : null
            }
            {((props.type == RIDE_TYPE.YOURRIDES || props.type == RIDE_TYPE.PREBOOKED) && props.data?.rideStatus === RIDE_STATUS.COMPLETED) && (
                <TouchableOpacity style={[Styles.cancleRideBtnStyle, { marginTop: wp(1) }]}
                    onPress={() => {
                        dispatch(setnavigationDirection(true))
                        dispatch(setRideDetailsData(props?.data))
                        navigation.navigate('RideBillScreen', { from: 'YourRidesScreen' })
                    }}>
                    <Text style={Styles.cancleRideTxtStyle}>{props?.data?.deliveryDetails ? t(TranslationKeys.view_delivery_bill) : t(TranslationKeys.view_ride_bill)}</Text>
                </TouchableOpacity>
            )}
            {((props.type == RIDE_TYPE.PREBOOKED) && (props.data?.rideStatus === RIDE_STATUS.CREATED || props.data?.rideStatus === RIDE_STATUS.PAYMENT_HOLD)) && (
                <TouchableOpacity style={[Styles.cancleRideBtnStyle, { marginTop: wp(1) }]}
                    onPress={() => {
                        props.data.id && navigation.navigate('CancelTaxiScreen', { id: props.data.id, isPreBook: true })
                    }}>
                    <Text style={Styles.cancleRideTxtStyle}>{props?.data?.deliveryDetails ? t(TranslationKeys.cancel_delivery) : t(TranslationKeys.cancel_ride)}</Text>
                </TouchableOpacity>
            )}
            <CustomIconButton onPress={dropDown} icon={props?.expandMore === props?.data?.id ? Icons.UPARROW : Icons.DROPDOWN}
                style={Styles.bottomArrowIconContainerStyle}
                iconStyle={Styles.bottomArrowIconStyle}
            />
        </View>
    );
};

export default memo(CommonRideDetailsContainer);

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        commonItemSeprator: {
            backgroundColor: colors.SEPARATOR_LINE,
            height: wp(0.5),
            marginVertical: wp(2.5),
            borderRadius: wp(2)
        },
        mainContainerStyle: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            marginBottom: wp(5),
            borderRadius: wp(3),
            padding: wp(3),
            flex: 1,
        },
        mainContainerShadowStyle: {
            marginHorizontal: wp(0.5),
            shadowColor: colors.SHADOW_2,
            shadowOpacity: Platform.OS == "ios" ? 0.1 : 1,
            shadowRadius: 3,
            shadowOffset: { height: 0, width: 0 },
            elevation: 5,
        },
        cancleRideTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_12,
            color: colors.PRIMARY
        },
        mapContainerStyle: {
            borderRadius: wp(2),
            height: hp(16),
            marginTop: wp(3.5)
        },
        cancleRideBtnStyle: {
            alignItems: 'center',
            alignSelf: "center",
            paddingHorizontal: wp(2)
        },
        bottomArrowIconContainerStyle: {
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: wp(3),
            width: wp(100),
        },
        bottomArrowIconStyle: {
            width: wp(5),
            height: wp(5),
            resizeMode: 'contain',
            tintColor: colors.SECONDARY_ICON
        },
        commonRoundIconStyle: {
            padding: wp(5),
            backgroundColor: colors.SECONDARY,
            borderRadius: wp(10),
        },
        buttonListContainerStyle: {
            justifyContent: "space-evenly",
            marginTop: wp(5),
            marginHorizontal: wp(10),
            marginBottom: wp(3),
        },
        listItemSepratorStyle: {
            backgroundColor: colors.SEPARATOR_LINE,
            height: wp(0.4),
            width: "86%",
            alignSelf: 'center',
            marginLeft: wp(10),
            borderRadius: wp(2)
        },
        spaceBetweenView: {
            justifyContent: 'space-between'
        },
        locationContainerStyle: {
            // maxHeight: hp(20)
            flex: 1
        },
        mainMapContainerStyle: {
            overflow: 'hidden',
            borderRadius: wp(1.5),
            marginTop: wp(2)
        },
        deleteIcon: {
            width: wp(6),
            height: wp(6),
            resizeMode: 'contain',
            alignSelf: 'flex-end',
            tintColor: colors.ERROR_TEXT
        },
        requestTxtStyle: {
            color: colors.SECONDARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_14,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            // maxWidth: wp(45),
        },
        paymentRefundText: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_14,
            color: colors.ERROR_TEXT,
            width: '80%',
            marginBottom: wp(2)
        },
        userNameTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_16,
            color: colors.PRIMARY_TEXT,
            textAlign: 'left',
            marginTop: wp(1),
            marginBottom: wp(-1)
        },
    });
};
