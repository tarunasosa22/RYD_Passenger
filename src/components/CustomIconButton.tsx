import React from 'react';
import { useAppSelector } from '../redux/Store';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Image, ImageSourcePropType, ImageStyle, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface CustomIconButtonProps {
    icon: ImageSourcePropType,
    iconStyle?: ImageStyle
};

const CustomIconButton = (props: CustomIconButtonProps & TouchableOpacityProps) => {

    const Styles = useStyle();

    return (
        <TouchableOpacity {...props}>
            <Image source={props.icon}
                style={[Styles.iconStyle, props.iconStyle]} />
        </TouchableOpacity>
    );
};

export default CustomIconButton;

const useStyle = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            iconStyle: {
                height: wp(6),
                width: wp(6),
                resizeMode: 'contain',
                tintColor: colors.SECONDARY_ICON
            },
        })
    );
};
