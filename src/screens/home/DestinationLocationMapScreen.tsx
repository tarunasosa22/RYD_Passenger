import React, { useEffect, useRef, useState } from 'react';
import { Image, NativeModules, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommonDraggableDashView from '../../components/CommonDraggableDashView';
import CommonDraggableItem from '../../components/CommonDraggableItem';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import CustomIconButton from '../../components/CustomIconButton';
import CustomMapContainer from '../../components/CustomMapContainer';
import { useCustomMapStyle } from '../../hooks/useCustomMapStyles';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import { Icons } from '../../utils/IconsPaths';
import { ChangeLocationProps, DestinationsProps, onChangePickUpLocation, setAppliedCoupon, setBookingDestinations, setFilteredDestinations } from '../../redux/slice/homeSlice/HomeSlice';
import { geoCoderAddress } from '../../utils/HelperFunctions';
import MapView, { Details, Region } from 'react-native-maps';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAP_API } from '../../config/Host';
import { AppAlert } from '../../utils/AppAlerts';
import { restActiveRideDetailsData, riderActiveRide } from '../../redux/slice/rideSlice/RideSlice';
import { RegionDeltaProps } from './TrackDriverScreen';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { color } from 'react-native-reanimated';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import CustomPrimaryButton from '../../components/CustomPrimaryButton';
import { useLanguage } from '../../context/LanguageContext';
import { useRoute } from '@react-navigation/native';

const { StatusBarManager } = NativeModules;

interface LocationCoordinatesTypes {
    state?: string | undefined;
    id?: string
    address?: string,
    latitude?: number | string,
    longitude?: number | string,
};

interface MapRegionChangeTypes {
    regionChange: boolean,
    coordinate?: LocationCoords | undefined
};
interface LocationCoords {
    latitude: number,
    longitude: number
};

