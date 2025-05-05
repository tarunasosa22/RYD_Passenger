import { FlatList, Platform, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CommonStepersContainer from './CommonStepersContainer'
import CustomHeader from './CustomHeader'
import { useTranslation } from 'react-i18next'
import { useGlobalStyles } from '../hooks/useGlobalStyles'
import { useLanguage } from '../context/LanguageContext'
import { useAppDispatch, useAppSelector } from '../redux/Store'
import { TranslationKeys } from '../localization/TranslationKeys'
import useCustomNavigation from '../hooks/useCustomNavigation'
import CommonDraggableItem from './CommonDraggableItem'
import CommonDraggableDashView from './CommonDraggableDashView'
import { Icons } from '../utils/IconsPaths'
import { DestinationsProps } from '../redux/slice/homeSlice/HomeSlice'
import { widthPercentageToDP as wp } from 'react-native-responsive-screen'
import CustomContainer from './CustomContainer'
import CustomIconTextView from './CustomIconTextView'
import CustomBottomBtn from './CustomBottomBtn'

const CustomDeliveryBooking = (props: any) => {
    const { t } = useTranslation()
    const GlobalStyles = useGlobalStyles();
    const Styles = useStyles();
    const dispatch = useAppDispatch();
    const navigation = useCustomNavigation('DeliveyReviewScreen');
    const { colors } = useAppSelector(state => state.CommonSlice)
    const { deliveryDetails } = useAppSelector(state => state.RideSlice)
    const { bookingDestinations, paymentMethod, rideQuotationList } = useAppSelector(state => state.HomeSlice)
    const { locale } = useLanguage()

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

    return (
        <View style={GlobalStyles.container}>
            {/* {isLoading ? <CustomActivityIndicator /> : null}  */}
            <CommonStepersContainer step={3} />
            <CustomHeader
                edges={['none']}
                title={t(TranslationKeys.select_vehicle)}
                iconStyle={{
                    tintColor: colors.SECONDARY_ICON
                }}
                onPress={() => navigation.goBack()}
            />
            <View style={{ flex: 1 }}>
                <View style={{
                    backgroundColor: colors.TRANSPARENT,
                    paddingHorizontal: 0,
                    paddingVertical: 0,
                    paddingTop: wp(2),
                }}>
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

                    <FlatList
                        data={props.pricingModal}
                        renderItem={props.renderItem}
                        contentContainerStyle={[Styles.carlistContentContainerStyle]}
                        style={[Styles.carsListConatinerStyle, Styles.commonBackShadow, { marginTop: wp(1) }]}
                        showsHorizontalScrollIndicator={false}
                        ItemSeparatorComponent={() => {
                            return (
                                <View style={Styles.carsItemSepratorStyle} />
                            )
                        }}
                    />
                    <CustomIconTextView
                        onPress={() => {
                            navigation.navigate('SelectPaymentModeScreen')
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
                    <CustomIconTextView
                        disabled={true}
                        activeOpacity={1}
                        title={`${deliveryDetails?.goodsWeight}${t(TranslationKeys.kg)} ${deliveryDetails?.goodsPackage}`}
                        leftIcon={Icons.DELIVERY_ICON}
                        leftIconStyle={{ tintColor: colors.SECONDARY, width: wp(6), height: wp(6) }}
                        style={[Styles.commonPaddingContainer, Styles.commonBackShadow]}
                    />
                </View>
            </View>
            <CustomBottomBtn
                disabled={props.disabled}
                style={{ backgroundColor: !props.disabled ? colors.PRIMARY : colors.SECONDARY_LIGHT_ICON }}
                title={t(TranslationKeys.next)}
                onPress={props.onPress}
            />
        </View>

    )
}

export default CustomDeliveryBooking

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)
    const { locale } = useLanguage()

    return StyleSheet.create({
        destiantionListContainerStyle: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(5),
            marginBottom: wp(2),
            marginHorizontal: wp(5)
        },
        commonBackShadow: {
            shadowColor: colors.SHADOW_1,
            shadowOpacity: Platform.OS == "ios" ? 0.3 : 1,
            shadowRadius: 10,
            shadowOffset: { height: 0, width: 0 },
            elevation: 15,
        },
        itemSepratorLine: {
            backgroundColor: colors.SEPARATOR_LINE,
            height: wp(0.4),
            width: "84%",
            alignSelf: 'center',
            marginLeft: wp(7),
            borderRadius: wp(2)
        },
        carlistContentContainerStyle: {
            paddingLeft: wp(5),
            paddingRight: wp(3)
        },
        carsListConatinerStyle: {
            backgroundColor: colors.TRANSPARENT,
            maxHeight: wp(50),
            marginBottom: wp(2)
        },
        carsItemSepratorStyle: {
            flex: 1,
        },
        commonPaddingContainer: {
            paddingVertical: wp(3.5),
            marginHorizontal: wp(5)
        },
    })
};