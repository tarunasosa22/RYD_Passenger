import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, FlatList, Text, Alert, ActivityIndicator, } from 'react-native';
import CommonRideDetailsContainer from '../../components/CommonRideDetailsContainer';
import CustomContainer from '../../components/CustomContainer';
import CustomHeader from '../../components/CustomHeader';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { RideBookingListDetailsTypes, RideBookingListProps, deleteRideBooking, rideBookingList, showActiveRideModalReducer } from '../../redux/slice/rideSlice/RideSlice';
import { useIsFocused } from '@react-navigation/native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { PICK_UP_MODE, RIDE_STATUS, RIDE_TYPE } from '../../utils/Constats';
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { lightThemeColors } from '../../styles/Colors';
import TopTabBar from '../../components/CustomTopBar';
import { AppAlert } from '../../utils/AppAlerts';

export interface RideListApiCallProps {
    offset: number,
    pickup_mode?: string,
    status?: string,
};

interface TabsProps {
    title: string
};

const PreBookScreen = () => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const navigation = useCustomNavigation('DrawerStack');
    const dispatch = useAppDispatch();
    const { rideBookingData, isLoading, riderActiveRideDetails, showActiveRideModal } = useAppSelector(state => state.RideSlice);
    const flatlistref = useRef(null);
    const [offset, setOffset] = useState<number>(0)
    const focus = useIsFocused();
    const [expandMore, setExpandMore] = useState<number | null>(null);
    const { t } = useTranslation();
    const [isFooterLoading, setIsFooterLoading] = useState(false)
    const [rideList, setRideList] = useState<RideBookingListProps>(rideBookingData)
    const [tabIndex, setTabIndex] = useState<number>(0);
    const Tabs: TabsProps[] = [
        { title: t(TranslationKeys.requested) },
        { title: t(TranslationKeys.completed) },
    ];

    useEffect(() => {
        if (focus) {
            const params: RideListApiCallProps = {
                offset: offset,
                pickup_mode: PICK_UP_MODE.LATER,
                // status: `${RIDE_STATUS.CREATED},${RIDE_STATUS.DRIVER_ALLOCATED}`
                status: tabIndex == 0 ? `${RIDE_STATUS.CREATED}` : RIDE_STATUS.COMPLETED,
            }
            rideBookingListApi(params)
            if (!riderActiveRideDetails || Object.entries(riderActiveRideDetails).length === 0) {
                dispatch(showActiveRideModalReducer({
                    ...showActiveRideModal,
                    visibleModal: false
                }))
            }
        }
        else {
            setOffset(0)
            setRideList({ count: 0, results: [] })
        }
    }, [focus])

    const rideBookingListApi = (params: RideListApiCallProps) => {
        dispatch(rideBookingList(params)).unwrap()
            .then((res) => {
                setRideList(res)
                setIsFooterLoading(false)
                setOffset(res?.next ? params.offset + 10 : 0)
            })
            .catch((error) => {
                setIsFooterLoading(false)
                console.log("🚀 ~ file: YourRidesScreen.tsx:302 ~ rideBookingListApi ~ error:", error)
            })
    };

    const renderItem = ({ item, index }: { item: RideBookingListDetailsTypes, index: number }) => {
        return (
            <CommonRideDetailsContainer
                type={RIDE_TYPE.PREBOOKED}
                data={item} flatlistref={flatlistref}
                index={index}
                expandMore={expandMore}
                setExpandMore={setExpandMore}
                onCancelPress={() => cancelFindDriverApi(item.id)}
            />
        );
    };

    const handleTabPress = (index: number) => {
        setTabIndex(index)
        setOffset(0)
        let params: RideListApiCallProps = {
            offset: 0,
            pickup_mode: PICK_UP_MODE.LATER,
            status: index == 0 ? `${RIDE_STATUS.CREATED}` : RIDE_STATUS.COMPLETED,
        }
        // if (index !== 1) {
        //     delete params.pickup_mode
        // }
        rideBookingListApi(params)
    };


    const cancelFindDriverApi = (id: any) => {

        AppAlert(
            `${t(TranslationKeys['warning!!'])}`,
            `${t(TranslationKeys.are_you_sure_you_want_to_delete)}?`,
            () => {
                if (id) {
                    dispatch(deleteRideBooking(id)).unwrap().then(res => {
                        const params: RideListApiCallProps = {
                            offset: offset,
                            pickup_mode: PICK_UP_MODE.LATER,
                            // status: `${RIDE_STATUS.CREATED},${RIDE_STATUS.DRIVER_ALLOCATED}`
                            status: tabIndex == 0 ? `${RIDE_STATUS.CREATED}` : RIDE_STATUS.COMPLETED,
                        }
                        rideBookingListApi(params)
                        if (!riderActiveRideDetails || Object.entries(riderActiveRideDetails).length === 0) {
                            dispatch(showActiveRideModalReducer({
                                ...showActiveRideModal,
                                visibleModal: false
                            }))
                        }
                    }).catch(e => console.log({ e }))
                }
            },
            () => { }
        );
    };

    return (
        <View style={GlobalStyle.container}>
            {(isLoading && !isFooterLoading) ? <CustomActivityIndicator /> : null}
            <CustomHeader title={t(TranslationKeys.pre_booked)}
                onPress={() => {
                    // console.log('navigation-->', navigation?.getId())
                    // if (navigation?.getId() === "DrawerStack") {
                    //     navigation.openDrawer()
                    // } else {
                    //     navigation.goBack()
                    // }
                    try {
                        navigation.openDrawer()
                    } catch (error: any) {
                        Alert.alert(t(TranslationKeys.warning), error.toString())
                    }
                }} />
            <CustomContainer>
                <TopTabBar containerStyle={{
                    marginBottom: wp(5)
                }} tabs={Tabs} activeTab={tabIndex} onTabPress={handleTabPress} />
                <FlatList
                    ref={flatlistref}
                    nestedScrollEnabled
                    data={rideList?.results}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() => {
                        return (
                            isFooterLoading &&
                            <ActivityIndicator style={{ margin: wp(5) }} color={lightThemeColors.PRIMARY} />
                        );
                    }}
                    onEndReached={() => {
                        if (rideList?.next && !isLoading) {
                            const params: RideListApiCallProps = {
                                offset: offset,
                                pickup_mode: PICK_UP_MODE.LATER,
                                status: `${RIDE_STATUS.CREATED},${RIDE_STATUS.DRIVER_ALLOCATED}`
                            }
                            setIsFooterLoading(true)
                            rideBookingListApi(params)
                        }
                    }}
                    bounces={false}
                    ListEmptyComponent={
                        <View style={Styles.emptyContainerStyle}>
                            <Text style={Styles.emptyTxtStyle}>{t(TranslationKeys.pre_booked_ride_data_not_found)}</Text>
                        </View>
                    }
                />
            </CustomContainer>
        </View>
    );
};

export default PreBookScreen;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        emptyContainerStyle: {
            marginVertical: hp(40),
            alignItems: "center",
            justifyContent: 'center'
        },
        emptyTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_15,
            color: colors.PRIMARY_TEXT
        }
    });
};
