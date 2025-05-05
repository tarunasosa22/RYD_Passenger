import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View, Image, TouchableOpacity, Modal, LayoutAnimation } from 'react-native';
import { Icons } from '../../utils/IconsPaths';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
import CustomIconTextView from '../../components/CustomIconTextView';
import CustomHeader from '../../components/CustomHeader';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import CustomContainer from '../../components/CustomContainer';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import { RootStackParamList } from '../../types/RootStackType';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { LocationTypes, addSavePlace, filterSavePlacesReducer, removeSavePlace, resetSavedLocation, savePlacesList, setFilteredDestinations } from '../../redux/slice/homeSlice/HomeSlice';
import { AppAlert } from '../../utils/AppAlerts';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import { Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAP_API } from '../../config/Host';
import CustomMapContainer from '../../components/CustomMapContainer';
import MapView, { Details, Region } from 'react-native-maps';
import CustomIconButton from '../../components/CustomIconButton';
import { geoCoderAddress } from '../../utils/HelperFunctions';
import { hasNotch } from 'react-native-device-info';
import { setAdjustPan, setAdjustResize } from 'rn-android-keyboard-adjust';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import CustomPrimaryButton from '../../components/CustomPrimaryButton';
import { useLanguage } from '../../context/LanguageContext';

interface SavaDataProps {
    id: number,
    address: string,
    latitude: number,
    longitude: number
};

interface paramsType {
    offset: number
}

export interface LocationDeltaType {
    latitudeDelta: number,
    longitudeDelta: number,
};


