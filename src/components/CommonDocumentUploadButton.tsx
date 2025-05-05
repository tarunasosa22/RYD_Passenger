import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppSelector } from '../redux/Store';
import { Icons } from '../utils/IconsPaths';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FontSizes } from '../styles/FontSizes';
import { Fonts } from '../styles/Fonts';
import { useLanguage } from '../context/LanguageContext';

interface CommonDocumentUploadButtomProps {
    title: string;
    containerStyle?: ViewStyle;
    titleStyle?: TextStyle;
    iconStyle?: ImageStyle;
    source?: ImageSourcePropType;
    label?: string;
    labelTxtStyle?: TextStyle;
};

const CommonDocumentUploadButton = (props: CommonDocumentUploadButtomProps & TouchableOpacityProps) => {

    const Globalstyle = useGlobalStyles();
    const Styles = useStyle();
    const { locale } = useLanguage()

    return (
        <>
            {props.label ?
                <Text style={[Styles.labelTxtStyle, props.labelTxtStyle, { textAlign: 'left' }]}>{props.label}</Text> : null
            }
            <TouchableOpacity {...props} style={[Globalstyle.rowContainer, Styles.buttonContainer, props.style]}>
                <Text style={[Globalstyle.subTitleStyle, Styles.titleStyle, props.titleStyle]}>{props.title}</Text>
                <Image source={props.source ? props.source : Icons.DOWN_ARROW_ICON} style={[Styles.iconStyle, !props.source ? { transform: [{ rotate: locale ? '450deg' : '630deg' }], } : null, props.iconStyle]} />
            </TouchableOpacity>
        </>
    );
};

export default CommonDocumentUploadButton;

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
            paddingHorizontal: wp(3),
            paddingVertical: wp(4),
            paddingLeft: wp(4),
            borderRadius: wp(2),
            borderColor: colors.BOX_BORDER,
            borderWidth: 1,
            marginVertical: wp(2),
            justifyContent: 'space-between',
        },
        iconStyle: {
            width: wp(5),
            height: wp(5),
            resizeMode: 'contain',
            tintColor: colors.SECONDARY_ICON
        },
        titleStyle: {
            ...Globalstyle.subTitleStyle,
            fontFamily: Fonts.FONT_POP_REGULAR
        }
    });
};
