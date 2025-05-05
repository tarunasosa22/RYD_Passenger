import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CommonDraggableDashView from '../../components/CommonDraggableDashView';
import CommonDraggableItem from '../../components/CommonDraggableItem';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import CustomContainer from '../../components/CustomContainer';
import CustomHeader from '../../components/CustomHeader';
import CustomIconButton from '../../components/CustomIconButton';
import CustomIconTextView from '../../components/CustomIconTextView';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { ChangeLocationProps, DestinationsProps, SavePlaceProps, onChangePickUpLocation, recentPlaceList, resetRecentList, setAppliedCoupon, setBookingDestinations, setFilteredDestinations } from '../../redux/slice/homeSlice/HomeSlice';
import { store, useAppDispatch, useAppSelector } from '../../redux/Store';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import { AppAlert } from '../../utils/AppAlerts';
import { Icons } from '../../utils/IconsPaths';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAP_API } from '../../config/Host';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { restActiveRideDetailsData, riderActiveRide } from '../../redux/slice/rideSlice/RideSlice';
import { ANALYTICS_ID } from '../../utils/AnalyticsStringID';
import analytics from '@react-native-firebase/analytics';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/RootStackType';
import CommonStepersContainer from '../../components/CommonStepersContainer';

export interface RecentLocationsProps {
    id: string,
    address?: string,
    latitude: number,
    longitude: number,
    state?: string
};

export interface DestinationProps {
    id?: string | undefined,
    address?: string | undefined,
    latitude: number,
    longitude: number,
    state?: string | undefined
};

interface ParamsTypeProps {
    offset: number,
    is_delivery_enable: boolean
};

