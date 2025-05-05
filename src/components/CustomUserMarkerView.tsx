import React from 'react';
import { ImageSourcePropType, ImageStyle, StyleSheet } from 'react-native';
import { MapMarker, MapMarkerProps, Marker } from 'react-native-maps';
import Animated from 'react-native-reanimated';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAppSelector } from '../redux/Store';
import { Icons } from '../utils/IconsPaths';

interface CustomUserMarkerViewProps {
    iconImage?: ImageSourcePropType,
    iconStyle?: ImageStyle
};

const getCenterOffsetForAnchor = (
    anchor: { x: number, y: number },
    markerWidth: number,
    markerHeight: number,
): { x: number, y: number } => ({
    x: markerWidth * 0.5 - markerWidth * anchor.x,
    y: markerHeight * 0.5 - markerHeight * anchor.y,
});

/** Marker's width */
const MARKER_WIDTH = wp(10);
/** Marker's height */
const MARKER_HEIGHT = wp(10); // marker height

/** Customizable anchor prop - Specify your desired anchor adjustements here */
const ANCHOR = { x: 0.5, y: 0.5 };  // in my case I customized this based on marker dimensions like this: { x: 0.5, y: 1 - 10 / MARKER_HEIGHT } lifting the marker up a bit
/** auto generated centerOffset prop based on the anchor property */
const CENTEROFFSET = getCenterOffsetForAnchor(
    ANCHOR,
    MARKER_WIDTH,
    MARKER_HEIGHT,
);

const CustomUserMarkerView = React.forwardRef((props: MapMarkerProps & CustomUserMarkerViewProps, ref: React.Ref<MapMarker> | undefined) => {

    const Styles = useStyles();

    return (
        <Marker.Animated
            {...props}
            ref={ref}
            anchor={ANCHOR}
            centerOffset={CENTEROFFSET}
        >
            <Animated.Image source={props.iconImage ? props.iconImage : Icons.MAP_MARKER_PIN_ICON} style={[Styles.iconStyle, props.iconStyle]} />
        </Marker.Animated>
    );
});

export default CustomUserMarkerView;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return (
        StyleSheet.create({
            iconStyle: {
                width: wp(10),
                height: wp(10),
                resizeMode: 'contain',
                tintColor: colors.PRIMARY
            },
        })
    );
};
