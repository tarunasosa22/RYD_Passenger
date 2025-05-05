import { Platform, StyleSheet } from "react-native"
import { Fonts } from "../styles/Fonts";
import { useAppSelector } from "../redux/Store";
import { FontSizes } from "../styles/FontSizes";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";

export const useGlobalStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.PRIMARY_BACKGROUND
        },
        centerContainer: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        rowContainer: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        commonIconStyle: {
            width: wp(6),
            height: wp(6),
            resizeMode: 'contain',
            tintColor: colors.SECONDARY_ICON
        },
        mainTitleStyle: {
            fontSize: FontSizes.FONT_SIZE_24,
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
            color: colors.PRIMARY_TEXT,
        },
        subTitleStyle: {
            fontSize: FontSizes.FONT_SIZE_14,
            fontFamily: Fonts.FONT_POP_REGULAR,
            color: colors.PRIMARY_TEXT,
            textAlign: 'left'
        },
        primaryBtnStyle: {
            backgroundColor: colors.PRIMARY,
            paddingVertical: wp(3),
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: wp(2),
            marginVertical: wp(5),
        },
        commonBtnStyle: {
            marginHorizontal: wp(5),
        },
        bottomBtnContainerStyle: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            paddingHorizontal: wp(6),
            paddingVertical: wp(5),
            elevation: 15,
            shadowRadius: 10,
            shadowOpacity: 0.2,
            shadowColor: colors.SHADOW_2,
            shadowOffset: { height: 0, width: 0 },
        },
        bottomBtnStyle: {
            backgroundColor: colors.PRIMARY,
            paddingVertical: wp(3),
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: wp(2),
        },
        bottomToastContainer: {
            marginBottom: hp(5),
            backgroundColor: colors.SECONDARY_SHADOW_COLOR,
            padding: wp(2.5),
            borderRadius: wp(3),
            borderColor: colors.SHADOW_1,
            borderWidth: 1
        },
        bottomToastText: {
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT
        },
    });
};
