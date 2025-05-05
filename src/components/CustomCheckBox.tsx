import React from 'react';
import { Image, ImageStyle, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppSelector } from '../redux/Store';
import { Icons } from '../utils/IconsPaths';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FontSizes } from '../styles/FontSizes';
import { Fonts } from '../styles/Fonts';

interface CustomCheckBoxProps {
    title: string;
    value?: boolean;
    onClose?: () => void,
    closeContainerStyle?: ViewStyle,
    closeIconStyle?: ImageStyle,
    showCloseIcon?: boolean,
    titleStyle?: TextStyle,
    containerStyle?: ViewStyle,
    subTitle?: string,
    subTitleStyle?: TextStyle,
    inActiveIconStyle?: ViewStyle,
    activeIconStyle?: ImageStyle,
    rightIconVisible?: boolean,
    index?: number
    name?: string
};

const CustomCheckBox = (props: CustomCheckBoxProps & TouchableOpacityProps) => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const { colors } = useAppSelector(state => state.CommonSlice)

    return (
        <>
            {props?.name &&
                <View>
                    <Text style={Styles.name}>{props.name}</Text>
                </View>}
            <View style={[Styles.checkBoxContainerStyle, props.containerStyle]} >
                <View style={[GlobalStyle.rowContainer, Styles.containerStyle]}>
                    {props.rightIconVisible ?
                        <TouchableOpacity {...props} activeOpacity={1}>
                            {props.value ?
                                <Image source={Icons.CHECKBOX} style={[Styles.activeIconStyle, props.activeIconStyle]} />
                                :
                                <View style={[Styles.inActiveIconStyle, props.inActiveIconStyle]} />
                            }
                        </TouchableOpacity>
                        : null
                    }
                    <Text numberOfLines={1} style={[GlobalStyle.subTitleStyle, Styles.titleStyle, props.titleStyle]}>{props.title}</Text>
                    {props.subTitle ? <Text numberOfLines={1} style={[GlobalStyle.subTitleStyle, Styles.subTitleStyle, props.subTitleStyle]}>{props.subTitle}</Text> : null}
                </View>
                {props.showCloseIcon ?
                    <TouchableOpacity style={props.closeContainerStyle} onPress={props.onClose}>
                        <Image source={Icons.CLOSE_ICON} style={[Styles.closeIconStyle, props.closeIconStyle]} />
                    </TouchableOpacity>
                    :
                    null}
            </View>
        </>
    );
};

export default CustomCheckBox;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return (
        StyleSheet.create({
            containerStyle: {
                marginVertical: wp(2.7),
            },
            name: {
                fontSize: FontSizes.FONT_SIZE_15,
                fontWeight: '500',
                marginTop: wp(1),
                marginBottom: wp(-1.5),
                color: 'black'
            },
            inActiveIconStyle: {
                backgroundColor: colors.TRANSPARENT,
                borderColor: colors.BOX_BORDER,
                borderWidth: wp(0.3),
                borderRadius: wp(5),
                width: wp(6),
                height: wp(6)
            },
            activeIconStyle: {
                width: wp(6),
                height: wp(6)
            },
            titleStyle: {
                marginLeft: wp(5),
                fontSize: FontSizes.FONT_SIZE_16,
            },
            closeIconStyle: {
                width: wp(4),
                height: wp(4),
                resizeMode: 'contain',
                tintColor: colors.PRIMARY
            },
            checkBoxContainerStyle: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: "space-between"
            },
            subTitleStyle: {
                marginHorizontal: wp(1),
                fontSize: FontSizes.FONT_SIZE_16,
            }
        })
    );
};
