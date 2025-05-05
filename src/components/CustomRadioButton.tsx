import React, { memo } from 'react';
import { Image, ImageSourcePropType, ImageStyle, Pressable, PressableProps, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAppSelector } from '../redux/Store';
import { Fonts } from '../styles/Fonts';
import { FontSizes } from '../styles/FontSizes';
import { Icons } from '../utils/IconsPaths';
import { AppStrings } from '../utils/AppStrings';

export interface ContactsProps {
    id: number,
    name?: string,
    mobileNumber?: string,
    isSelected?: boolean
};

interface CustomRadioButtonProps {
    item: ContactsProps
    containerStyle?: ViewStyle,
    radioIcon?: ImageSourcePropType,
    radioIconStyle?: ImageStyle,
    labelIcon?: ImageSourcePropType,
    labelIconStyle?: ImageStyle,
    labelContainerStyle?: ViewStyle,
    title?: string,
    titleStyle?: TextStyle,
    numberTxtStyle?: TextStyle
    onPress?: () => void,
    selectedItem?: boolean,
    labelTextStyle?: TextStyle
};

const CustomRadioButton = (props: CustomRadioButtonProps & PressableProps) => {

    const Styles = useStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        <Pressable {...props} onPress={props.onPress} style={[Styles.containerStyle, props.containerStyle]}>
            <Image source={props?.selectedItem ? Icons.SELECTED_RADIO_BUTTON_ICON : Icons.RADIO_BUTTON_ICON} style={[Styles.radioIconStyle, { tintColor: colors.SECONDARY_ICON, ...props.radioIconStyle, }]} />
            {
                props.labelIcon ?
                    <Image source={props.labelIcon} style={[Styles.labelIconStyle, props.labelIconStyle]} />
                    :
                    <View style={[Styles.labelContainerStyle, props.labelContainerStyle]}>
                        <Text style={[Styles.labelTxtStyle, props.labelTextStyle]}>{props.item.name?.trim().charAt(0).toUpperCase()}</Text>
                    </View>
            }
            <Text style={[Styles.titleTxtStyle, props.titleStyle]} numberOfLines={1}>{props.item.name}</Text>
            {(props.item.mobileNumber && props.item.mobileNumber !== AppStrings.myself) ?
                <>
                    <View style={Styles.dotStyle} />
                    <Text style={[Styles.titleTxtStyle, Styles.numberTxtStyle, props.numberTxtStyle]} numberOfLines={1}>{props.item.mobileNumber}</Text>
                </>
                : null}
        </Pressable>
    );
};

export default memo(CustomRadioButton);

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            containerStyle: {
                flexDirection: 'row',
                alignItems: 'center',
                padding: wp(2),
                marginVertical: wp(1)
            },
            radioIconStyle: {
                width: wp(5),
                height: wp(5),
                resizeMode: 'contain',
            },
            labelIconStyle: {
                width: wp(4),
                height: wp(4),
                resizeMode: 'contain',
                marginHorizontal: wp(3),
                tintColor: colors.PRIMARY
            },
            labelContainerStyle: {
                width: wp(5),
                height: wp(5),
                backgroundColor: colors.SECONDARY,
                borderRadius: wp(5),
                alignItems: 'center',
                marginHorizontal: wp(2.5),
                justifyContent: 'center'
            },
            dotStyle: {
                height: wp(2),
                width: wp(2),
                backgroundColor: colors.PRIMARY,
                borderRadius: wp(5),
                marginHorizontal: wp(2)
            },
            labelTxtStyle: {
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                fontSize: FontSizes.FONT_SIZE_10,
                color: colors.PRIMARY_TEXT,
            },
            titleTxtStyle: {
                maxWidth: wp(35),
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
            },
            numberTxtStyle: {
                color: colors.SECONDARY_TEXT,
            }

        })
    );
};
