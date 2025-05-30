import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Platform } from 'react-native';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
import { PAYMENT_METHOD, RIDE_STATUS, DriverTipData, PICK_UP_MODE } from '../../utils/Constats';
import { Image } from 'react-native';
import { ImagesPaths } from '../../utils/ImagesPaths';
import CustomIconButton from '../CustomIconButton';
import { Icons } from '../../utils/IconsPaths';
import { TouchableOpacity } from 'react-native';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { RideDetailsTypes, rideDetails } from '../../redux/slice/homeSlice/HomeSlice';
import { contactToDriver, setPrice } from '../../utils/HelperFunctions';
import CustomIconTextView from '../CustomIconTextView';
// import CustomIconTextView from '../CustomIconTextView';
// import { Platform } from 'react-native';
import { TipContainerProps } from '../../screens/utils/RateDriverScreen';
import BottomSheet, { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { addSosRideIdReducer } from '../../redux/slice/contactSlice/ContactSlice';
import { LayoutAnimation } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { ScrollView } from 'react-native';
import { RideLocationTypes, setCustomTip, setTipAmount, setTipConatinerVisible } from '../../redux/slice/rideSlice/RideSlice';
import CommonDraggableItem from '../CommonDraggableItem';
import CommonDraggableDashView from '../CommonDraggableDashView';
import CustomContainer from '../CustomContainer';
import CustomBottomBtn from '../CustomBottomBtn';
import { useLanguage } from '../../context/LanguageContext';
import FastImage from 'react-native-fast-image';
import CommonPaymentButton from '../CommonPaymentButton';

interface TrackDriverBottomSheetComponentProps {
    rideStatus?: string,
    rideOtp?: string,
    onPayment: (tip: number, payment_type: string, totalAmount: number) => void,
    onMarkerPress: () => void,
    duration?: number,
    rideBooking: RideDetailsTypes | undefined,
    enableTip: string
    selectPaymentMethod: string
    setEnableTip: React.Dispatch<React.SetStateAction<string>>,
    setSelectPaymentMethod: React.Dispatch<React.SetStateAction<string>>,
    isVisibleSosBtn: boolean
    onChangePayment: (() => void)
    isDisable?: boolean
};

const TrackDriverBottomSheetComponent = (props: TrackDriverBottomSheetComponentProps) => {

    const GlobalStyles = useGlobalStyles();
    const Styles = useStyles();
    const { tipBtnOn } = useAppSelector(state => state.RideSlice);
    const navigation = useCustomNavigation("TrackDriverScreen");
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { rideDetails } = store.getState().RideSlice
    const [userImageError, setUserImageError] = useState<boolean>(false)
    const { paymentMethod } = useAppSelector(state => state.HomeSlice);
    const { driverDetails } = useAppSelector(state => state.RideSlice);
    const [isSelect, setIsSelect] = useState<number>(0);
    const [isTipContainerVisible, setIsTipContainerVisible] = useState<boolean>(false);
    const [isOpenPaymentOpetion, setIsOpenPaymentOpetion] = useState<boolean>(false);
    const [location, setLocation] = useState<RideLocationTypes[] | []>([]);
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const bottomSheetRef = useRef(null);
    const [isBtnDiabled, setIsBtnDiabled] = useState(false)
    const { setSelectPaymentMethod, selectPaymentMethod } = props
    const { langCode } = useLanguage()

    useEffect(() => {
        LayoutAnimation.configureNext({ ...LayoutAnimation.Presets.easeInEaseOut, duration: 200 });
    }, [props?.isVisibleSosBtn])

    useEffect(() => {
        let locationData: RideLocationTypes[] = []
        if (rideDetails?.rideLocation && rideDetails?.rideLocation?.pickup && rideDetails?.rideLocation?.destination) {
            if (rideDetails?.rideLocation?.stop) {
                locationData = [rideDetails?.rideLocation?.pickup, ...rideDetails?.rideLocation?.stop, rideDetails?.rideLocation?.destination]
            } else {
                locationData = [rideDetails?.rideLocation?.pickup, rideDetails?.rideLocation?.destination]
            }
        }
        setLocation(locationData)
    }, [rideDetails?.rideLocation])


    const renderItem = ({ item }: { item: TipContainerProps }) => (
        <TouchableOpacity activeOpacity={1} onPress={() => {
            dispatch(setTipAmount(item?.id))
            dispatch(setCustomTip(''));
        }}>
            <View style={[Styles.tipContianer, store.getState().RideSlice.isTipAmount === item.id ? { backgroundColor: colors.PRIMARY } : null]}>
                <Text style={[Styles.tipContainerText, { color: store.getState().RideSlice.isTipAmount === item.id ? colors.BUTTON_TEXT : colors.PRIMARY_TEXT }]}>{t(item.tip)}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderLocationItem = ({ item, index }: { item: RideLocationTypes, index: number }) => {
        return (
            <View style={{ borderRadius: wp(2) }}>
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

    if (!rideDetails) {
        return (
            <View style={Styles.pleaseWaitContainer}>
                <Text style={Styles.pleaseTxtStyle}>{t(TranslationKeys.please_wait)}</Text>
            </View>
        )
    }

    const normalizeToEnglishDigits = (str: any) => {
        return str
            // Arabic-Indic: ٠١٢٣٤٥٦٧٨٩
            .replace(/[\u0660-\u0669]/g, (d: string) => d.charCodeAt(0) - 1632)
            // Persian: ۰۱۲۳۴۵۶۷۸۹
            .replace(/[\u06F0-\u06F9]/g, (d: string) => d.charCodeAt(0) - 1776)
            // Devanagari (Hindi): ०१२३४५६७८९
            .replace(/[\u0966-\u096F]/g, (d: string) => d.charCodeAt(0) - 2406);
    }

    function toSafeNumberOrEmpty(input: any) {
        const normalized = normalizeToEnglishDigits(input);
        const num = Number(normalized);
        return isNaN(num) ? '' : num;
    }

    const isDispute = (props?.rideStatus == RIDE_STATUS.ONGOING || props?.rideStatus == RIDE_STATUS.DRIVER_ENDED)

    const isBeforeWithCard = store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide && paymentMethod == "Card"

    const paymentAmount = (Number(rideDetails?.ridePayment?.totalFare))
    return (
        <View style={{ flex: 1 }
        }>
            {/* {!props.isVisibleSosBtn &&
                <View style={[GlobalStyles.rowContainer, Styles.headerBtnContainer]} >
                    <Image source={Icons.LEFT_ARROW_ICON} style={Styles.sosIconStyle} />
                    <TouchableOpacity style={[GlobalStyles.rowContainer, Styles.sosBtnStyle]}
                        onPress={() => {
                            dispatch(addSosRideIdReducer(rideDetails?.id))
                            navigation.navigate('SosScreen', { status: "pending" });
                        }}
                    >
                        <Image source={Icons.SOS_ICON} style={{ ...GlobalStyles.commonIconStyle, ...Styles.sosIconStyles }} />
                        <Text style={Styles.sosTxtStyle}>{t(TranslationKeys.sos)}</Text>
                    </TouchableOpacity>
                </View>
            } */}
            <View style={[GlobalStyles.rowContainer, { justifyContent: 'space-between' }]}>
                {props.rideStatus ? <Text numberOfLines={2} style={[Styles.rideFoundTxtStyle, { width: '70%' }]}>{props.rideStatus === RIDE_STATUS.DRIVER_ALLOCATED ? driverDetails?.isArrived ? t(TranslationKeys.driver_has_started) : t(TranslationKeys.driver_is_arriving) : (props.rideStatus === RIDE_STATUS.ONGOING) ? rideDetails?.deliveryDetails ? t(TranslationKeys.delivery_started) : t(TranslationKeys.ride_started) : props.rideStatus === RIDE_STATUS.CANCELLED ? t(TranslationKeys.ride_cancelled) : props.rideStatus === RIDE_STATUS.DRIVER_ENDED ? rideDetails?.deliveryDetails ? t(TranslationKeys.delivery_ended_by_driver) : t(TranslationKeys.ride_ended_by_driver) : t(TranslationKeys.ride_completed)}</Text> : null}
                {(props.duration ?? rideDetails?.estimatedTime) ? <Text numberOfLines={1} style={Styles.arriveTxtStyle}>{props.duration?.toFixed(2) ?? rideDetails?.estimatedTime?.toFixed(2)} {t(TranslationKeys.min)}</Text> : null}
            </View>
            <View style={Styles.itemSepratorStyle} />
            <View style={[GlobalStyles.rowContainer, { justifyContent: 'space-between' }]}>
                <View style={[GlobalStyles.rowContainer, { flex: 1 }]}>
                    <FastImage source={rideDetails?.driver?.profilePic && !userImageError ? { uri: rideDetails?.driver?.profilePic } : ImagesPaths.EMPTY_IMAGE} onError={() => {
                        setUserImageError(true)
                    }} style={Styles.userProfileStyle} />
                    <View style={Styles.userNameContainerStyle}>
                        <View style={[GlobalStyles.rowContainer]}>
                            <Text numberOfLines={1} style={Styles.userNameTxtStyle}>{rideDetails?.driver?.name}</Text>
                            {rideDetails?.driver?.isVerified && <Image source={Icons.VERIFIED_ICON} style={Styles.verifiedTickMark} />}
                        </View>
                        {rideDetails?.driverCar?.name ? <Text numberOfLines={2} style={Styles.carTypeTxtStyle}>{rideDetails?.priceModel?.carType} ({rideDetails?.driverCar?.name})</Text> : null}
                    </View>
                </View>
                <View>
                    {props?.rideOtp && <Text numberOfLines={1} style={[Styles.plateNumberTxtStyle, Styles.otpTextStyle]}>{t(TranslationKeys.otp)} <Text style={Styles.otpNumberText}>{props?.rideOtp}</Text></Text>}
                    <Text numberOfLines={1} style={Styles.plateNumberTxtStyle}>{rideDetails?.driverCar?.registrationNumber?.trim()}</Text>
                </View>
            </View>
            <View style={[GlobalStyles.rowContainer, Styles.buttonListContainerStyle, { alignItems: 'flex-start' }]}>
                <View style={{ alignItems: 'center', width: wp(20) }}>
                    <CustomIconButton
                        // disabled={(props.rideStatus == RIDE_STATUS.ONGOING || props.rideStatus == RIDE_STATUS.DRIVER_ENDED) ? true : false}
                        onPress={() => {
                            rideDetails?.id && navigation.navigate('CancelTaxiScreen', { id: rideDetails?.id, isPreBook: rideDetails?.pickupMode == PICK_UP_MODE.LATER ? true : false, isDispute: isDispute })
                        }} icon={Icons.ROUND_CLOSE_ICON} iconStyle={{ tintColor: colors.WHITE_ICON }} style={[Styles.commonRoundIconStyle, { backgroundColor: colors.PRIMARY }]} />
                    <Text style={Styles.buttonTxt}>{isDispute ? t(TranslationKeys.submit_for_dispute) : rideDetails?.deliveryDetails ? t(TranslationKeys.cancel_delivery) : t(TranslationKeys.cancel_trip)}</Text>
                </View>

                <View style={{ alignItems: 'center', width: wp(20) }}>
                    <CustomIconButton onPress={() => {
                        if (props?.rideBooking?.driver?.phoneNumber) {
                            contactToDriver(props?.rideBooking?.driver?.phoneNumber)
                        }
                    }} icon={Icons.PHONE_ICON} iconStyle={{ tintColor: colors.WHITE_ICON }} style={Styles.commonRoundIconStyle} />
                    <Text style={Styles.buttonTxt}>{t(TranslationKeys.call)}</Text>
                </View>
                <View style={{ alignItems: 'center', width: wp(20) }}>
                    <CustomIconButton
                        onPress={() => {
                            setIsOpenPaymentOpetion(false)
                            bottomSheetRef.current?.open()
                        }}
                        icon={Icons.RIDE_INFO_ICON}
                        iconStyle={{ tintColor: colors.WHITE_ICON, height: wp(6.5), width: wp(6), resizeMode: 'contain' }}
                        style={{ ...Styles.commonRoundIconStyle }} />
                    <Text style={[Styles.buttonTxt]}>{rideDetails?.deliveryDetails ? t(TranslationKeys.delivery_info) : t(TranslationKeys.ride_info)}</Text>
                </View>
            </View>
            {(rideDetails.rideStatus == RIDE_STATUS.ONGOING || rideDetails.rideStatus == RIDE_STATUS.DRIVER_ENDED) &&
                <>
                    <CustomIconTextView
                        disabled={store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide}
                        onPress={() => {
                            setIsOpenPaymentOpetion(true)
                            bottomSheetRef.current?.open()
                            // bottomSheetRef.current?.close()
                            // navigation.navigate('SelectPaymentModeScreen', { rideId: rideDetails?.id })
                        }}
                        activeOpacity={1}
                        title={langCode == "hi" ? (paymentMethod == "Cash" ? t(TranslationKeys.cash) : paymentMethod == "Card" ? t(TranslationKeys.card_payment) : t(TranslationKeys.upi_payment)) + " " + t(TranslationKeys.pay_via) : t(TranslationKeys.pay_via) + " " + (paymentMethod == "Cash" ? t(TranslationKeys.cash) : paymentMethod == "Card" ? t(TranslationKeys.card_payment) : t(TranslationKeys.upi_payment))}
                        leftIcon={paymentMethod == "Cash" ? Icons.CASH_ICON : paymentMethod == "Card" ? Icons.CARD : Icons.QR_CODE_ICONS}
                        // rightIcon={Icons.RIGHT_ARROW_ICON}
                        style={[Styles.commonPaddingContainer, Styles.commonBackShadow]}
                    />
                    {(store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide && paymentMethod == "Card") ? null :
                        <View style={[GlobalStyles.rowContainer, { justifyContent: 'space-between', paddingVertical: wp(3) }]}>
                            <Text style={Styles.addTipText}>{t(TranslationKeys.add_a_tip_to)} {rideDetails?.driver?.name}?</Text>
                            <TouchableOpacity activeOpacity={1} onPress={() => {
                                props.setEnableTip(props.enableTip == "on" ? "off" : "on")
                                if (props.enableTip === "on") {
                                    // setIsSelect(0)
                                    dispatch(setTipAmount(0))
                                    dispatch(setCustomTip(''))
                                    dispatch(setTipConatinerVisible(false))
                                    setIsTipContainerVisible(false)
                                } else {
                                    dispatch(setTipConatinerVisible(true))
                                    setIsTipContainerVisible(true)
                                }
                            }} style={[Styles.userStatusContainerStyle, {
                                backgroundColor: colors.SHADOW_1,
                                // position: 'absolute',
                                // right: wp(2)
                            }]}>
                                {!store.getState().RideSlice.isTipConianerVisible ? <View style={Styles.userStatusStyle} /> : null}
                                <Text style={[Styles.userStatusTxtStyle, { color: colors.SECONDARY_TEXT, fontFamily: Fonts.FONT_POP_SEMI_BOLD }]}>{store.getState().RideSlice.isTipConianerVisible ? t(TranslationKeys.on) : t(TranslationKeys.off)}</Text>
                                {store.getState().RideSlice.isTipConianerVisible ? <View style={{ ...Styles.userStatusStyle }} /> : null}
                            </TouchableOpacity>
                        </View>}
                    {store.getState().RideSlice?.isTipConianerVisible ?
                        <>
                            <View>
                                <FlatList data={DriverTipData} renderItem={renderItem} horizontal keyExtractor={item => item.id.toString()} contentContainerStyle={Styles.contentContainer} scrollEnabled={false} />
                            </View>
                            <Text style={[Styles.addTipText, { marginTop: wp(5), }]}>{t(TranslationKeys.add_custom_tip)}?</Text>
                            <BottomSheetTextInput
                                placeholder={t(TranslationKeys.add_custom_tip)}
                                onChangeText={text => {
                                    dispatch(setCustomTip(toSafeNumberOrEmpty(text) !== 0 ? toSafeNumberOrEmpty(text) : ''))
                                    dispatch(setTipAmount(0));
                                }}
                                keyboardType='numeric'
                                placeholderTextColor={colors.SECONDARY_TEXT}
                                style={Styles.tipInputContainerTextStyle}
                                returnKeyType='done'
                                maxLength={4}
                                value={store.getState().RideSlice?.customTip?.toString() ?? ''}
                            />
                        </>
                        : null}
                    {/* <TouchableOpacity
                        disabled={(!isBeforeWithCard && (isBtnDiabled || props.rideStatus !== RIDE_STATUS.DRIVER_ENDED)) || props?.isDisable}
                        onPress={() => {
                            setIsBtnDiabled(true)
                            if (rideDetails?.ridePayment?.paymentStatus !== PAYMENT_METHOD.UPI && rideDetails?.ridePayment.paymentStatus === RIDE_STATUS.COMPLETED && rideDetails?.id) {
                                navigation.navigate('RateDriverScreen', { rideId: rideDetails?.id })
                                setIsBtnDiabled(false)
                            } else {
                                if (rideDetails?.id) {
                                    // stripe open
                                    props.onPayment(store.getState().RideSlice.isTipAmount !== 0 ? (store.getState().RideSlice.isTipAmount) : store.getState().RideSlice.customTip != '' ? store.getState().RideSlice.customTip : 0, paymentMethod, rideDetails?.ridePayment?.totalFare ?? 0)
                                    setIsBtnDiabled(false)
                                }
                            }
                        }}
                        style={[GlobalStyles.primaryBtnStyle, { flexDirection: 'row', marginBottom: 0, backgroundColor: !isBeforeWithCard && (isBtnDiabled || props.rideStatus !== RIDE_STATUS.DRIVER_ENDED) ? colors.SECONDARY_DOTTED_BORDER : colors.PRIMARY }]}>
                        <Image source={Icons.CARD} style={Styles.makePaymentIcon} />
                        {(rideDetails?.rideStatus === RIDE_STATUS.ONGOING || rideDetails.rideStatus == RIDE_STATUS.DRIVER_ENDED) && store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide && rideDetails?.ridePayment?.paymentMethod === "CARD" ? <Text style={Styles.makePaymentText}>{rideDetails?.deliveryDetails ? t(TranslationKeys.end_delivery) : t(TranslationKeys.end_ride)}</Text>
                            :
                            <Text style={Styles.makePaymentText}>{t(TranslationKeys.pay) + " " + `${setPrice(t, 0, true, true)}` + ' ' + paymentAmount.toFixed(2)}</Text>
                        }
                    </TouchableOpacity> */}
                </>
            }
            <RBSheet
                ref={bottomSheetRef}
                animationType={'fade'}
                height={hp(55)}
                closeOnPressBack
                closeOnPressMask
                customStyles={
                    {
                        container: {
                            borderTopLeftRadius: wp(5),
                            borderTopRightRadius: wp(5),
                        },
                        wrapper: {
                            backgroundColor: 'rgba(0,0,0,0.6)',
                        },
                    }
                }
            >
                <CustomContainer style={Styles.bottomSheetContainer}>
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                        {isOpenPaymentOpetion ? <>
                            {/* <CustomHeader onPress={() => {
                                // navigation.goBack()
                            }} title={t(TranslationKeys.select_payment_mode)} /> */}
                            <Text style={Styles.headerTxtStyle}>{t(TranslationKeys.select_payment_mode)}</Text>
                            <CommonPaymentButton
                                onPress={() => {
                                    setSelectPaymentMethod("Card")
                                }}
                                activeOpacity={1}
                                // label={t(TranslationKeys.upi_payment)}
                                title={t(TranslationKeys.card_payment)}
                                leftIcon={Icons.CARD}
                                leftIconStyle={{
                                    tintColor: colors.PRIMARY
                                }}
                                rightIcon={selectPaymentMethod == "Card" ? Icons.ACTIVE_RADIO_BUTTON : Icons.RADIO_BUTTON_ICON}
                                rightIconStyle={{
                                    tintColor: selectPaymentMethod == "Card" ? colors.PRIMARY : colors.DOTTED_BORDER
                                }}
                            />
                            <CommonPaymentButton
                                onPress={() => {
                                    setSelectPaymentMethod("Cash")
                                }}
                                activeOpacity={1}
                                // label={t(TranslationKeys.cash)}
                                title={t(TranslationKeys.cash)}
                                leftIcon={Icons.CASH_ICON}
                                leftIconStyle={{
                                    tintColor: colors.PRIMARY
                                }}
                                rightIcon={selectPaymentMethod == "Cash" ? Icons.ACTIVE_RADIO_BUTTON : Icons.RADIO_BUTTON_ICON}
                                rightIconStyle={{
                                    tintColor: selectPaymentMethod == "Cash" ? colors.PRIMARY : colors.DOTTED_BORDER
                                }}
                            /></> :
                            <>
                                <View style={[GlobalStyles.rowContainer, { justifyContent: 'space-between' }]}>
                                    <Text style={Styles.rideDetailsHeaderText}>{t(TranslationKeys.location_details)}</Text>
                                    <CustomIconButton icon={Icons.CANCELTAXIICON} iconStyle={GlobalStyles.commonIconStyle} onPress={() => bottomSheetRef.current?.close()} />
                                </View>

                                <View style={Styles.locationContainer}>
                                    <ScrollView bounces={false} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                                        {
                                            location?.map((item, index) => {
                                                return renderLocationItem({ item, index })
                                            })
                                        }
                                    </ScrollView>
                                </View>
                                <View style={Styles.itemSepratorStyle} />
                                <View style={[GlobalStyles.rowContainer, { justifyContent: 'space-between', paddingVertical: wp(4) }]}>
                                    <Text style={Styles.totalFareText}>{t(TranslationKeys.total_fare)}</Text>
                                    <Text style={Styles.totalFareText}>{setPrice(t, rideDetails?.ridePayment?.totalFare)}</Text>
                                </View>
                                <CustomIconTextView
                                    disabled={store.getState().PaymentSlice.isPaymentBeforeAfter?.takePaymentBeforeRide}
                                    onPress={() => {
                                        setIsOpenPaymentOpetion(true)
                                        bottomSheetRef.current?.open()
                                        // bottomSheetRef.current?.close()
                                        // navigation.navigate('SelectPaymentModeScreen', { rideId: rideDetails?.id })
                                    }}
                                    activeOpacity={1}
                                    title={t(TranslationKeys.pay_via) + " " + (paymentMethod == "Cash" ? t(TranslationKeys.cash) : paymentMethod == "Card" ? t(TranslationKeys.card_payment) : t(TranslationKeys.upi_payment))}
                                    leftIcon={paymentMethod == "Cash" ? Icons.CASH_ICON : paymentMethod == "Card" ? Icons.CARD : Icons.QR_CODE_ICONS}
                                    // rightIcon={Icons.RIGHT_ARROW_ICON}
                                    style={[Styles.commonPaddingContainer, Styles.commonBackShadow]}
                                />
                            </>}
                    </ScrollView>
                </CustomContainer>
                <CustomBottomBtn title={isOpenPaymentOpetion ? t(TranslationKeys.confirm_payment_mode) : t(TranslationKeys.got_it)}
                    onPress={() => {
                        if (isOpenPaymentOpetion) {
                            props.onChangePayment()
                        }
                        bottomSheetRef.current?.close()
                        setIsOpenPaymentOpetion(false)
                        // setTimeout(() => {
                        //     rideDetails?.id && navigation.navigate('CancelTaxiScreen', { id: rideDetails?.id })
                        // }, 300);
                    }} />
            </RBSheet>
        </View>
    )
}

export default memo(TrackDriverBottomSheetComponent)

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const { locale } = useLanguage()
    return (
        StyleSheet.create({
            plateNumberTxtStyle: {
                alignSelf: 'flex-end',
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.PRIMARY_TEXT,
                textTransform: 'uppercase'
            },
            headerTxtStyle: {
                marginHorizontal: wp(2),
                color: colors.PRIMARY_TEXT,
                fontSize: FontSizes.FONT_SIZE_15,
                fontFamily: Fonts.FONT_POP_MEDIUM,
                marginVertical: wp(2)
            },
            commonRoundIconStyle: {
                padding: wp(4),
                backgroundColor: colors.PRIMARY,
                borderRadius: wp(10),
            },
            buttonListContainerStyle: {
                justifyContent: "space-evenly",
                marginTop: wp(2.5),
                marginHorizontal: wp(10)
            },
            itemSepratorStyle: {
                height: wp(0.5),
                backgroundColor: colors.SEPARATOR_LINE,
                marginVertical: wp(3)
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
                fontSize: FontSizes.FONT_SIZE_12,
                color: colors.SECONDARY_TEXT,
                maxWidth: wp(40),
                textAlign: 'left'
            },
            buttonTxt: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_12,
                color: colors.SECONDARY_TEXT,
                maxWidth: wp(40),
                alignSelf: 'center',
                marginTop: wp(1),
                textAlign: 'center'
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
            userNameContainerStyle: {
                marginHorizontal: wp(2),
                flex: 1
            },
            pleaseTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_18,
                color: colors.PRIMARY_TEXT,
            },
            pleaseWaitContainer: {
                flex: 1,
                justifyContent: "center",
                alignItems: 'center'
            },
            commonBackShadow: {
                shadowColor: colors.SHADOW_1,
                shadowOpacity: Platform.OS == "ios" ? 0.3 : 1,
                shadowRadius: 10,
                shadowOffset: { height: 0, width: 0 },
                elevation: 15,
            },
            commonPaddingContainer: {
                paddingVertical: wp(3.5),
            },
            tipContianer: {
                paddingHorizontal: wp(2),
                paddingVertical: wp(2),
                backgroundColor: colors.SHADOW_1,
                borderRadius: wp(2),
                alignItems: 'center',
                justifyContent: 'center'
            },
            tipContainerText: {
                color: colors.PRIMARY_TEXT,
                fontSize: locale ? FontSizes.FONT_SIZE_14 : FontSizes.FONT_SIZE_16,
                fontFamily: Fonts.FONT_POP_MEDIUM
            },
            contentContainer: {
                flex: 1,
                justifyContent: 'space-around',
                alignItems: 'center',
            },
            addTipText: {
                textAlign: 'left',
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,

                marginBottom: wp(1)
            },
            userStatusContainerStyle: {
                alignItems: 'center',
                flexDirection: 'row',
                borderRadius: wp(10),
                paddingVertical: wp(0.5),
                paddingHorizontal: wp(0.5),
            },
            userStatusTxtStyle: {
                marginHorizontal: wp(1),
                color: colors.PRIMARY,
                fontSize: FontSizes.FONT_SIZE_14,
                fontFamily: Fonts.FONT_POP_REGULAR,
                textTransform: 'uppercase',
                paddingHorizontal: wp(1.5)
            },
            userStatusStyle: {
                height: wp(6),
                width: wp(6),
                backgroundColor: colors.PRIMARY,
                borderRadius: wp(6),
                borderWidth: wp(0.5),
                borderColor: colors.TRANSPARENT
            },
            tipInputContainerTextStyle: {
                backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
                borderRadius: wp(3),
                borderWidth: wp(0.3),
                borderColor: colors.BOX_BORDER,
                padding: wp(3),
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.SECONDARY_TEXT,
            },
            verifiedTickMark: {
                width: wp(6.5),
                height: wp(6.5),
                resizeMode: 'contain',
                marginBottom: wp(1),
                marginLeft: wp(1.5)
            },
            sosBtnStyle: {
                backgroundColor: colors.SOS_BTN_COLOR,
                padding: wp(1.5),
                borderRadius: wp(5),
                borderColor: colors.SOS_BTN_COLOR,
                borderWidth: 2,
                alignSelf: 'flex-end',
            },
            sosTxtStyle: {
                fontFamily: Fonts.FONT_POP_BOLD,
                fontSize: FontSizes.FONT_SIZE_15,
                color: colors.BUTTON_TEXT,
            },
            listItemSepratorStyle: {
                backgroundColor: colors.SEPARATOR_LINE,
                height: wp(0.4),
                width: "86%",
                alignSelf: 'center',
                marginLeft: wp(10),
                borderRadius: wp(2)
            },
            sosIconStyle: {
                width: wp(5),
                height: wp(5),
                resizeMode: 'contain',
                transform: [{ rotate: '270deg' }],
                marginBottom: wp(4)
            },
            headerBtnContainer: {
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: wp(2)
            },
            sosIconStyles: {
                tintColor: colors.WHITE_ICON,
                marginRight: wp(1.5),
                marginTop: wp(-1)
            },
            otpTextStyle: {
                alignSelf: 'flex-end',
                marginBottom: wp(1),
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.PRIMARY_TEXT,
            },
            otpNumberText: {
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.PRIMARY_TEXT,
            },
            unreadCountContainer: {
                position: 'absolute',
                top: wp(-1.5),
                left: wp(33),
                backgroundColor: colors.ERROR_TEXT,
                width: wp(6),
                height: wp(6),
                borderRadius: wp(3)
            },
            unreadText: {
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                fontSize: FontSizes.FONT_SIZE_15,
                color: colors.BUTTON_TEXT,
                textAlign: 'center'
            },
            bottomSheetContainer: {
                paddingVertical: wp(5),
                backgroundColor: colors.SECONDARY_BACKGROUND
            },
            rideDetailsHeaderText: {
                color: colors.PRIMARY_TEXT,
                fontSize: FontSizes.FONT_SIZE_17,
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                paddingHorizontal: wp(3)
            },
            locationContainer: {
                paddingTop: wp(2),
                paddingBottom: wp(5)
            },
            totalFareText: {
                color: colors.PRIMARY_TEXT,
                fontSize: FontSizes.FONT_SIZE_17,
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                paddingHorizontal: wp(3)
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
    )
}