const SavedPlaceScreen = () => {

    const navigation = useCustomNavigation('SavedPlaceScreen');
    type NestedScreenRouteProp = RouteProp<RootStackParamList, 'SavedPlaceScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const dispatch = useAppDispatch();

    const { colors } = useAppSelector(state => state.CommonSlice);
    const type = route?.params?.type;
    const locations = route?.params?.locations;
    const { userCordinates, code } = useAppSelector(state => state.AuthSlice);
    const focus = useIsFocused();
    const { t } = useTranslation();
    const { locale } = useLanguage()

    // const [savedLocationsList, setSavedLocationsList] = useState<SavaDataProps[] | []>()
    const [selectedSavedLocation, setSelectedSavedLocation] = useState<SavaDataProps | undefined>(undefined);
    const [offset, setOffset] = useState<number>(0);
    const { isLoading, savePlaceListData } = useAppSelector(state => state.HomeSlice);
    const [isOpenGoogleMapModal, setIsOpenGoogleMapModal] = useState<boolean>(false);
    const [locationInputFeildCoordinate, setLocationInputFeildCoordinate] = useState<LocationTypes | undefined>(userCordinates);
    const [isShowCancelLocation, setIsShowCancelLocation] = useState<boolean>();
    const [locationDelta, setLocationDelta] = useState<LocationDeltaType>({
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
    })
    const mapRef = useRef<MapView>(null);
    const [addSavePlaceBtnVisible, setAddSavePlaceBtnVisible] = useState<boolean>(false);
    const isDeliveryModule = route?.params?.isDeliveryModule ?? false

    useEffect(() => {
        if (focus) {
            setAdjustResize()
            const params = {
                offset: offset,
            }
            savePlaceApiCall(params)
        }
        return () => {
            setSelectedSavedLocation(undefined)
            dispatch(resetSavedLocation())
            setOffset(0)
            setAdjustPan()
        }
    }, [focus])

    useEffect(() => {
        setIsShowCancelLocation(locationInputFeildCoordinate?.address ? true : false)
    }, [locationInputFeildCoordinate])

    useEffect(() => {
        if (userCordinates?.latitude && userCordinates.longitude) {
            setOriginLocationCoords(Number(userCordinates.latitude), Number(userCordinates.longitude))
        }
        setIsShowCancelLocation(locationInputFeildCoordinate?.address ? true : false)
    }, [userCordinates]);

    useEffect(() => {
        if (savePlaceListData.results.length !== 0) {
            setAddSavePlaceBtnVisible(true)
        } else {
            setAddSavePlaceBtnVisible(false)
        }
    }, [savePlaceListData]);

    const savePlaceApiCall = (params: paramsType) => {
        dispatch(savePlacesList(params)).unwrap().then(res => {
            setOffset(params.offset + 10)
        }).catch(e => { })
    }
    const selectItem = (item: SavaDataProps) => {
        setSelectedSavedLocation(item);
    };

    const setOriginLocationCoords = (latitude: number, longitude: number) => {
        geoCoderAddress({ lat: latitude, lng: longitude }).then((res) => {
            setLocationInputFeildCoordinate({
                id: Number(Math.random().toFixed(3)),
                address: res.address,
                latitude: latitude,
                longitude: longitude,
                state: res.state
            })
        }).catch(() => {
        })
    };

    const addSavePlaceApiCall = () => {
        const data = new FormData()
        if (locationInputFeildCoordinate && locationInputFeildCoordinate.address && locationInputFeildCoordinate.state && locationInputFeildCoordinate.longitude && locationInputFeildCoordinate.latitude) {
            data.append("latitude", locationInputFeildCoordinate.latitude);
            data.append("longitude", locationInputFeildCoordinate.longitude);
            data.append("address", locationInputFeildCoordinate.address);
            data.append("state", locationInputFeildCoordinate.state);
        }
        dispatch(addSavePlace(data)).unwrap()
            .then(res => {
                const params = {
                    offset: 0,
                }
                savePlaceApiCall(params)
                setIsOpenGoogleMapModal(false)
            })
            .catch(error => { })
    };

    // const removeItem = (id: number) => {
    //     // remove Item
    //     const filterLocations = savedLocationsList.filter((item) => item.id !== id);
    //     setSavedLocationsList(filterLocations)
    // };

    const renderItem = ({ item }: { item: SavaDataProps }) => (
        <CustomIconTextView
            title={item.address}
            leftIcon={selectedSavedLocation?.id === item.id ? Icons.ACTIVE_RADIO_BUTTON : Icons.INACTIVE_RADIO_BUTTON} leftIconStyle={{ tintColor: colors.PRIMARY_ICON }}
            rightIcon={Icons.CLOSE_ICON}
            rightIconStyle={{ tintColor: colors.PRIMARY, paddingHorizontal: wp(2) }}
            onPress={() => selectItem(item)}
            activeOpacity={1}
            onCloseIcon={() => {
                AppAlert(
                    `${t(TranslationKeys.delete_place)}`,
                    `${t(TranslationKeys.are_you_sure_you_want_to_delete_this_place)}`,
                    () => {
                        dispatch(removeSavePlace(item.id)).unwrap().then(res => {
                            const filterData = savePlaceListData.results.filter((res) => res.id !== item.id)
                            dispatch(filterSavePlacesReducer({
                                ...savePlaceListData,
                                results: filterData
                            }))
                        }).catch(e => { })
                    },
                    () => { }
                );
            }}
        />
    );

    const itemSeparator = () => (
        <View style={Styles.itemSeparator} />
    );


    const getStateFromAddressComponents = (addressComponents: any) => {
        // Loop through the address components to find the "administrative_area_level_1"
        const stateComponent = addressComponents.find(
            (component: any) => component.types.includes('administrative_area_level_1')
        );
        return stateComponent ? stateComponent.long_name : null; // You can use `short_name` if needed
    };

    return (
        <View style={GlobalStyle.container}>
            {isLoading ? <CustomActivityIndicator /> : null}
            <CustomHeader title={t(TranslationKeys.saved_places)} onPress={() => navigation.goBack()}
                headerRightComponent={
                    addSavePlaceBtnVisible ?
                        <TouchableOpacity style={[GlobalStyle.rowContainer, Styles.addNewSavePlaceButtonContainer]}
                            onPress={() => {
                                setIsOpenGoogleMapModal(true)
                            }}
                        >
                            <Image source={Icons.ADD_CIRCLE_ICON}
                                style={Styles.addNewSavePlaceButtoniconStyle}
                            />
                            <Text style={Styles.addNewSavePlaceButtonTitleText}>{t(TranslationKeys.save_Place)}</Text>
                        </TouchableOpacity> : <></>
                }
            />
            <CustomContainer style={{
                marginBottom: wp(5)
            }}>
                <View style={{ flex: 1 }}>
                    <FlatList data={savePlaceListData?.results} renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        style={Styles.listContainerStyle}
                        ItemSeparatorComponent={itemSeparator}
                        onEndReachedThreshold={0.05}
                        onEndReached={() => {
                            if (savePlaceListData?.next && !isLoading) {
                                let params: paramsType = {
                                    offset: offset,
                                }
                                savePlaceApiCall(params)
                            }
                        }}
                        ListEmptyComponent={() => {
                            return (
                                <TouchableOpacity
                                    activeOpacity={1}
                                    style={Styles.emptyListContainerStyle}
                                    onPress={() => {
                                        setIsOpenGoogleMapModal(true)
                                    }}>
                                    <Image source={Icons.ADD_CIRCLE_ICON} style={Styles.emptyIconStyle} />
                                    <Text style={Styles.emptyTxtStyle}>{t(TranslationKeys.save_destination)}</Text>
                                    <Text style={{ fontFamily: Fonts.FONT_POP_REGULAR, fontSize: FontSizes.FONT_SIZE_13, color: colors.SECONDARY_TEXT, textAlign: 'center' }}>{t(TranslationKeys.click_here_to_save_place)}</Text>
                                </TouchableOpacity>
                            )
                        }}
                    />
                </View>
            </CustomContainer>
            <CustomBottomBtn
                onPress={() => {
                    let location = []
                    if (type == "origin") {
                        const origin = {
                            ...selectedSavedLocation,
                            latitude: Number(selectedSavedLocation?.latitude),
                            longitude: Number(selectedSavedLocation?.longitude),
                            id: selectedSavedLocation?.id.toString()
                        }
                        location.push(origin)
                        dispatch(setFilteredDestinations(location))
                        navigation.navigate('DestinationLocationScreen', { isDeliveryModule: isDeliveryModule })
                    } else {
                        const tempDestinationData = [...locations]
                        const locationFound = locations.find((item) => ((item.latitude == selectedSavedLocation?.latitude) && (item.longitude == selectedSavedLocation.longitude)))
                        const destination = {
                            ...selectedSavedLocation,
                            latitude: Number(selectedSavedLocation?.latitude),
                            longitude: Number(selectedSavedLocation?.longitude),
                            id: selectedSavedLocation?.id.toString()
                        }
                        if (!locationFound) {
                            // const tempDestinationData = [...locations, destination]

                            if (isDeliveryModule) {
                                tempDestinationData[1] = destination;
                            } else {
                                tempDestinationData.push(destination)
                            }
                            location = tempDestinationData
                            dispatch(setFilteredDestinations(location))
                            navigation.navigate('DestinationLocationScreen', { isDeliveryModule: isDeliveryModule })
                        } else {
                            AppAlert(t(TranslationKeys.warning), t(TranslationKeys.selected_location_already_exist), () => { }, () => { })
                        }
                    }
                }}
                disabled={(selectedSavedLocation && savePlaceListData.results.length !== 0) ? false : true}
                style={{
                    backgroundColor: (selectedSavedLocation && savePlaceListData.results.length !== 0) ? colors.PRIMARY : colors.DISABLE_BUTTON
                }}
                title={t(TranslationKeys.confirm_location)}
            />
            {isOpenGoogleMapModal ?
                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={isOpenGoogleMapModal}
                    onRequestClose={() => setIsOpenGoogleMapModal(false)}
                >
                    {isLoading ? <CustomActivityIndicator /> : null}
                    <View style={Styles.googlePlaceAutoCompleteContainer}>
                        <CustomIconButton
                            icon={Icons.LEFT_ARROW_ICON}
                            onPress={() => setIsOpenGoogleMapModal(false)}
                            style={{ marginRight: wp(1) }}
                            iconStyle={{ transform: [{ rotate: locale ? '180deg' : '0deg' }] }}
                        />
                        <GooglePlacesAutocomplete
                            placeholder={t(TranslationKeys.enter_location_placeholder)}
                            onPress={(data, details) => {
                                const addressComponents = details?.address_components;
                                const state = getStateFromAddressComponents(addressComponents);
                                // 'details' is provided when fetchDetails = true
                                const address = {
                                    id: Number(Math.random().toFixed(3)),
                                    address: details?.formatted_address,
                                    latitude: details?.geometry?.location?.lat,
                                    longitude: details?.geometry?.location?.lng,
                                    state: state
                                }
                                if (address.latitude && address.longitude) {
                                    mapRef.current?.animateToRegion({
                                        latitude: address?.latitude,
                                        longitude: address?.longitude,
                                        latitudeDelta: locationDelta.latitudeDelta,
                                        longitudeDelta: locationDelta.longitudeDelta,
                                    }, 500)
                                }
                                setLocationInputFeildCoordinate(address)
                            }}
                            onFail={(e) => { console.log(e) }}
                            isRowScrollable={false}
                            styles={{
                                listView: Styles.googleTextInputListView,
                                description: Styles.googleTextInputDescription,
                                textInputContainer: Styles.googleTextInputContainer,
                                textInput: Styles.pickLocationTextInputStyle,
                            }}
                            fetchDetails={true}
                            textInputProps={{
                                clearButtonMode: 'never',
                                onChangeText: (text) => setLocationInputFeildCoordinate({
                                    address: text
                                }),
                                placeholderTextColor: colors.SECONDARY_TEXT,
                                value: locationInputFeildCoordinate?.address,
                            }}
                            enablePoweredByContainer={false}
                            renderRightButton={() => {
                                return (
                                    isShowCancelLocation ?
                                        <CustomIconButton icon={Icons.CLOSE_ICON} iconStyle={Styles.closeIconStyle} onPress={() => {
                                            setLocationInputFeildCoordinate(undefined)
                                        }} /> : <></>
                                )
                            }}
                            renderLeftButton={() => {
                                return (
                                    <View style={[Styles.currentLocationDotView, { marginHorizontal: 0 }]} />
                                )
                            }}
                            query={{
                                key: store.getState().AuthSlice.commonCredentialsData?.googleApiKey,
                                language: 'en',
                                components: `country:${code}`,
                            }}
                        />
                    </View>
                    <Image source={Icons.MAP_MARKER_PIN_ICON} style={Styles.mapMarkerCenterPinImage} />
                    <CustomMapContainer
                        ref={mapRef}
                        region={{
                            latitude: userCordinates?.latitude ?? 21.23814020005119,
                            longitude: userCordinates?.longitude ?? 72.88746321772949,
                            latitudeDelta: 0.015,
                            longitudeDelta: 0.0121,
                        }}
                        focusable
                        onRegionChangeComplete={(region: Region, details: Details) => {
                            const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
                            setLocationDelta({
                                latitudeDelta: region.latitudeDelta,
                                longitudeDelta: region.longitudeDelta
                            })
                            setOriginLocationCoords(latitude, longitude)
                        }}
                        onPress={(e) => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
                            const coords = {
                                latitude: e.nativeEvent.coordinate.latitude,
                                longitude: e.nativeEvent.coordinate.longitude,
                            }
                            if (coords) {
                                mapRef.current?.animateToRegion({
                                    latitude: coords?.latitude,
                                    longitude: coords?.longitude,
                                    latitudeDelta: locationDelta.latitudeDelta,
                                    longitudeDelta: locationDelta.longitudeDelta,
                                })
                            }
                            setOriginLocationCoords(coords.latitude, coords.longitude)
                        }}>
                    </CustomMapContainer>
                    <CustomPrimaryButton title={t(TranslationKeys.save_Place)} onPress={() => addSavePlaceApiCall()} style={[GlobalStyle.bottomBtnContainerStyle, GlobalStyle.bottomBtnStyle, Styles.locationContainer]} />
                </Modal> : null
            }
        </View>
    );
};

