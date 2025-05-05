import React, { memo } from 'react';
import { Fonts } from '../styles/Fonts';
import { useAppSelector } from '../redux/Store';
import { FontSizes } from '../styles/FontSizes';
import { StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';

export interface CustomPrimaryButtonProps {
    txtStyle?: TextStyle,
    title: String
};

const CustomPrimaryButton = (props: CustomPrimaryButtonProps & TouchableOpacityProps) => {

    const Styles = useStyles();

    return (
        <TouchableOpacity {...props}>
            <Text numberOfLines={1} style={[Styles.btnTitleStyle, props.txtStyle]}>{props.title}</Text>
        </TouchableOpacity>
    );
};

export default memo(CustomPrimaryButton);

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            btnTitleStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.BUTTON_TEXT
            },
        })
    );
};