const DestinationLocationScreen = () => {

    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const navigation = useCustomNavigation("DestinationLocationScreen");
    const dispatch = useAppDispatch();
    const { destinations } = useAppSelector(state => state.HomeSlice);
    type NestedScreenRouteProp = RouteProp<RootStackParamList, 'DestinationLocationScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const isDeliveryModule = route?.params?.isDeliveryModule ?? false
    const flatListRef = useRef<FlatList<DestinationsProps | null>>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [searchLocation, setSearchLocation] = useState<{
        id?: string,
        address?: string,
        latitude?: number,
        longitude?: number,
    } | undefined>(undefined);
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { isLoading, recentPlaceListData } = useAppSelector(state => state.HomeSlice);
    const { code } = useAppSelector(state => state.AuthSlice);
    const [offset, setOffset] = useState(0);
    const [isVisibleAddStopBtn, setIsVisibleAddStopBtn] = useState<boolean>(true);
    const { t } = useTranslation();
    const [isRecentPlaceLoading, setIsRecentPlaceLoading] = useState(false)
    const { locale } = useLanguage()

    const removeItem = (id: string) => {
        const destinationDataArray = destinations.filter((item, index) => item?.id != id);
        dispatch(setFilteredDestinations(destinationDataArray))
    };

    const recentPlaceApiCall = (params: ParamsTypeProps) => {
        dispatch(recentPlaceList(params)).unwrap().then(res => {
            setOffset(params?.offset + 10)
            setIsRecentPlaceLoading(false)
        }).catch(e => { })
    }

    useEffect(() => {
        const params = {
            offset: 0,
            is_delivery_enable: isDeliveryModule
        }
        dispatch(resetRecentList(null))
        recentPlaceApiCall(params)
        dispatch(riderActiveRide(null)).unwrap()
            .then((res) => { })
            .catch((error) => {
                console.log("🚀 ~ file: HomeScreen.tsx:75 ~ useEffect ~ error:", error)
            })
        return () => {
            // dispatch(resetDestinations())
            dispatch(restActiveRideDetailsData())
            // setOffset(0)
        }
    }, []);

    useEffect(() => {
        if (destinations.length <= 1) {
            setIsVisibleAddStopBtn(false)
        } else if (destinations.length == 2 && !isVisibleAddStopBtn) {
            setIsVisibleAddStopBtn(true)
        }
    }, [destinations]);

    // const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<DestinationsProps>) => {
    //     return (
    //         <ScaleDecorator activeScale={1}>
    //             <View style={Styles.dragItemListContainerStyle}>
    //                 <CommonDraggableItem
    //                     onLongPress={drag}
    //                     disabled={isActive}
    //                     item={item}
    //                     icon={Icons.LOCATION_MARKER_ICON}
    //                 />
    //                 {destinations?.length - 1 != getIndex() && selectedIndex != getIndex() ?
    //                     <CustomIconButton
    //                         onPress={() => {
    //                             item?.id && removeItem(item?.id)
    //                         }} icon={Icons.CLOSE_ICON}
    //                         style={{
    //                             padding: wp(1),
    //                         }}
    //                         iconStyle={Styles.closeIconStyle} />
    //                     :
    //                     null
    //                 }
    //             </View>
    //             {
    //                 destinations?.length - (destinations?.length >= 5 ? 2 : 1) != getIndex() && selectedIndex != getIndex() ?
    //                     <CommonDraggableDashView
    //                         dashGap={3}
    //                         dashLength={6}
    //                         dashThickness={2.5}
    //                     />
    //                     :
    //                     null
    //             }
    //             {
    //                 destinations?.length - (destinations?.length >= 5 ? 2 : 1) != getIndex() && selectedIndex != getIndex() ?
    //                     <View style={Styles.itemSepratorLine} />
    //                     : null
    //             }
    //         </ScaleDecorator>
    //     );
    // };

    const renderItem = ({ item, getIndex, drag, isActive }: RenderItemParams<DestinationsProps>) => {
        const bottomComponentVisible = ((!isVisibleAddStopBtn && destinations.length <= 6) || getIndex() != destinations.length - 1) && !isActive
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
                        textStyle={{ fontSize: FontSizes.FONT_SIZE_12, textAlign: 'left' }}
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
                    {(!isActive && (getIndex() !== 0)) ?
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
                    (getIndex() !== 0 && selectedIndex == null) ?
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

    const recentLocationRenderItem = ({ item, index }: { item: SavePlaceProps, index: number }) => {
        return (
            <TouchableOpacity onPress={() => {
                item?.id && addNewdestination({
                    ...item,
                    id: item?.id?.toString(),
                })
            }} style={Styles.recentLocationBtnStyle}>
                <Image source={Icons.CLOCK_WITH_ARROW_ICON} style={Styles.clockArrowIconStyle} />
                <Text numberOfLines={1} style={Styles.recentLocationTxtStyle}>{item.address}</Text>
            </TouchableOpacity>
        );
    };

    const addNewdestination = (location: RecentLocationsProps & DestinationProps) => {
        if (destinations?.length > 6) {
            AppAlert(t(TranslationKeys.warning), t(TranslationKeys.you_cannot_select_more_than_location))
        } else {
            const olddestinationData = [...destinations]
            const findLocation = olddestinationData.find((item) => ((item?.latitude == location?.latitude) && (item.longitude == location.longitude)))
            let newData = {
                id: Math.random().toFixed(3).toString(),
                address: location.address,
                latitude: location.latitude,
                longitude: location.longitude,
                state: location.state
            }
            if (!findLocation) {
                if (isDeliveryModule) {
                    olddestinationData[1] = newData;
                } else {
                    olddestinationData.push(newData)
                    setSearchLocation(undefined);
                }
            } else {
                AppAlert(t(TranslationKeys.warning), t(TranslationKeys.location_already_added), () => { }, () => { })
            }
            dispatch(setFilteredDestinations(olddestinationData))
            if (flatListRef.current && destinations.filter((item, index) => index !== 0).length > 0) {
                flatListRef.current.scrollToEnd({ animated: true });
            }
        };
    };

    const getStateFromAddressComponents = (addressComponents: any) => {
        // Loop through the address components to find the "administrative_area_level_1"
        const stateComponent = addressComponents.find(
            (component: any) => component.types.includes('administrative_area_level_1')
        );
        return stateComponent ? stateComponent.long_name : null; // You can use `short_name` if needed
    };

    return (
        <View style={GlobalStyle.container}>
            {(isLoading && !isRecentPlaceLoading) ? <CustomActivityIndicator /> : null}
            {isDeliveryModule && <CommonStepersContainer step={0} />}
            <CustomHeader
                edges={isDeliveryModule ? ["left"] : ["top"]}
                title={t(TranslationKeys.destination)}
                headerRightComponent={
                    (!isDeliveryModule && isVisibleAddStopBtn) ?
                        <TouchableOpacity style={[GlobalStyle.rowContainer, Styles.addStopButtonContainer]}
                            onPress={() => {
                                setIsVisibleAddStopBtn(false)
                            }}
                        >
                            <Image source={Icons.ADD_CIRCLE_ICON}
                                style={Styles.addStopIconStyle}
                            />
                            <Text style={Styles.addStopButtonTitleText}>{t(TranslationKeys.add_stop)}</Text>
                        </TouchableOpacity> : <></>
                }
                onPress={() => {
                    navigation.goBack()
                }}
            />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'handled'}
                onScrollEndDrag={() => {
                    if (recentPlaceListData?.next && !isRecentPlaceLoading) {
                        let params: ParamsTypeProps = {
                            offset: offset,
                            is_delivery_enable: isDeliveryModule
                        }
                        setIsRecentPlaceLoading(true)
                        recentPlaceApiCall(params)
                    }
                }}>
                <CustomContainer>
                    <View>
                        <DraggableFlatList
                            ref={flatListRef}
                            // data={destinations?.filter((item, index) => (index != 0))}
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
                                destinations?.length >= 7 ?
                                    null :
                                    !isVisibleAddStopBtn ?
                                        <View
                                            style={Styles.draggableContainerStyle}>
                                            <GooglePlacesAutocomplete
                                                placeholder={t(TranslationKeys.enter_location)}
                                                onPress={(data, details = null) => {
                                                    if (details?.geometry?.location) {
                                                        const { lat, lng } = details?.geometry?.location
                                                        if (lat && lng) {
                                                            const addressComponents = details?.address_components;
                                                            const state = getStateFromAddressComponents(addressComponents);
                                                            const address: RecentLocationsProps & DestinationProps = {
                                                                id: Math.random().toFixed(3).toString(),
                                                                address: details?.formatted_address,
                                                                latitude: lat,
                                                                longitude: lng,
                                                                state: state
                                                            };
                                                            addNewdestination(address)
                                                        }
                                                    }
                                                    // setSearchLocation(address);
                                                }}
                                                renderLeftButton={() => {
                                                    return (
                                                        <Image source={Icons.LOCATION_MARKER_ICON} style={{ tintColor: colors.SECONDARY, width: wp(6), height: wp(6), resizeMode: 'contain' }} />
                                                    )
                                                }}
                                                keepResultsAfterBlur={true}
                                                renderRightButton={() => {
                                                    return (
                                                        <View style={Styles.customIconContainerStyle}>
                                                            <CustomIconButton
                                                                style={{
                                                                    padding: wp(1)
                                                                }}
                                                                onPress={() => {
                                                                    navigation.navigate('DestinationLocationMapScreen', { isDeliveryModule: isDeliveryModule })
                                                                }}
                                                                icon={Icons.MAP_ICON} iconStyle={{ ...Styles.mapIconStyle, tintColor: colors.SECONDARY }} />

                                                        </View>
                                                    )
                                                }}
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
                                                    returnKeyType: 'route',
                                                    onChangeText: (text) => setSearchLocation({
                                                        address: text,
                                                    }),
                                                    placeholderTextColor: colors.SECONDARY_TEXT,
                                                    value: searchLocation?.address,
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
                                        </View> : null
                            }
                        />
                    </View>
                    <CustomIconTextView
                        onPress={() => {
                            if (destinations?.length >= 7) {
                                AppAlert(t(TranslationKeys.warning), t(TranslationKeys.you_cannot_select_more_than_location))
                            } else {
                                navigation.navigate('SavedPlaceScreen', {
                                    type: "destination",
                                    locations: destinations,
                                    isDeliveryModule: isDeliveryModule
                                })
                            }
                        }}
                        activeOpacity={1}
                        title={t(TranslationKeys.saved_places)}
                        leftIcon={Icons.SAVE_LOCATION_FILLED_ICON}
                        rightIcon={Icons.RIGHT_ARROW_ICON}
                        rightIconStyle={{ transform: [{ rotate: locale ? '180deg' : '0deg' }] }}
                        leftIconStyle={{ tintColor: colors.SECONDARY }}
                        onCloseIcon={() => {
                            if (destinations?.length >= 7) {
                                AppAlert(t(TranslationKeys.warning), t(TranslationKeys.you_cannot_select_more_than_location))
                            } else {
                                navigation.navigate('SavedPlaceScreen', {
                                    type: "destination",
                                    locations: destinations,
                                    isDeliveryModule: isDeliveryModule
                                })
                            }
                        }}
                    />
                    <FlatList
                        data={recentPlaceListData?.results}
                        renderItem={recentLocationRenderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[Styles.recentLocationContentContainerStyle]}
                        style={Styles.recentLocationContainerStyle}
                        onEndReachedThreshold={0.05}
                        // onEndReached={() => {
                        //     if (recentPlaceListData?.next && !isLoading) {
                        //         let params: ParamsTypeProps = {
                        //             offset: offset,
                        //         }
                        //         setIsRecentPlaceLoading(true)
                        //         recentPlaceApiCall(params)
                        //     }
                        // }}
                        ListFooterComponent={() => isRecentPlaceLoading ? <ActivityIndicator color={colors.PRIMARY} style={{ padding: wp(2) }} /> : null}
                        ListEmptyComponent={() => {
                            return (
                                <View style={Styles.emptyListContainerStyle}>
                                    <Image source={Icons.CLOCK_WITH_ARROW_ICON} style={Styles.emptyIconStyle} />
                                    <Text style={Styles.emptyTxtStyle}>{t(TranslationKeys.recent_places_not_found)}</Text>
                                </View>
                            )
                        }}
                        ItemSeparatorComponent={() => {
                            return (
                                <View style={Styles.recentLocationsItemSepratorLine} />
                            )
                        }}
                    />

                </CustomContainer>
            </ScrollView>
            <CustomBottomBtn
                disabled={destinations?.length >= 2 ? false : true}
                style={{
                    backgroundColor: destinations?.length >= 2 ? colors.PRIMARY : colors.DISABLE_BUTTON
                }}
                onPress={async () => {
                    const { riderActiveRideDetails } = store.getState().RideSlice;
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
                        await analytics().logEvent(ANALYTICS_ID.GO_TO_RIDE_BOOKING_SCREEN)
                    }
                }}
                title={t(TranslationKeys.confirm_location)}
            />
        </View>
    )
};