export default SavedPlaceScreen

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)
    const { locale } = useLanguage()

    return StyleSheet.create({
        itemSeparator: {
            width: "95%",
            height: wp(0.2),
            backgroundColor: colors.SHEET_INDICATOR,
            alignSelf: 'center'
        },
        listContainerStyle: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3),
        },
        emptyListContainerStyle: {
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: wp(20),
            paddingVertical: wp(4),
            marginVertical: hp(28),
        },
        emptyTxtStyle: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM
        },
        emptyIconStyle: {
            tintColor: colors.SECONDARY_ICON,
            width: wp(15),
            height: wp(15),
            resizeMode: 'contain',
            marginBottom: wp(5)
        },
        addNewSavePlaceButtonContainer: {
            backgroundColor: colors.PRIMARY_BACKGROUND,
            padding: wp(1.5),
            borderRadius: wp(2),
            borderColor: colors.PRIMARY,
            borderWidth: 2
        },
        addNewSavePlaceButtonTitleText: {
            color: colors.PRIMARY,
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_MEDIUM
        },
        addNewSavePlaceButtoniconStyle: {
            marginRight: wp(2),
            width: wp(6),
            height: wp(6),
            resizeMode: 'contain',
            tintColor: colors.PRIMARY
        },
        googleTextInputListView: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            alignSelf: 'center',
            flex: 1,
            position: 'absolute',
            top: wp(17.3),
            borderRadius: wp(3),
            borderWidth: wp(0.3),
            borderColor: colors.BOX_BORDER
        },
        googleTextInputDescription: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_14,
        },
        googleTextInputContainer: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            color: colors.PRIMARY_LIGHT_BACKGROUND,
            backgroundColor: colors.SECONDARY_BACKGROUND,
            height: wp(13),
            width: wp(85),
            paddingHorizontal: wp(4),
            borderRadius: wp(3),
            alignItems: "center",
            overflow: "hidden",
            borderWidth: wp(0.3),
            borderColor: colors.BOX_BORDER,
        },
        pickLocationTextInputStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_12,
            color: colors.PRIMARY_TEXT,
            marginTop: wp(1.5),
            textAlign: locale ? 'right' : 'left'
        },
        currentLocationDotView: {
            height: wp(3),
            width: wp(3),
            backgroundColor: colors.PRIMARY_ICON,
            borderRadius: wp(3),
            marginHorizontal: wp(3)
        },
        googlePlaceAutoCompleteContainer: {
            paddingHorizontal: wp(5),
            // position: 'absolute',
            // top: hasNotch() ? wp(15) : wp(20),
            zIndex: 1,
            flexDirection: "row",
            marginTop: hp(6),
            alignItems: "center",
            justifyContent: "center",
        },
        closeIconStyle: {
            width: wp(4),
            height: wp(4),
            resizeMode: 'contain',
            tintColor: colors.PRIMARY_ICON,
        },
        mapMarkerCenterPinImage: {
            width: 40,
            height: 45,
            resizeMode: 'contain',
            position: 'absolute',
            alignSelf: 'center',
            marginVertical: hp(40.5),
            zIndex: 5,
            tintColor: colors.GREEN_ICON
        },
        locationContainer: {
            alignSelf: 'center',
            flex: 1,
            position: 'absolute',
            bottom: wp(0),
            marginBottom: wp(2),
            width: wp(90),
        }
    })
};
