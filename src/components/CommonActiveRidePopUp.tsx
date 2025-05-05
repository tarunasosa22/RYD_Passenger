import React, { Dispatch, SetStateAction, memo, useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppDispatch, useAppSelector } from '../redux/Store';
import CommonRideUserDetailView from './CommonRideUserDetailView';
import { Icons } from '../utils/IconsPaths';
import CustomMapContainer from './CustomMapContainer';
import CustomUserMarkerView from './CustomUserMarkerView';
import CustomPrimaryButton from './CustomPrimaryButton';
import CustomIconButton from './CustomIconButton';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Fonts } from '../styles/Fonts';
import { FontSizes } from '../styles/FontSizes';
import CommonDraggableItem from './CommonDraggableItem';
import CommonDraggableDashView from './CommonDraggableDashView';
import CommonRideIconTextView from './CommonRideIconTextView';
import CommonRideTwoTextView from './CommonRideTwoTextView';
import useCustomNavigation from '../hooks/useCustomNavigation';
import { RideBookingListDetailsTypes, RideLocationTypes, } from '../redux/slice/rideSlice/RideSlice';
import moment from 'moment';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAP_API } from '../config/Host';
import { RIDE_STATUS, RIDE_TYPE } from '../utils/Constats';
import { TranslationKeys } from '../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { setPrice } from '../utils/HelperFunctions';
import 'moment/locale/ar';
import 'moment/locale/en-gb';
import 'moment/locale/hi';
import { useLanguage } from '../context/LanguageContext';

interface CommonRideDetailsContainerProps {
    data: RideBookingListDetailsTypes,
    type?: string,
    onClose: () => void,
    onCancel: () => void,
    onNavigateToPrebook: () => void
};

