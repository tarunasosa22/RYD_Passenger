import React from 'react';
import { Fonts } from '../styles/Fonts';
import { useAppSelector } from '../redux/Store';
import { FontSizes } from '../styles/FontSizes';
import { StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';

interface CommonErrorTextProps {
    title: string,
    style?: ViewStyle
};

const CommonErrorText = (props: CommonErrorTextProps & TextStyle) => {

    const Styles = useStyles();

    return (
        <Text {...props} style={[Styles.errorTxtStyle, props.style]}>{props.title}</Text>
    );
};

export default CommonErrorText;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            errorTxtStyle: {
                color: colors.ERROR_TEXT,
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_12,
                textAlign: 'left'
            },
        })
    );
};
