import React from 'react';
import { useAppSelector } from '../redux/Store';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import BottomSheet, { BottomSheetProps } from '@gorhom/bottom-sheet';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

interface CustomBottomSheetProps {
    children?: React.ReactNode,
    containerStyle?: ViewStyle,
};

const CustomBottomSheet = React.forwardRef((props: CustomBottomSheetProps & BottomSheetProps, ref: any) => {

    const Styles = useStyles();

    return (
        <BottomSheet
            {...props}
            ref={ref}
            backgroundStyle={[Styles.backgroundStyle, props.backgroundStyle]}
            keyboardBehavior={props.keyboardBehavior ? props.keyboardBehavior : 'interactive'}
            keyboardBlurBehavior={props.keyboardBlurBehavior ? props.keyboardBlurBehavior : 'restore'}
            style={[Styles.sheetContainerStyle, props.style]}
            handleIndicatorStyle={[Styles.handleIndicatorStyle, props.handleIndicatorStyle]}
        >
            <View style={[Styles.containerStyle, props.containerStyle]}>
                {props.children}
            </View>
        </BottomSheet>
    );
})

export default CustomBottomSheet;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            containerStyle: {
                flex: 1,
                backgroundColor: colors.SECONDARY_BACKGROUND,
                paddingHorizontal: wp(5),
                paddingVertical: wp(2),
            },
            sheetContainerStyle: {
                shadowColor: colors.SHADOW_2,
                shadowOpacity: Platform.OS == "ios" ? 0.3 : 1,
                shadowRadius: 10,
                shadowOffset: { height: 0, width: 0 },
                elevation: 15,
                minHeight: wp(30)
            },
            backgroundStyle: {
                borderRadius: wp(6),
                backgroundColor: colors.SECONDARY_BACKGROUND
            },
            handleIndicatorStyle: {
                width: wp(20),
                backgroundColor: colors.SHEET_INDICATOR
            }
        })
    );
};
