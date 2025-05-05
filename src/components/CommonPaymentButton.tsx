import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppSelector } from '../redux/Store';
import { Icons } from '../utils/IconsPaths';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FontSizes } from '../styles/FontSizes';
import { Fonts } from '../styles/Fonts';

interface CommonPaymentButtonProps {
    title: string;
    containerStyle?: ViewStyle;
    titleStyle?: TextStyle;
    leftIconStyle?: ImageStyle;
    rightIconStyle?: ImageStyle;
    leftIcon?: ImageSourcePropType;
    rightIcon?: ImageSourcePropType;
    label?: string;
    labelTxtStyle?: TextStyle;
};

const CommonPaymentButton = (props: CommonPaymentButtonProps & TouchableOpacityProps) => {

    const Globalstyle = useGlobalStyles();
    const Styles = useStyle();

    return (
        <>
            {props.label ?
                <Text style={[Styles.labelTxtStyle, props.labelTxtStyle]}>{props.label}</Text> : null
            }
            <TouchableOpacity {...props} style={[Globalstyle.rowContainer, Styles.buttonContainer, props.style]}>
                <View style={[Globalstyle.rowContainer, {
                    flex: 1,
                }]}>
                    {props.leftIcon ?
                        <Image source={props.leftIcon} style={[Styles.leftIconStyle, props.leftIconStyle]} />
                        : null
                    }
                    <Text style={[Globalstyle.subTitleStyle, Styles.titleStyle, props.titleStyle]}>{props.title}</Text>
                </View>
                <Image source={props.rightIcon ? props.rightIcon : Icons.UPARROW} style={[Styles.rightIconStyle, !props.rightIcon ? { transform: [{ rotate: '90deg' }], } : null, props.rightIconStyle]} />
            </TouchableOpacity>
        </>
    );
};

export default CommonPaymentButton;

const useStyle = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const Globalstyle = useGlobalStyles();

    return StyleSheet.create({
        labelTxtStyle: {
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
            marginTop: wp(3)
        },
        buttonContainer: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            padding: wp(4),
            borderRadius: wp(2),
            borderColor: colors.BOX_BORDER,
            borderWidth: 1,
            marginVertical: wp(2),
            justifyContent: 'space-between',
            paddingVertical: wp(3)
        },
        leftIconStyle: {
            width: wp(6),
            height: wp(6),
            resizeMode: 'contain',
            tintColor: colors.SECONDARY_ICON,
        },
        rightIconStyle: {
            width: wp(4),
            height: wp(4),
            resizeMode: 'contain',
            tintColor: colors.SECONDARY_ICON,
        },
        titleStyle: {
            ...Globalstyle.subTitleStyle,
            fontFamily: Fonts.FONT_POP_REGULAR,
            marginLeft: wp(6)
        }
    });
};
