import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps, StyleSheet } from 'react-native';
import { useAppSelector } from '../redux/Store';

const CustomActivityIndicator = (props: ActivityIndicatorProps) => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const Styles = useStyles();

    return (
        <ActivityIndicator
            {...props}
            size={props.size ?? 'large'}
            color={colors.SECONDARY_BACKGROUND}
            style={Styles.indicatorStyle}
        />
    );
};

export default CustomActivityIndicator;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)

    return StyleSheet.create({
        indicatorStyle: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 999999999999999,
            backgroundColor: colors.SHADOW_2,
        }
    });
};
