import React from 'react';
import { useAppSelector } from '../redux/Store';
import { StyleSheet, View, ViewProps, } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

const CustomHomeHeader = ({ children, style }: ViewProps) => {

    const Styles = useStyles();

    return (
        <View style={[Styles.containerStyle, Styles.containerShadowStyle, style]}>
            {children}
        </View>
    );
};

export default CustomHomeHeader;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            containerStyle: {
                padding: wp(4),
                borderRadius: wp(3),
                alignItems: 'center',
                flexDirection: 'row',
                marginVertical: wp(3),
                paddingHorizontal: wp(5),
                backgroundColor: colors.SECONDARY_BACKGROUND,
            },
            containerShadowStyle: {
                elevation: 15,
                shadowRadius: 10,
                shadowOpacity: 0.9,
                shadowColor: colors.SHADOW_1,
                shadowOffset: { height: 0, width: 0 },
            }
        })
    );
};
