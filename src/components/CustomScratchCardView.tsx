import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle, Animated } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { ImagesPaths } from '../utils/ImagesPaths'
import { useAppSelector } from '../redux/Store'
import { TranslationKeys } from '../localization/TranslationKeys'
import { useTranslation } from 'react-i18next'
import { useGlobalStyles } from '../hooks/useGlobalStyles'
import { FontSizes } from '../styles/FontSizes'
import { Fonts } from '../styles/Fonts'
import { ScratchCard } from 'rn-scratch-card'
import { setPrice } from '../utils/HelperFunctions'

interface CustomSractChCardProps {
    isScartch?: boolean,
    rewardPrice: number | undefined,
    scratchCardStyle?: ViewStyle,
    isFullscratch?: boolean
    handleScratch: (event: any) => void
}

const CustomScratchCardView = (props: CustomSractChCardProps) => {
    const Styles = useStyles()
    const GlobalStyle = useGlobalStyles()
    const { t } = useTranslation()
    const [isScratch, setIsScratch] = useState(false)

    return (
        <>

            {props?.isFullscratch ?
                <View style={Styles.container}>
                    <Image source={ImagesPaths.OFFER_ICON} style={Styles.background_view} />
                    <View style={[Styles.background_view, { top: wp(20) }]}>
                        <Text style={[GlobalStyle.subTitleStyle, { textAlign: 'center' }]}>{t(TranslationKeys.your_reward)}</Text>
                        <Text style={Styles.totalRewardtxtStyle}>{setPrice(t, props.rewardPrice)}</Text>
                    </View>
                </View>
                :
                <View style={Styles.container}>
                    <Image source={ImagesPaths.OFFER_ICON} style={Styles.background_view} />
                    <View style={[Styles.background_view, { top: wp(20) }]}>
                        <Text style={[GlobalStyle.subTitleStyle, { textAlign: 'center' }]}>{t(TranslationKeys.your_reward)}</Text>
                        <Text style={Styles.totalRewardtxtStyle}>{setPrice(t, props.rewardPrice)}</Text>
                    </View>
                    <View style={{ borderRadius: wp(5), overflow: 'hidden', backgroundColor: 'transperent' }}>
                        <ScratchCard
                            source={ImagesPaths.SCRATCH_COVER_ICON}
                            brushWidth={100}
                            onScratch={(event: any) => props.handleScratch(event)}
                            style={Styles.scratch_card}
                        />
                    </View>
                </View>
            }
        </>
    )
}

export default CustomScratchCardView

const useStyles = () => {
    const { colors } = useAppSelector(state => state.CommonSlice)
    return StyleSheet.create({
        scratch_card: {
            width: wp(60),
            height: wp(60),
            borderRadius: 10,
            // borderWidth: wp(1),
            resizeMode: 'contain',
            backgroundColor: "transparent",
            // backgroundColor: colors.WHITE_ICON
        },
        container: {
            width: wp(60),
            height: wp(60),
            backgroundColor: colors.WHITE_ICON,
            borderRadius: wp(5),
        },
        background_view: {
            position: 'absolute',
            width: wp(20),
            height: wp(20),
            marginTop: wp(3),
            alignSelf: 'center',
            borderRadius: 16,
            // backgroundColor: colors.WHITE_ICON
            backgroundColor: "transparent",
        },
        totalRewardtxtStyle: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_16,
            textAlign: 'center',
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
        }
    })
}