export default DestinationLocationScreen;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const GlobalStyles = useGlobalStyles()
    const { locale } = useLanguage()

    return (
        StyleSheet.create({
            draggableContainerStyle: {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                padding: wp(3),
                paddingTop: wp(4),
                paddingBottom: wp(4)
            },
            draggableLocationTxtStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                marginHorizontal: wp(2),
                flex: 1
            },
            customIconContainerStyle: {
                flexDirection: 'row',
                alignItems: 'center',
                width: wp(12),
                justifyContent: 'space-around',
            },
            mapIconStyle: {
                width: wp(5),
                height: wp(5),
                tintColor: colors.PRIMARY_ICON,
                resizeMode: 'contain'
            },
            addIconStyle: {
                width: wp(4),
                height: wp(4),
                tintColor: colors.PRIMARY_ICON,
                resizeMode: 'contain'
            },
            iconSepratorStyle: {
                backgroundColor: colors.SEPARATOR_LINE,
                width: wp(0.3),
                marginHorizontal: wp(2),
                height: wp(5),
            },
            itemSepratorLine: {
                backgroundColor: colors.SEPARATOR_LINE,
                height: wp(0.4),
                width: "84%",
                alignSelf: 'center',
                marginLeft: wp(7),
                borderRadius: wp(2)
            },
            recentLocationContentContainerStyle: {
                borderRadius: wp(3),
                backgroundColor: colors.SECONDARY_BACKGROUND,
                marginBottom: wp(2),
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
            recentLocationContainerStyle: {
                borderRadius: wp(3),
                backgroundColor: colors.SECONDARY_BACKGROUND,
                marginVertical: wp(2),
            },
            recentLocationBtnStyle: {
                flex: 1,
                flexDirection: 'row',
                backgroundColor: colors.SECONDARY_BACKGROUND,
                padding: wp(3),
                alignItems: 'center',
                justifyContent: "flex-start",
            },
            clockArrowIconStyle: {
                width: wp(5),
                height: wp(5),
                resizeMode: 'contain',
                tintColor: colors.SECONDARY,
            },
            recentLocationTxtStyle: {
                marginHorizontal: wp(3),
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_14,
                color: colors.PRIMARY_TEXT,
                maxWidth: wp(76),
            },
            dragItemListContainerStyle: {
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: wp(5.5)
            },
            closeIconStyle: {
                ...GlobalStyles.commonIconStyle,
                width: wp(4),
                height: wp(4),
                resizeMode: 'contain',
                tintColor: colors.SECONDARY
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
                fontSize: FontSizes.FONT_SIZE_12,
                color: colors.PRIMARY_TEXT,
                marginTop: wp(1),
                textAlign: locale ? 'right' : 'left'
            },
            recentLocationsItemSepratorLine: {
                backgroundColor: colors.SEPARATOR_LINE,
                height: wp(0.4),
                width: "92%",
                alignSelf: 'center',
                borderRadius: wp(2),
                marginVertical: wp(0.2)
            },
            emptyListContainerStyle: {
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                marginVertical: "35%"
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
            addStopButtonContainer: {
                backgroundColor: colors.PRIMARY_BACKGROUND,
                padding: wp(1.5),
                borderRadius: wp(2),
                borderColor: colors.SECONDARY,
                borderWidth: 2
            },
            addStopButtonTitleText: {
                color: colors.SECONDARY,
                fontSize: FontSizes.FONT_SIZE_12,
                fontFamily: Fonts.FONT_POP_MEDIUM
            },
            addStopIconStyle: {
                marginRight: wp(2),
                width: wp(6),
                height: wp(6),
                resizeMode: 'contain',
                tintColor: colors.SECONDARY
            },
        })
    );
};
