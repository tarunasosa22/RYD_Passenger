import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, FlatList, ScrollView, Text, ActivityIndicator } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CommonRideDetailsContainer from '../../components/CommonRideDetailsContainer';
import CustomContainer from '../../components/CustomContainer';
import CustomHeader from '../../components/CustomHeader';
import TopTabBar from '../../components/CustomTopBar';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { RideListApiCallProps } from './PreBookScreen';
import { RideBookingListDetailsTypes, resetRideBookingData, rideBookingList, } from '../../redux/slice/rideSlice/RideSlice';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import { DrawerStackParamList } from '../../types/RootStackType';
import { PICK_UP_MODE, RIDE_STATUS, RIDE_TYPE } from '../../utils/Constats';
import { ANALYTICS_ID } from '../../utils/AnalyticsStringID';
import analytics from '@react-native-firebase/analytics';
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../../localization/TranslationKeys';

interface TabsProps {
    title: string
};


const YourRidesScreen = () => {
    
    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const navigation = useCustomNavigation('DrawerStack');
    const [tabIndex, setTabIndex] = useState<number>(0);
    const flatlistref = useRef<FlatList<RideBookingListDetailsTypes>>(null)
    const [offset, setOffset] = useState<number>(0)
    const focus = useIsFocused();
    const dispatch = useAppDispatch();
    const [expandMore, setExpandMore] = useState<number | null>(null);
    const { isLoading, rideBookingData } = useAppSelector(state => state.RideSlice)
    type NestedScreenRouteProp = RouteProp<DrawerStackParamList, 'YourRidesScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const { t } = useTranslation();
    const notificationType = route?.params?.notificationType
    const [isFooterLoading, setIsFooterLoading] = useState(false)

    const Tabs: TabsProps[] = [
        { title: t(TranslationKeys.active) },
        { title: t(TranslationKeys.completed) },
        { title: t(TranslationKeys.cancelled) }
    ];
    useEffect(() => {
        if (focus) {
            const params: RideListApiCallProps = {
                offset: offset,
                status: tabIndex == 0 ? `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING}` : tabIndex == 1 ? RIDE_STATUS.COMPLETED : RIDE_STATUS.CANCELLED
            }
            rideBookingListApi(params)
        }
        else {
            setOffset(0)
            setTabIndex(0)
            dispatch(resetRideBookingData())
        }
    }, [focus])

    useEffect(() => {
        analytics().logEvent(ANALYTICS_ID.YOUR_RIDER_SCREEN)
    }, [])

    useEffect(() => {
        if (rideBookingData?.results?.length !== 0) {
            rideBookingData?.results[0]?.id && rideBookingData?.results[0]?.rideStatus == `${RIDE_STATUS.DRIVER_ALLOCATED}` || rideBookingData?.results[0]?.rideStatus == `${RIDE_STATUS.ONGOING}` ? setExpandMore(rideBookingData?.results[0]?.id) : setExpandMore(null)
        }
    }, [rideBookingData]);

    useEffect(() => {
        if (notificationType) {
            handleTabPress(notificationType === RIDE_STATUS.CANCELLED ? 2 : notificationType === RIDE_STATUS.COMPLETED ? 1 : 0)
        }
    }, [notificationType])

    const handleTabPress = (index: number) => {
        setTabIndex(index)
        setOffset(0)
        let params: RideListApiCallProps = {
            offset: 0,
            pickup_mode: PICK_UP_MODE.NOW,
            status: index == 0 ? `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING}` : index == 1 ? RIDE_STATUS.COMPLETED : RIDE_STATUS.CANCELLED,
        }
        if (index !== 1) {
            delete params.pickup_mode
        }
        rideBookingListApi(params)
    };

    const rideBookingListApi = (params: RideListApiCallProps) => {
        dispatch(rideBookingList(params)).unwrap()
            .then((res) => {
                setIsFooterLoading(false)
                setOffset(params.offset + 10)
            })
            .catch((error) => {
                setIsFooterLoading(false)
                console.log("🚀 ~ file: YourRidesScreen.tsx:302 ~ rideBookingListApi ~ error:", error)
            })
    };

    const renderItem = ({ item, index }: { item: RideBookingListDetailsTypes, index: number }) => {
        return (
            <CommonRideDetailsContainer
                type={RIDE_TYPE.YOURRIDES}
                data={item}
                flatlistref={flatlistref}
                index={index}
                expandMore={expandMore}
                setExpandMore={setExpandMore}
            />
        );
    };

    return (
        <View style={GlobalStyle.container}>
            {(isLoading && !isFooterLoading) ? <CustomActivityIndicator /> : null}
            <CustomHeader title={t(TranslationKeys.your_rides)}
                style={{ padding: wp(1) }}
                onPress={() => {
                    if (navigation?.getId() == "DrawerStack") {
                        navigation.openDrawer()
                    } else {
                        navigation.goBack()
                    }
                }} />
            <CustomContainer>
                <TopTabBar containerStyle={{
                    marginBottom: wp(5)
                }} tabs={Tabs} activeTab={tabIndex} onTabPress={handleTabPress} />
                {(tabIndex == 0 && rideBookingData?.results?.length !== 0) ?
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <CommonRideDetailsContainer
                            type={RIDE_TYPE.YOURRIDES}
                            data={rideBookingData?.results[0]}
                            expandMore={expandMore}
                            setExpandMore={setExpandMore}
                        />
                    </ScrollView>
                    :
                    <FlatList
                        ref={flatlistref}
                        // keyExtractor={(item) => item.id?.toString()}
                        nestedScrollEnabled
                        data={rideBookingData?.results}
                        showsVerticalScrollIndicator={false}
                        renderItem={renderItem}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={() => {
                            return (
                                isFooterLoading &&
                                <ActivityIndicator style={{ margin: wp(5) }} color={colors.PRIMARY} />
                            );
                        }}
                        onEndReached={() => {
                            if (rideBookingData?.next && !isLoading) {
                                const params: RideListApiCallProps = {
                                    offset: offset,
                                    status: tabIndex == 1 ? RIDE_STATUS.COMPLETED : RIDE_STATUS.CANCELLED
                                }
                                setIsFooterLoading(true)
                                rideBookingListApi(params)
                            }
                        }}
                        bounces={false}
                        ListEmptyComponent={
                            <View style={Styles.emptyContainerStyle}>
                                <Text style={Styles.emptyTxtStyle}>{tabIndex == 0 ? t(TranslationKeys.active) : tabIndex == 1 ? t(TranslationKeys.completed) : t(TranslationKeys.cancelled)} {t(TranslationKeys.ride_data_not_found)}</Text>
                            </View>
                        }
                    />
                }
            </CustomContainer>
        </View>
    );
};

export default YourRidesScreen;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        emptyContainerStyle: {
            marginVertical: hp(35),
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
