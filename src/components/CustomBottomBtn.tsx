import React from 'react';
import { StyleSheet, TouchableOpacityProps, View, ViewStyle } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import CustomPrimaryButton, { CustomPrimaryButtonProps } from './CustomPrimaryButton';

interface CustomBottomBtnProps {
    containerStyle?: ViewStyle,
    bottomComponent?: React.ReactNode
};

const CustomBottomBtn = (props: CustomBottomBtnProps & CustomPrimaryButtonProps & TouchableOpacityProps) => {

    const GlobalStyle = useGlobalStyles();

    return (
        <View style={[GlobalStyle.bottomBtnContainerStyle, props.containerStyle]}>
            <CustomPrimaryButton
                {...props}
                title={props.title}
                style={[GlobalStyle.bottomBtnStyle, props.style]}
                txtStyle={props.txtStyle}
            />
            {props.bottomComponent}
        </View>
    );
};

export default CustomBottomBtn;

const useStyles = () => {
    return (
        StyleSheet.create({})
    );
};
