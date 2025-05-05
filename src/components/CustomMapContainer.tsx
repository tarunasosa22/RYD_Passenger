import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import MapView, { MapViewProps, PROVIDER_GOOGLE, } from 'react-native-maps';
import { useCustomMapStyle } from '../hooks/useCustomMapStyles';
import CustomActivityIndicator from './CustomActivityIndicator';

const CustomMapContainer = React.forwardRef((props: MapViewProps | any, ref: React.LegacyRef<MapView> | undefined) => {

    const CustomMapStyle = useCustomMapStyle();
    const Styles = useStyles();
    const [isMapReady, setIsMapReady] = useState(props?.isLoaderShow ? true : false);

    useEffect(() => {
        const timer = setTimeout(() => {
          setIsMapReady(true);
        }, 200); // 1 second delay
        return () => clearTimeout(timer);
      }, []);

      if (!isMapReady) {
        return (
          <CustomActivityIndicator />
        );
      }

    return (
        <MapView
            {...props}
            ref={ref}
            provider={PROVIDER_GOOGLE}
            style={[Styles.containerStyle, props.style]}
            customMapStyle={CustomMapStyle}
            showsCompass={false}
            toolbarEnabled={false}
            googleRenderer={'LEGACY'}
        >
            {props.children}
        </MapView>
    );
});

export default CustomMapContainer;

const useStyles = () => {

    return (
        StyleSheet.create({
            containerStyle: {
                flex: 1,
                ...StyleSheet.absoluteFillObject
                // height: Dimensions.get("window").height,
                // width: Dimensions.get("window").width
            },
        })
    );
};
