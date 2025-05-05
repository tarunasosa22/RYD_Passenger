import React from 'react';
import { Fonts } from '../styles/Fonts';
import { useAppSelector } from '../redux/Store';
import { FontSizes } from '../styles/FontSizes';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Platform, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface CustomTextInputProps {
    textInputLeftComponent?: React.ReactNode,
    textInputRightComponent?: React.ReactNode,
    textInputContainerStyle?: ViewStyle
    inputTextTitle?: string,
    titleTxtStyle?: TextStyle,
    isError?: boolean | "" | undefined
};

const CustomTextInput = (props: CustomTextInputProps & TextInputProps) => {

    const Styles = useStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        <View style={[Styles.textInputMainContainerStyle, props.textInputContainerStyle, { borderColor: props.isError ? colors.ERROR_TEXT : colors.BOX_BORDER }]}>
            {props.textInputLeftComponent}
            <TextInput
                {...props}
                placeholderTextColor={colors.SECONDARY_TEXT}
                style={[Styles.textInputContainerStyle, props.style]}
            />
            {props.textInputRightComponent}
        </View>
    );
};

export default CustomTextInput;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const { locale } = useLanguage()

    return (
        StyleSheet.create({
            textInputMainContainerStyle: {
                borderRadius: wp(2),
                flexDirection: 'row',
                borderWidth: wp(0.3),
                alignItems: 'center',
                paddingVertical: Platform.OS == "android" ? wp(1) : wp(3),
                paddingHorizontal: wp(4),
                borderColor: colors.BOX_BORDER,
                backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
            },
            textInputContainerStyle: {
                flex: 1,
                fontSize: FontSizes.FONT_SIZE_16,
                fontFamily: Fonts.FONT_POP_REGULAR,
                color: colors.PRIMARY_TEXT,
                textAlign: locale ? 'right' : 'left'
            },
        })
    );
};