const DestinationLocationMapScreen = () => {

    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const route = useRoute();
    const CustomMapStyle = useCustomMapStyle();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { userCordinates, code } = useAppSelector(state => state.AuthSlice);
    const { destinations } = useAppSelector(state => state.HomeSlice);
    const navigation = useCustomNavigation("DestinationLocationMapScreen");
    const dispatch = useAppDispatch();
    const mapRef = useRef<MapView>(null);
    const googlePlacesRef = useRef<GooglePlacesAutocompleteRef>(null);
    const [mapRegionChange, setMapRegionChange] = useState<MapRegionChangeTypes>({
        regionChange: false,
        coordinate: undefined
    })
    const [locationInputFeildCoordinate, setLocationInputFeildCoordinate] = useState<LocationCoordinatesTypes | undefined>(undefined);
    const [userRegionDelta, setUserRegionDelta] = useState<RegionDeltaProps>({ latitudeDelta: 0.015, longitudeDelta: 0.0121 });
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const { t } = useTranslation();
    const { locale } = useLanguage()
    const isDeliveryModule = route?.params?.isDeliveryModule ?? false

    useEffect(() => {
        if (destinations?.length !== 0) {
            const data = destinations[destinations?.length - 1]
            setTimeout(() => {
                mapRef.current?.animateToRegion({
                    latitude: data?.latitude,
                    longitude: data?.longitude,
                    latitudeDelta: userRegionDelta.latitudeDelta ?? 0.015,
                    longitudeDelta: userRegionDelta.longitudeDelta ?? 0.0121,
                }, 1000)
            }, 100);
        }
    }, [destinations])

    useEffect(() => {
        dispatch(riderActiveRide(null)).unwrap()
            .then((res) => { })
            .catch((error) => {
                console.log("🚀 ~ file: HomeScreen.tsx:75 ~ useEffect ~ error:", error)
            })
        return () => {
            dispatch(restActiveRideDetailsData())
            setMapRegionChange({
                regionChange: false,
                coordinate: undefined
            })
        }
    }, []);

    const removeItem = (id: string | undefined) => {
        const destinationDataArray = destinations?.filter((item, index) => item?.id != id);
        dispatch(setFilteredDestinations(destinationDataArray))
    };

    const addLocation = (location: {
        id: string;
        address: string | undefined;
        state: string | undefined;
        latitude: number | undefined;
        longitude: number | undefined;
    }) => {
        googlePlacesRef.current?.clear()
        const tempDestinationData = [...destinations]
        const findLocation = tempDestinationData.find((item) => ((item?.latitude == location?.latitude) && (item.longitude == location.longitude)))
        let newData: any = {
            id: Math.random().toFixed(3).toString(),
            address: location?.address,
            latitude: location?.latitude,
            longitude: location?.longitude,
            state: location?.state
        }
        if (!findLocation) {
            if (isDeliveryModule) {
                tempDestinationData[1] = newData;
            } else {
                tempDestinationData.push(newData)
            }
        } else {
            AppAlert(t(TranslationKeys.warning), t(TranslationKeys.location_already_added), () => { }, () => { })
        }
        dispatch(setFilteredDestinations(tempDestinationData))
        setLocationInputFeildCoordinate(undefined)
        if (mapRegionChange.regionChange) {
            setMapRegionChange({
                regionChange: false,
                coordinate: undefined
            })
        }
    };

    const swapLocation = (item: DestinationsProps, index: number) => {
        const tempDestinationData = [...destinations]
        swapElements(tempDestinationData, index, index - 1)
        dispatch(setFilteredDestinations([...tempDestinationData]))
    };

    const swapElements = (array: DestinationsProps[], index1: number, index2: number) => {
        const temp = array[index1];
        array[index1] = array[index2];
        array[index2] = temp;
    };

    const calculateDistance = (coordinate1: LocationCoords, coordinate2: LocationCoords) => {
        const { latitude: lat1, longitude: lon1 } = coordinate1;
        const { latitude: lat2, longitude: lon2 } = coordinate2;

        const R = 6371; // Radius of the Earth in kilometers
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c * 1000; // Distance in meters

        return distance;
    };

    const toRad = (value: number) => {
        return (value * Math.PI) / 180;
    };

    const renderItem = ({ item, getIndex, drag, isActive }: RenderItemParams<DestinationsProps>) => {
        const bottomComponentVisible = (((isDeliveryModule ? destinations.length <= 1 : destinations.length <= 6) || getIndex() != destinations.length - 1) && !isActive)
        return (
            <>
                <View style={[Styles.dragItemListContainerStyle, {
                }]}>
                    <CommonDraggableItem
                        onLongPress={drag}
                        disabled={isActive}
                        item={item}
                        icon={getIndex() == 0 ? Icons.ROUND_LOCATION_ICON : Icons.LOCATION_MARKER_ICON}
                        iconStyle={{ tintColor: getIndex() == 0 ? colors.SECONDARY_ICON : colors.SECONDARY }}
                        textStyle={{ textAlign: 'left' }}
                        onPress={() => {
                            if (getIndex() === 0) {
                                const params: ChangeLocationProps = {
                                    openPickUpLocation: true,
                                    resetDestinationDate: false,
                                    location: item
                                }
                                dispatch(onChangePickUpLocation(params))
                                navigation.navigate('DrawerStack', {
                                    screen: "HomeScreen",
                                })
                            }
                        }}
                    />
                    {!isActive && (getIndex() !== 0) ?
                        <CustomIconButton
                            onPress={() => {
                                if (item?.id) {
                                    removeItem(item?.id)
                                }
                            }} icon={Icons.CLOSE_ICON}
                            style={{
                                padding: wp(1),
                            }}
                            iconStyle={Styles.closeIconStyle} />
                        :
                        null
                    }
                </View>
                {bottomComponentVisible ?
                    <CommonDraggableDashView
                        dashGap={3}
                        dashLength={6}
                        dashThickness={2.5}
                    />
                    : null
                }
                {bottomComponentVisible ?
                    <View style={Styles.itemSepratorLine} />
                    : null
                }
                {
                    getIndex() !== 0 && selectedIndex == null ?
                        <TouchableOpacity activeOpacity={1} onPress={() => {
                            const index = getIndex()
                            if (index) {
                                swapLocation(item, index)
                            }
                        }} style={[Styles.swapIconContainerStyle, Styles.swapIconShadowStyle]}>
                            <Image source={Icons.SWAP_ARROW_ICON} style={Styles.swapIconStyle} />
                        </TouchableOpacity>
                        :
                        null
                }
            </>
        );
    };

    const setLocationCoords = (latitude: number, longitude: number) => {
        geoCoderAddress({ lat: latitude, lng: longitude }).then((res) => {
            const locationObj = {
                id: Math.random().toFixed(3).toString(),
                address: res?.address,
                latitude: latitude,
                longitude: longitude,
                state: res?.state
            }
            setLocationInputFeildCoordinate(locationObj)
        }).catch(() => {
            setMapRegionChange({
                regionChange: false,
                coordinate: undefined
            })
        })
    };


    const getStateFromAddressComponents = (addressComponents: any) => {
        // Loop through the address components to find the "administrative_area_level_1"
        const stateComponent = addressComponents.find(
            (component: any) => component.types.includes('administrative_area_level_1')
        );
        return stateComponent ? stateComponent.long_name : null; // You can use `short_name` if needed
    };

    return (
        <SafeAreaView edges={['top']} style={GlobalStyle.container}>
            <View style={Styles.headerContainer}>
                <CustomIconButton
                    onPress={() => {
                        if (!mapRegionChange.regionChange) {
                            navigation.goBack()
                        } else {
                            setMapRegionChange({
                                regionChange: false,
                                coordinate: undefined
                            })
                            const data = destinations[destinations.length - 1]
                            mapRef.current?.animateToRegion({
                                latitude: data?.latitude,
                                longitude: data?.longitude,
                                latitudeDelta: userRegionDelta.latitudeDelta ?? 0.015,
                                longitudeDelta: userRegionDelta.longitudeDelta ?? 0.0121,
                            })
                        }
                    }} icon={!mapRegionChange.regionChange ? Icons.LEFT_ARROW_ICON : Icons.CLOSE_ICON} iconStyle={!mapRegionChange.regionChange ? GlobalStyle.commonIconStyle : {
                        width: wp(5),
                        height: wp(5),
                        resizeMode: 'contain'
                    }}
                    iconStyle={{ transform: [{ rotate: locale ? '180deg' : '0deg' }] }}
                />
                {!mapRegionChange.regionChange ? <Text style={Styles.destinationTxtStyle}>{t(TranslationKeys.destination)}</Text> : null}
            </View>
            {!mapRegionChange.regionChange ?
                <View style={Styles.draggableListContainerStyle}>
                    <DraggableFlatList
                        data={destinations}
                        onDragEnd={({ data }) => {
                            setSelectedIndex(null)
                            dispatch(setFilteredDestinations([...data]))
                        }}
                        keyExtractor={(item, index) => item?.id ?? index.toString()}
                        renderItem={renderItem}
                        onDragBegin={(index) => {
                            setSelectedIndex(index)
                        }}
                        keyboardShouldPersistTaps={'handled'}
                        showsVerticalScrollIndicator={false}
                        style={Styles.draggableContainerListStyle}
                        // ListHeaderComponent={
                        //     <View>
                        //         <CommonDraggableItem
                        //             icon={Icons.ROUND_LOCATION_ICON}
                        //             iconStyle={{ tintColor: colors.SECONDARY_ICON }}
                        //             item={destinations?.filter((item, index) => index == 0)[0]}
                        //             disabled={false}
                        //             onPress={() => {
                        //                 const params: ChangeLocationProps = {
                        //                     openPickUpLocation: true,
                        //                     resetDestinationDate: false,
                        //                     location: destinations?.filter((item, index) => index == 0)[0]
                        //                 }
                        //                 dispatch(onChangePickUpLocation(params))
                        //                 navigation.navigate('DrawerStack', {
                        //                     screen: "HomeScreen",
                        //                 })
                        //             }}
                        //         />
                        //         <CommonDraggableDashView
                        //             dashGap={3}
                        //             dashLength={6}
                        //             dashThickness={2.5}
                        //         />
                        //         <View style={Styles.itemSepratorLine} />
                        //     </View>
                        // }
                        ListFooterComponent={
                            (destinations?.length >= 7 || (isDeliveryModule && destinations?.length >= 2)) ?
                                null :
                                <View
                                    style={Styles.draggableContainerStyle}>
                                    <GooglePlacesAutocomplete
                                        placeholder={t(TranslationKeys.enter_location)}
                                        onPress={(data, details = null) => {
                                            const addressComponents = details?.address_components;
                                            const state = getStateFromAddressComponents(addressComponents);
                                            const address = {
                                                id: Math.random().toFixed(3).toString(),
                                                address: details?.formatted_address,
                                                latitude: details?.geometry.location.lat,
                                                longitude: details?.geometry.location.lng,
                                                state: state
                                            }
                                            if (address.latitude && address.longitude) {
                                                mapRef.current?.animateToRegion({
                                                    latitude: address?.latitude,
                                                    longitude: address?.longitude,
                                                    latitudeDelta: userRegionDelta.latitudeDelta ?? 0.015,
                                                    longitudeDelta: userRegionDelta.longitudeDelta ?? 0.0121,
                                                })
                                            }
                                            // setLocationCordinates(address)
                                            setLocationInputFeildCoordinate(address)
                                            addLocation(address)
                                            googlePlacesRef.current?.clear()
                                            googlePlacesRef.current?.blur()
                                        }}
                                        renderLeftButton={() => {
                                            return (
                                                <Image source={Icons.LOCATION_MARKER_ICON} style={{ tintColor: colors.SECONDARY, width: wp(6), height: wp(6), resizeMode: 'contain' }} />
                                            )
                                        }}
                                        keepResultsAfterBlur={true}
                                        isRowScrollable={false}
                                        styles={{
                                            listView: Styles.googleTextInputListView,
                                            description: Styles.googleTextInputDescription,
                                            textInputContainer: Styles.googleTextInputContainer,
                                            textInput: Styles.searchLocationTextInputStyle,
                                        }}
                                        fetchDetails={true}
                                        textInputProps={{
                                            clearButtonMode: 'never',
                                            onChangeText: (text) => setLocationInputFeildCoordinate({
                                                address: text,
                                            }),
                                            placeholderTextColor: colors.SECONDARY_TEXT,
                                            value: locationInputFeildCoordinate?.address,
                                            autoFocus: true
                                        }}
                                        enablePoweredByContainer={false}
                                        onFail={(e) => {
                                            console.log({ e });
                                        }}
                                        query={{
                                            key: store.getState().AuthSlice.commonCredentialsData?.googleApiKey,
                                            language: 'en',
                                            components: `country:${code}`,
                                        }}
                                    />
                                </View>
                        }
                    />
                </View>
                :
                (locationInputFeildCoordinate?.address || locationInputFeildCoordinate?.latitude && locationInputFeildCoordinate.longitude) ? <View style={Styles.destinationMainContainer}>
                    <View style={[Styles.destinationContainer, Styles.destinationContainerBackShadow]}>
                        <Text numberOfLines={2} style={Styles.destinationContainerTxtStyle}>{locationInputFeildCoordinate?.address ?? `${locationInputFeildCoordinate?.latitude},${locationInputFeildCoordinate?.longitude}`}</Text>
                    </View>
                </View>
                    : null
            }
            <Image source={Icons.MAP_MARKER_PIN_ICON} style={Styles.mapMarkerCenterPinImage} />
            <CustomMapContainer
                ref={mapRef}
                region={{
                    longitude: destinations[0]?.longitude ?? 72.88746321772949,
                    latitude: destinations[0]?.latitude ?? 21.23814020005119,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.0121,
                }}
                toolbarEnabled={false}
                onRegionChangeComplete={(region: Region, details: Details) => {
                    const { latitude, longitude, latitudeDelta, longitudeDelta } = region
                    if (mapRegionChange.regionChange) {

                        setLocationCoords(latitude, longitude)
                        setMapRegionChange({
                            regionChange: true,
                            coordinate: {
                                latitude: latitude,
                                longitude: longitude,
                            }
                        })
                    } else {
                        setMapRegionChange({
                            regionChange: false,
                            coordinate: undefined
                        })
                    }
                    setUserRegionDelta({
                        latitudeDelta: latitudeDelta,
                        longitudeDelta: longitudeDelta
                    })
                }}
                onRegionChange={(region: Region, details: Details) => {
                    const { latitude, longitude } = region
                    const newRegion = {
                        latitude: latitude,
                        longitude: longitude
                    }
                    const markerLocation = {
                        latitude: Number(destinations[destinations?.length - 1]?.latitude),
                        longitude: Number(destinations[destinations?.length - 1]?.longitude)
                    }
                    const markerDistance = calculateDistance(markerLocation, newRegion);
                    if (newRegion === markerLocation || markerDistance <= 50) {
                        setMapRegionChange({
                            regionChange: false,
                            coordinate: undefined
                        })
                    } else {
                        setMapRegionChange({
                            regionChange: true,
                            coordinate: undefined
                        })
                    }
                }}
                onPress={(e: any) => {
                    //tap on marker and getlocation
                    if (destinations?.length >= 7) {
                        AppAlert(t(TranslationKeys.warning), t(TranslationKeys.you_cannot_select_more_than_location))
                    } else {
                        const { latitude, longitude } = e.nativeEvent.coordinate
                        mapRef.current?.animateToRegion({
                            latitude: latitude,
                            longitude: longitude,
                            latitudeDelta: userRegionDelta.latitudeDelta ?? 0.015,
                            longitudeDelta: userRegionDelta.longitudeDelta ?? 0.0121,
                        }, 1000)
                    }
                }}>
                {/* {locationCordinates ?
                    <CustomUserMarkerView
                        coordinate={{
                            latitude: Number(locationCordinates?.latitude),
                            longitude: Number(locationCordinates?.longitude),
                        }}
                    />
                    : null
                } */}
            </CustomMapContainer>
            <CustomPrimaryButton
                disabled={mapRegionChange.regionChange ? false : !mapRegionChange.regionChange && destinations?.length >= 2 ? false : true}
                style={[GlobalStyle.bottomBtnStyle, GlobalStyle.bottomBtnContainerStyle, Styles.locationContainer, {
                    backgroundColor: mapRegionChange.regionChange ? colors.PRIMARY : !mapRegionChange.regionChange && destinations?.length >= 2 ? colors.PRIMARY : colors.DISABLE_BUTTON
                }]}
                onPress={() => {
                    if (mapRegionChange.regionChange) {
                        if (destinations?.length >= 7) {
                            AppAlert(t(TranslationKeys.warning), t(TranslationKeys.you_cannot_select_more_than_location), () => {
                                setMapRegionChange({
                                    regionChange: false,
                                    coordinate: undefined
                                })
                            }, () => { })

                        }
                        else {
                            if ((locationInputFeildCoordinate && locationInputFeildCoordinate?.id))
                                addLocation({
                                    address: locationInputFeildCoordinate?.address,
                                    id: locationInputFeildCoordinate?.id,
                                    latitude: Number(locationInputFeildCoordinate?.latitude),
                                    longitude: Number(locationInputFeildCoordinate?.longitude),
                                    state: locationInputFeildCoordinate?.state
                                })
                        }
                    } else {
                        const { riderActiveRideDetails } = store.getState().RideSlice
                        if (riderActiveRideDetails?.id) {
                            AppAlert(t(TranslationKeys.active_ride_found), t(TranslationKeys.please_complete_the_active_ride_frist), () => {
                                navigation.navigate("DrawerStack", {
                                    screen: 'YourRidesScreen',
                                    params: {
                                        notificationType: undefined
                                    }
                                })
                            })
                        } else {
                            dispatch(setBookingDestinations(destinations))
                            if (isDeliveryModule) {
                                navigation.navigate('DeliveryContactScreen')
                            } else {
                                dispatch(setAppliedCoupon(-1))
                                navigation.navigate('BookingScreen', { isDeliveryModule: isDeliveryModule })
                            }
                        }
                    }
                }}
                title={mapRegionChange.coordinate ? t(TranslationKeys.confirm_destination) : t(TranslationKeys.confirm_location)} />
        </SafeAreaView>
    )
}

