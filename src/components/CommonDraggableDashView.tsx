import React from 'react';
import { StyleSheet } from 'react-native';
import Dash, { DashProps } from 'react-native-dash';
import { useAppSelector } from '../redux/Store';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const CommonDraggableDashView = (props: DashProps) => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const Styles = useStyles();

    return (
        <Dash
            {...props}
            dashColor={colors.DOTTED_BORDER}
            style={Styles.dottedView}
        />
    );
};

export default CommonDraggableDashView;

const useStyles = () => {
    return (
        StyleSheet.create({
            dottedView: {
                width: 1,
                height: wp(8.5),
                flexDirection: 'column',
                position: 'absolute',
                left: wp(5.7),
                top: wp(10.5)
            },
        })
    );
};
