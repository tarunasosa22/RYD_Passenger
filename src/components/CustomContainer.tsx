import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const CustomContainer = ({ style, children }: ViewProps) => {

    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();

    return (
        <View style={[GlobalStyle.container, Styles.containerStyle, style]}>
            {children}
        </View>
    );
};

export default CustomContainer;

const useStyles = () => {
    return (
        StyleSheet.create({
            containerStyle: {
                paddingHorizontal: wp(5)
            }
        })
    );
};
