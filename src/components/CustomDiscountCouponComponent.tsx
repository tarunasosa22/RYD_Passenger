import { Image, StyleSheet, Text, TouchableOpacity, View, ImageStyle, TextStyle } from 'react-native'
import React, { memo } from 'react'
import { ImageProps } from '../types/DataTypes'
import { useGlobalStyles } from '../hooks/useGlobalStyles'
import { useAppSelector } from '../redux/Store'
import { widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { FontSizes } from '../styles/FontSizes'
import CustomPrimaryButton from './CustomPrimaryButton'
import { Fonts } from '../styles/Fonts'
import { ImagesPaths } from '../utils/ImagesPaths'
import moment from 'moment'
import { lightThemeColors } from '../styles/Colors'
import { useTranslation } from 'react-i18next'
import { TranslationKeys } from '../localization/TranslationKeys'

interface DiscountCouponsProps {
    id: string,
    title: string,
    subTitle: string,
    titleStyle?: TextStyle,
    subTitleStyle?: TextStyle,
    onPress: () => void,
    toDate: string
    fromDate: string

}

const CustomDiscountCouponComponent = (props: DiscountCouponsProps) => {

    const Styles = useStyle()
    const { appliedCoupon } = useAppSelector(state => state.HomeSlice)
    const currentDate = moment(); // Get current date
    const startDate = moment(props?.fromDate); // Parse fromDate using moment
    const endDate = moment(props?.toDate); // Parse toDate using moment
    let isEnable = currentDate.isBetween(startDate, endDate, 'day', '[]');
    const { t } = useTranslation();

    return (
        <View {...props} style={[Styles.mainContainer, { borderWidth: appliedCoupon == props.id?.toString() ? 2 : 0 }]} >
            <View>
                <Text style={[Styles.titleText, props.titleStyle]}>
                    {props.title}
                </Text>
                <Text style={[Styles.subTitleText, props.subTitleStyle]}>{props.subTitle}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CustomPrimaryButton
                        onPress={props.onPress}
                        title={appliedCoupon == props.id?.toString() ? t(TranslationKeys.applied) : t(TranslationKeys.apply_now)}
                        disabled={(!isEnable || appliedCoupon == props.id?.toString())}
                        style={[Styles.applyNowBtnContainer, { backgroundColor: (isEnable && appliedCoupon !== props.id?.toString()) ? lightThemeColors.PRIMARY : lightThemeColors.SECONDARY_TEXT }]}
                        txtStyle={{ fontSize: FontSizes.FONT_SIZE_12 }}
                    />
                    {appliedCoupon == props.id?.toString() && <CustomPrimaryButton
                        onPress={props.onPress}
                        title={t(TranslationKeys.remove)}
                        disabled={!isEnable}
                        style={[Styles.applyNowBtnContainer, { backgroundColor: lightThemeColors.PRIMARY, marginLeft: wp(3) }]}
                        txtStyle={{ fontSize: FontSizes.FONT_SIZE_12 }}
                    />}
                </View>
            </View>
            <Image source={ImagesPaths.DISCOUNT_IMAGE} style={[Styles.imageStyle]} />
        </View>
    )
}

export default memo(CustomDiscountCouponComponent)

const useStyle = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)
    const GlobalStyle = useGlobalStyles()

    return (
        StyleSheet.create({
            mainContainer: {
                backgroundColor: "#5674B014",
                paddingVertical: wp(3),
                paddingHorizontal: wp(4),
                borderRadius: wp(2),
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginVertical: wp(2),
                borderColor: colors.PRIMARY,

            },
            applyNowBtnContainer: {
                alignItems: 'center',
                borderRadius: wp(1),
                width: wp(25),
                paddingVertical: wp(1),
                backgroundColor: colors.PRIMARY,
            },
            titleText: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_13,
                color: colors.PRIMARY_TEXT,
                marginBottom: wp(2),
                maxWidth: wp(80)
            },
            subTitleText: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_12,
                color: colors.PRIMARY_TEXT,
                marginBottom: wp(2),
                maxWidth: wp(58)
            },
            imageStyle: {
                width: wp(30),
                height: wp(25),
                resizeMode: 'stretch'
            }
        })
    )
}