export default DestinationLocationMapScreen;

const useStyles = () => {

    const GlobalStyles = useGlobalStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { locale } = useLanguage()

    return (
        StyleSheet.create({
            headerContainer: {
                width: '100%',
                paddingHorizontal: wp(5),
                paddingVertical: wp(3),
                position: 'absolute',
                marginTop: Platform.OS == "ios" ? StatusBarManager.HEIGHT : 0,
                zIndex: 5,
                alignItems: 'center',
                flexDirection: 'row'
            },
            mapContainer: {
                flex: 1
            },
            draggableContainerStyle: {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                padding: wp(3),
                paddingTop: wp(4),
                paddingBottom: wp(4)
            },
            dottedView: {
                width: 1,
                height: wp(8.5),
                flexDirection: 'column',
                position: 'absolute',
                left: wp(5.7),
                top: wp(10)
            },
            itemSepratorLine: {
                backgroundColor: colors.SEPARATOR_LINE,
                height: wp(0.4),
                width: "84%",
                alignSelf: 'center',
                marginLeft: wp(7),
                borderRadius: wp(2)
            },
            draggableLocationTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                marginHorizontal: wp(2),
                flex: 1
            },
            swapIconContainerStyle: {
                height: wp(10),
                width: wp(10),
                backgroundColor: colors.SECONDARY_BACKGROUND,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: wp(11),
                position: 'absolute',
                borderWidth: wp(0.5),
                zIndex: 1
            },
            swapIconShadowStyle: {
                borderColor: colors.SEPARATOR_LINE,
                right: wp(15),
                top: wp(-5),
                shadowColor: colors.SHADOW_1,
                shadowOpacity: 0.9,
                shadowRadius: 10,
                shadowOffset: { height: 0, width: 0 },
                elevation: 15,
            },
            swapIconStyle: {
                width: wp(4.5),
                height: wp(4.5),
                resizeMode: 'contain',
                tintColor: colors.SECONDARY
            },
            draggableListContainerStyle: {
                backgroundColor: colors.TRANSPARENT,
                flex: 1,
                position: 'absolute',
                width: '100%',
                marginTop: StatusBarManager.HEIGHT + (Platform.OS == "android" ? hp(2.5) : hp(5)),
                zIndex: 6,
                paddingHorizontal: wp(5)
                // maxHeight: "37.3%"
            },
            destinationTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_15,
                color: colors.PRIMARY_TEXT,
                marginHorizontal: wp(4)
            },
            listContainerStyle: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                marginHorizontal: wp(5),
                marginTop: wp(2),
                borderRadius: wp(3),
            },
            locationMarkerIconStyle: {
                tintColor: colors.PRIMARY,
                width: wp(6),
                height: wp(6),
                resizeMode: 'contain'
            },
            closeIconStyle: {
                ...GlobalStyles.commonIconStyle,
                width: wp(3.5),
                height: wp(3.5),
                resizeMode: 'contain',
                tintColor: colors.SECONDARY
            },
            dragItemListContainerStyle: {
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: wp(5.5)
            },
            googleTextInputListView: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                alignSelf: 'center',
                width: "100%",
                paddingLeft: wp(5),
            },
            googleTextInputDescription: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                color: colors.PRIMARY_TEXT,
                fontSize: FontSizes.FONT_SIZE_14,
            },
            googleTextInputContainer: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                color: colors.PRIMARY_LIGHT_BACKGROUND,
                height: wp(6),
                alignItems: "center",
                overflow: 'hidden'
            },
            searchLocationTextInputStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                marginTop: wp(1),
                textAlign: locale ? 'right' : 'left'
            },
            addIconStyle: {
                width: wp(4),
                height: wp(4),
                tintColor: colors.PRIMARY_ICON,
                resizeMode: 'contain'
            },
            mapMarkerCenterPinImage: {
                width: 40,
                height: 45,
                resizeMode: 'contain',
                position: 'absolute',
                alignSelf: 'center',
                marginVertical: hp(40.3),
                zIndex: 5,
                tintColor: colors.GREEN_ICON
            },
            destinationContainerBackShadow: {
                shadowColor: colors.SHADOW_2,
                shadowOpacity: Platform.OS == "ios" ? 0.1 : 1,
                shadowRadius: 3,
                shadowOffset: { height: 0, width: 0 },
                elevation: 5,
            },
            destinationMainContainer: {
                backgroundColor: colors.TRANSPARENT,
                position: 'absolute',
                width: '100%',
                marginTop: StatusBarManager.HEIGHT + (Platform.OS == "android" ? hp(2.5) : hp(5)),
                zIndex: 6,
            },
            destinationContainer: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                marginHorizontal: wp(5),
                marginTop: Platform.OS == "ios" ? wp(1) : wp(-5),
                padding: wp(3),
                borderRadius: wp(3)
            },
            destinationContainerTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.PRIMARY_TEXT
            },
            draggableContainerListStyle: {
                backgroundColor: colors.SECONDARY_BACKGROUND,
                borderRadius: wp(3),
                elevation: 15,
                shadowRadius: 10,
                shadowOpacity: 0.9,
                shadowColor: colors.SHADOW_1,
                shadowOffset: { height: 2, width: 0 },
                marginBottom: wp(2),
            },
            locationContainer: {
                position: 'absolute',
                alignSelf: 'center',
                bottom: wp(0),
                marginBottom: wp(2),
                width: wp(90),
                height: wp(16),
            }
        })
    );
};