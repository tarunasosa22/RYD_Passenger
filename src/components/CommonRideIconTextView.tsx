import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppSelector } from '../redux/Store';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FontSizes } from '../styles/FontSizes';
import { Fonts } from '../styles/Fonts';

interface CommonRideIconTextViewProps {
    icon: ImageSourcePropType,
    title: string,
    containerStyle?: ViewStyle,
    iconStyle?: ImageStyle,
    txtStyle?: TextStyle,
    subTxtStyle?: TextStyle
    adjustsFontSizeToFit?: boolean
};

const CommonRideIconTextView = (props: CommonRideIconTextViewProps) => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const { colors } = useAppSelector((state) => state.CommonSlice);

    return (
        <View style={[GlobalStyle.rowContainer, props.containerStyle]}>
            <Image source={props.icon} style={[Styles.iconStyle, props.iconStyle]} />
            <Text numberOfLines={2} style={[Styles.titleTxtStyle, props.txtStyle]} adjustsFontSizeToFit={props?.adjustsFontSizeToFit}>{props.title}
            </Text>
        </View>
    );
};

export default CommonRideIconTextView;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        iconStyle: {
            tintColor: colors.PRIMARY,
            width: wp(5),
            height: wp(5),
            resizeMode: 'contain'
        },
        titleTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_14,
            color: colors.PRIMARY_TEXT,
            marginHorizontal: wp(1.5),
            maxWidth: wp(22)
        },
        subTitleTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_8,
            color: colors.SECONDARY_TEXT,
        }
    });
};
