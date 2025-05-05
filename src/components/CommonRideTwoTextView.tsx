import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppSelector } from '../redux/Store';
import { Fonts } from '../styles/Fonts';
import { FontSizes } from '../styles/FontSizes';
import { ViewStyle } from 'react-native';

interface CommonRideTwoTextViewProps {
    title: string,
    subTitle: string | undefined,
    containerStyle?: ViewStyle
};

const CommonRideTwoTextView = (props: CommonRideTwoTextViewProps) => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const { colors } = useAppSelector((state) => state.CommonSlice);

    return (
        <View style={[GlobalStyle.rowContainer, Styles.spaceBetweenView, props.containerStyle]}>
            <Text style={Styles.dateAndTimeTxtStyle}>{props.title}</Text>
            <Text style={Styles.dateTxtStyle}>{props.subTitle}</Text>
        </View>
    );
};

export default CommonRideTwoTextView;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        spaceBetweenView: {
            justifyContent: 'space-between'
        },
        dateAndTimeTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_12,
            color: colors.SECONDARY_TEXT
        },
        dateTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_12,
            color: colors.SECONDARY_TEXT
        },
    });
};
