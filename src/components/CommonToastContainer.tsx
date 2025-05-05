import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';

interface CommonToastViewProps {
    title: string,
    containerStyle?: ViewStyle,
    txtStyle?: TextStyle,
};

const CommonToastContainer = (props: CommonToastViewProps) => {

    const GlobalStyles = useGlobalStyles();

    return (
        <View style={[GlobalStyles.bottomToastContainer, props.containerStyle]}>
            <Text style={[GlobalStyles.bottomToastText, props.txtStyle]}>{props.title}</Text>
        </View>
    );
};

export default CommonToastContainer;

const useStyles = () => {
    return StyleSheet.create({

    });
};