const CommonActiveRidePopUp = (props: CommonRideDetailsContainerProps) => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const dispatch = useAppDispatch();
    const navigation = useCustomNavigation('DrawerStack')
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const [location, setLocation] = useState<RideLocationTypes[] | []>([]);
    const { t } = useTranslation();
    const { langCode } = useLanguage()

    useEffect(() => {
        let locationData: RideLocationTypes[] = []
        if (props?.data?.rideLocation?.stop) {
            locationData = [props?.data?.rideLocation?.pickup, ...props?.data?.rideLocation?.stop, props?.data?.rideLocation?.destination]
        } else {
            locationData = [props?.data?.rideLocation?.pickup, props?.data?.rideLocation?.destination]
        }
        setLocation(locationData)
    }, [props?.data?.rideLocation])

    const getFormattedDate = () => {
        moment.locale(langCode);
    }
    useEffect(()=>{
        getFormattedDate()
    },[])

    const renderItem = ({ item, index }: { item: RideLocationTypes, index: number }) => {
        return (
            <View>
                <CommonDraggableItem
                    disabled={true}
                    icon={index == 0 ? Icons.ROUND_LOCATION_ICON : Icons.LOCATION_MARKER_ICON}
                    iconStyle={{
                        tintColor: index == 0 ? colors.SECONDARY_ICON : colors.PRIMARY
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

    return (
        <View style={[Styles.mainContainerStyle, Styles.mainContainerShadowStyle]} >
            <TouchableOpacity onPress={props.onClose}>
                <Image source={Icons.ROUND_CLOSE_ICON} style={Styles.commonRoundIconStyle2} />
            </TouchableOpacity>
            <Text style={Styles.activeRideFoundtext}>{t(TranslationKeys.active_ride_found_c)}</Text>
            <CommonRideUserDetailView
                userData={{
                    driver: props.data?.driver,
                    driverCar: props.data?.driverCar,
                    priceModel: props.data?.priceModel,
                    rideCancelBy: props?.data?.rideCancelBy,
                }}
            />
            <View style={Styles.commonItemSeprator} />
            <View style={[GlobalStyle.rowContainer, Styles.spaceBetweenView]}>
                <CommonRideIconTextView icon={Icons.LOCATION_MARKER_BORDER} title={props.data?.distance + "km"} />
                <CommonRideIconTextView icon={Icons.CLOCK_BORDER} title={props.data?.estimatedTime + "Min"} />
                <CommonRideIconTextView icon={Icons.WALLET} title={setPrice(t, props.data?.ridePayment?.totalFare)} />
            </View>
            <CommonRideTwoTextView
                containerStyle={{
                    marginTop: wp(3.5)
                }} title={t(TranslationKeys.date_and_time)}
                subTitle={props?.data?.preBookedTime ? moment(props?.data?.preBookedTime).format('DD MMM YYYY | LT') : moment(props?.data?.createdAt).format('DD MMM YYYY | LT')} />
            {
                props?.data?.id ?
                    <>
                        <View style={Styles.commonItemSeprator} />
                        <ScrollView
                            nestedScrollEnabled showsVerticalScrollIndicator={false} style={Styles.locationContainerStyle}>
                            {
                                location?.map((item, index) => {
                                    return renderItem({ item, index })
                                })
                            }
                        </ScrollView>
                        {
                            props?.data?.driverCar && props?.data?.driverCar?.registrationNumber ?
                                <>
                                    <CommonRideTwoTextView
                                        containerStyle={{
                                            marginTop: wp(3)
                                        }} title={t(TranslationKeys.vehicle_number)}
                                        subTitle={props.data?.driverCar?.registrationNumber} />
                                    <View style={Styles.commonItemSeprator} />
                                </> : null
                        }
                        {props.type === RIDE_TYPE.YOURRIDES && (props.data?.rideStatus === RIDE_STATUS.DRIVER_ALLOCATED || props.data?.rideStatus === RIDE_STATUS.ONGOING) ?
                            <>
                                <CustomMapContainer
                                    region={{
                                        latitude: props?.data?.rideLocation?.pickup?.latitude,
                                        longitude: props?.data?.rideLocation?.pickup?.latitude,
                                        latitudeDelta: 0.015,
                                        longitudeDelta: 0.0121,
                                    }}
                                    style={Styles.mapContainerStyle}>
                                    <CustomUserMarkerView
                                        coordinate={{
                                            latitude: props?.data?.rideLocation?.pickup?.latitude,
                                            longitude: props?.data?.rideLocation?.pickup?.latitude,
                                        }}
                                    />
                                    <CustomUserMarkerView
                                        iconImage={Icons.DESTINATION_LOCATION_ICON}
                                        iconStyle={{
                                            tintColor: undefined
                                        }}
                                        coordinate={{
                                            latitude: props?.data?.rideLocation?.destination?.latitude,
                                            longitude: props?.data?.rideLocation?.destination?.latitude,
                                        }}
                                    />
                                    {/* <MapViewDirections
                                        apikey={GOOGLE_MAP_API}
                                        origin={props?.data?.rideLocation?.pickup}
                                        destination={props?.data?.rideLocation?.destination}
                                        splitWaypoints
                                        mode='DRIVING'
                                        strokeWidth={3}
                                        strokeColor={colors.SECONDARY}
                                        optimizeWaypoints={true}
                                    /> */}
                                </CustomMapContainer>
                                <CustomPrimaryButton onPress={() => {
                                    // dispatch(assignRideDetails(props.data))
                                    props?.data?.id && navigation.navigate('TrackDriverScreen', { rideId: props?.data?.id })
                                }} title={t(TranslationKeys.track_driver)} style={[GlobalStyle.primaryBtnStyle]} />
                                <TouchableOpacity style={Styles.cancleRideBtnStyle}
                                    onPress={() => {
                                        props?.data?.id && navigation.navigate('CancelTaxiScreen', { id: props?.data?.id })
                                    }}>
                                    <Text style={Styles.cancleRideTxtStyle}>{t(TranslationKeys.cancel_ride)}</Text>
                                </TouchableOpacity>
                            </>
                            :
                            null
                        }
                        {
                            props.type !== RIDE_TYPE.YOURRIDES
                                ?
                                <>
                                    <View style={[GlobalStyle.rowContainer, Styles.buttonListContainerStyle]}>
                                        <View style={{ alignItems: 'center' }}>
                                            <CustomIconButton icon={Icons.ROUND_CLOSE_ICON} disabled={props.data?.rideStatus == RIDE_STATUS.ONGOING} iconStyle={{ tintColor: colors.WHITE_ICON }} style={[Styles.commonRoundIconStyle, { backgroundColor: props.data?.rideStatus == RIDE_STATUS.ONGOING ? colors.DISABLE_BUTTON : colors.PRIMARY }]} onPress={props.onCancel} />
                                            <Text style={Styles.buttonTxt}>{t(TranslationKeys.cancel_trip)}</Text>
                                        </View>

                                        <View style={{ alignItems: 'center' }}>
                                            <CustomIconButton icon={Icons.LOCATION_MARKER_ICON} iconStyle={{ tintColor: colors.WHITE_ICON }} style={Styles.commonRoundIconStyle} onPress={props.onNavigateToPrebook} />
                                            <Text style={Styles.buttonTxt}>{t(TranslationKeys.track_ride)}</Text>
                                        </View>
                                    </View>
                                </>
                                : null
                        }
                    </>
                    : null
            }
        </View>
    );
};

export default memo(CommonActiveRidePopUp);

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        commonItemSeprator: {
            backgroundColor: colors.SEPARATOR_LINE,
            height: wp(0.5),
            marginVertical: wp(3.5),
            borderRadius: wp(2)
        },
        buttonTxt: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_12,
            color: colors.SECONDARY_TEXT,
            maxWidth: wp(40),
            alignSelf: 'center',
            marginTop: wp(1)
        },
        mainContainerStyle: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3),
            padding: wp(4),
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
            backgroundColor: colors.PRIMARY,
            borderRadius: wp(10),
        },
        commonRoundIconStyle2: {
            width: wp(8), height: wp(8),
            backgroundColor: colors.SECONDARY_ICON,
            borderRadius: wp(10),
            alignSelf: 'flex-end'
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
            maxHeight: hp(20)
        },
        activeRideFoundtext: {
            marginTop: wp(1),
            fontSize: FontSizes.FONT_SIZE_18,
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
            marginBottom: wp(3),
            color: colors.PRIMARY_TEXT,
            textAlign: 'left'
        }
    });
};
