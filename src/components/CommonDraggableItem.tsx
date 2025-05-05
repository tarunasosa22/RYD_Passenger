import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { useAppSelector } from '../redux/Store';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Fonts } from '../styles/Fonts';
import { FontSizes } from '../styles/FontSizes';
import { DestinationsProps } from '../redux/slice/homeSlice/HomeSlice';

interface CommonDraggableItemProps {
    icon: ImageSourcePropType,
    item: DestinationsProps,
    iconStyle?: ImageStyle,
    textStyle?: TextStyle,
};

const CommonDraggableItem = (props: CommonDraggableItemProps & TouchableOpacityProps) => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const Styles = useStyles();

    return (
        <TouchableOpacity
            {...props}
            style={[Styles.draggableContainerStyle, props.style]}>
            <Image source={props.icon} style={[Styles.iconStyle, props.iconStyle]} />
            <Text numberOfLines={1} style={[Styles.draggableLocationTxtStyle, props.textStyle]}>{props.item?.address ?? `${props.item?.latitude}, ${props.item?.longitude}`}</Text>
        </TouchableOpacity>
    );
};

export default CommonDraggableItem;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            draggableContainerStyle: {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                padding: wp(3),
                paddingVertical: wp(4)
            },
            draggableLocationTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                marginHorizontal: wp(2),
                flex: 1,
                textAlign: 'left'
            },
            iconStyle: {
                tintColor: colors.PRIMARY_ICON,
                width: wp(6),
                height: wp(6),
                resizeMode: 'contain'
            }
        })
    );
};
