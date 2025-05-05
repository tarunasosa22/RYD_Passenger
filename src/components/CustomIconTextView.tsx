import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAppSelector } from '../redux/Store';
import { Fonts } from '../styles/Fonts';
import { FontSizes } from '../styles/FontSizes';
import CustomIconButton from './CustomIconButton';

interface CustomIconTextViewProps {
    title: string,
    txtStyle?: TextStyle,
    rightIconStyle?: ImageStyle,
    rightIcon?: ImageSourcePropType,
    leftIconStyle?: ImageStyle,
    leftIcon?: ImageSourcePropType,
    subContainerStyle?: ViewStyle,
    onCloseIcon?: () => void
};

const CustomIconTextView = (props: CustomIconTextViewProps & TouchableOpacityProps) => {

    const Styles = useStyles();

    return (
        <TouchableOpacity {...props} style={[Styles.mainContainer, props.style]}>
            <View style={[Styles.subContainer, props.subContainerStyle]}>
                {props.leftIcon ?
                    <Image
                        source={props.leftIcon}
                        style={[Styles.leftIconStyle, props.leftIconStyle]} />
                    :
                    null}
                <Text numberOfLines={1} style={[Styles.txtStyle, props.txtStyle]}>{props.title}</Text>
            </View>
            {props.rightIcon ?
                <CustomIconButton onPress={props.onCloseIcon} icon={props.rightIcon} iconStyle={{ ...Styles.rightIconStyle, ...props.rightIconStyle }} />
                :
                null
            }
        </TouchableOpacity>
    );
};

export default CustomIconTextView;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)

    return (
        StyleSheet.create({
            txtStyle: {
                flex: 1,
                marginLeft: wp(3),
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                minWidth: wp(20),
                textAlign: 'left'
            },
            mainContainer: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                padding: wp(3),
                alignItems: 'center',
                flexDirection: 'row',
                borderRadius: wp(3),
                justifyContent: "space-between",
                marginVertical: wp(1.5)
            },
            subContainer: {
                flexDirection: 'row',
                flex: 1,
                alignItems: 'center'
            },
            rightIconStyle: {
                height: wp(4),
                width: wp(4),
                tintColor: colors.SECONDARY_ICON,
                resizeMode: 'contain'
            },
            leftIconStyle: {
                height: wp(5.5),
                width: wp(5.5),
                tintColor: colors.PRIMARY,
                resizeMode: 'contain'
            },
        })
    );
};
