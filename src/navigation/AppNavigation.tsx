import React, { useEffect, useState } from 'react';
import AuthStack from './AuthStack';
import DrawerStack from './DrawerStack';
import { RootStackParamList } from '../types/RootStackType';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnBordingScreen from '../screens/onboarding/OnBordingScreen';
import DestinationLocationScreen from '../screens/home/DestinationLocationScreen';
import DestinationLocationMapScreen from '../screens/home/DestinationLocationMapScreen';
import BookingScreen from '../screens/home/BookingScreen';
import EmergencyContactScreen from '../screens/home/EmergencyContactScreen';
import TrackDriverScreen from '../screens/home/TrackDriverScreen';
import CancelTaxiScreen from '../screens/utils/CancelTaxiScreen';
import RateDriverScreen from '../screens/utils/RateDriverScreen';
import SosScreen from '../screens/utils/SosScreen';
import ChatScreen from '../screens/utils/ChatScreen';
import SavedPlacesScreen from '../screens/utils/SavedPlaceScreen';
import SearchingRiderScreen from '../screens/utils/SearchingRiderScreen';
import { getAsyncStorageData } from '../utils/HelperFunctions';
import { AppStrings } from '../utils/AppStrings';
import { USER_LOGOUT, store, useAppDispatch, useAppSelector } from '../redux/Store';
import SelectPaymentModeScreen from '../screens/utils/SelectPaymentModeScreen';
import { DeviceEventEmitter, Platform, StatusBar } from 'react-native';
import UploadDocumentScreen from '../screens/utils/UploadDocumentScreen';
import DocumentListScreen from '../screens/utils/DocumentListScreen';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import { navigationRef } from '../utils/NavigationServices';
import { setRefferedCodeReducer } from '../redux/slice/referralSlice/ReferralSlice';
import { useIsFocused } from '@react-navigation/native';
import { riderDetails, setToastData, setTokenExpire } from '../redux/slice/authSlice/AuthSlice';
import { AppAlert } from '../utils/AppAlerts';
import messaging from '@react-native-firebase/messaging';
import RideBillScreen from '../screens/utils/RideBillScreen';
import { useToast } from 'native-base';
import CommonToastContainer from '../components/CommonToastContainer';
import CustomAlertModal from '../components/CustomAlertModal';
import { TranslationKeys } from '../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';
import { setGlobalLang } from '../redux/slice/homeSlice/HomeSlice';
// import PushNotificationIOS from '@react-native-community/push-notification-ios';
import DeliveryContactScreen from '../screens/utils/DeliveryContactScreen';
import DeliveyReviewScreen from '../screens/utils/DeliveyReviewScreen';
import TelrPaymentScreen from '../screens/utils/TelrPaymentScreen';
import EditProfileScreen from '../screens/utils/EditProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigation = () => {
    const [isFirstTimeOpen, setIsFirstTimeOpen] = useState();
    const [loading, setLoading] = useState(true);
    const { userDetail, tokenDetail } = useAppSelector(state => state.AuthSlice);
    const { colors, isDarkMode } = useAppSelector(state => state.CommonSlice);
    const dispatch = useAppDispatch()
    const focus = useIsFocused()

    useEffect(() => {
        if (focus && tokenDetail?.authToken && tokenDetail.userData)
            dispatch(riderDetails(tokenDetail.userData.id)).unwrap().catch((error) => {
                if (error?.status == 401) {
                    // AppAlert(AppStrings.error, AppStrings.your_seesion_has_expired)
                    // setTimeout(() => {
                    //     store.dispatch({ type: USER_LOGOUT });
                    //     messaging().deleteToken()
                    //     setTimeout(() => {
                    //         navigationRef?.current?.reset({ index: 0, routes: [{ name: 'AuthStack' }] });
                    //     }, 200);
                    // }, 500);
                    <CustomAlertModal
                        isOpen={store.getState().AuthSlice.isTokenExpire}
                        title={t(TranslationKeys.error)}
                        subTitle={t(TranslationKeys.your_seesion_has_expired)}
                        onPressYes={() => {
                            // if (Platform.OS === 'ios') {
                            //     PushNotificationIOS.setApplicationIconBadgeNumber(0)
                            // }
                            setTimeout(() => {
                                store.dispatch({ type: USER_LOGOUT });
                                messaging().deleteToken()
                                navigationRef?.current?.reset({ index: 0, routes: [{ name: 'AuthStack' }] });
                                store.dispatch(setTokenExpire(false))
                                getAsyncStorageData(AppStrings.selected_language).then(res => {
                                    let c_code = res === null ? 'en' : res
                                    store.dispatch(setGlobalLang(c_code))
                                })
                            }, 200);

                        }} />
                    DeviceEventEmitter.emit("sessionExpired")
                }
            })
    }, [focus])

    useEffect(() => {
        getAsyncStorageData(AppStrings.is_first_time_open).then((res) => {
            setIsFirstTimeOpen(res)
            setLoading(false)
        }).catch(() => {
            setLoading(false)
        });
    }, []);

    const handleDynamicLink = async () => {
        const initialLink = await dynamicLinks().getInitialLink();
        if (initialLink) {
            const referralCode = extractRecipeIdFromLink(initialLink?.url);
            if (!userDetail?.name) {
                dispatch(setRefferedCodeReducer(referralCode))
                setTimeout(() => {
                    navigationRef?.current?.navigate('AuthStack');
                }, 500);
            }
        }
    };

    const isLinkingHandler = (initialLink: string) => {
        console.log({ initialLink })
        if (initialLink) {
            const referralCode = extractRecipeIdFromLink(initialLink);
            if (!userDetail?.name) {
                dispatch(setRefferedCodeReducer(referralCode))
                setTimeout(() => {
                    navigationRef?.current?.navigate('AuthStack');
                }, 500);
            }
        }
    };

    useEffect(() => {
        const unsubscribe = dynamicLinks().onLink(link => {
            console.log({ link })
            isLinkingHandler(link?.url);
        });
        handleDynamicLink();
        return () => unsubscribe();
    }, []);

    const extractRecipeIdFromLink = (link: any) => {
        const parts = link.split('/');
        return parts[parts.length - 1];
    };

    const toastData = store.getState().AuthSlice.toastData
    const toast = useToast();

    useEffect(() => {
        if (toastData?.isShowToast) {
            if (toastData?.message !== '') {
                toast.show({
                    duration: 2000,
                    render: () => {
                        return <CommonToastContainer title={toastData?.message} />
                    }
                });
            }

            const timeout = setTimeout(() => {
                console.log('setToast');
                dispatch(setToastData({
                    isShowToast: false,
                    message: ''
                }));
            }, 3000);

            // Cleanup the timeout if the component unmounts or `toastData?.isShowToast` changes
            return () => clearTimeout(timeout);
        }

    }, [toastData?.isShowToast])

    if (loading) {
        return null
    }
    return (
        <>
            <Stack.Navigator
                initialRouteName={isFirstTimeOpen ? userDetail?.name ? 'DrawerStack' : "AuthStack" : "OnBordingScreen"}
                screenOptions={{ headerShown: false }}>
                <Stack.Screen name={'OnBordingScreen'} component={OnBordingScreen} />
                <Stack.Screen name={'AuthStack'} component={AuthStack} />
                <Stack.Screen name={'DrawerStack'} component={DrawerStack} />
                <Stack.Screen name={'DestinationLocationScreen'} component={DestinationLocationScreen} />
                <Stack.Screen name={'DestinationLocationMapScreen'} component={DestinationLocationMapScreen} />
                <Stack.Screen name={'BookingScreen'} component={BookingScreen} />
                <Stack.Screen name={'EditProfileScreen'} component={EditProfileScreen} />
                <Stack.Screen name={'EmergencyContactScreen'} component={EmergencyContactScreen} />
                <Stack.Screen name={'TrackDriverScreen'} component={TrackDriverScreen} />
                <Stack.Screen name={'CancelTaxiScreen'} component={CancelTaxiScreen} />
                <Stack.Screen name={'RateDriverScreen'} component={RateDriverScreen} />
                <Stack.Screen name={'SearchingRiderScreen'} component={SearchingRiderScreen} />
                <Stack.Screen name={'SosScreen'} component={SosScreen} />
                <Stack.Screen name={'ChatScreen'} component={ChatScreen} />
                <Stack.Screen name={'SavedPlaceScreen'} component={SavedPlacesScreen} />
                <Stack.Screen name={'SelectPaymentModeScreen'} component={SelectPaymentModeScreen} />
                <Stack.Screen name={'UploadDocumentScreen'} component={UploadDocumentScreen} />
                <Stack.Screen name={'DocumentListScreen'} component={DocumentListScreen} />
                <Stack.Screen name={'RideBillScreen'} component={RideBillScreen} />
                <Stack.Screen name={'DeliveryContactScreen'} component={DeliveryContactScreen} />
                <Stack.Screen name={'DeliveyReviewScreen'} component={DeliveyReviewScreen} />
                <Stack.Screen name={'TelrPaymentScreen'} component={TelrPaymentScreen} />
                {/* <Stack.Screen name={'QrCodeScannerScreen'} component={QrCodeScannerScreen} /> */}
            </Stack.Navigator>
            <StatusBar translucent={false} backgroundColor={colors.PRIMARY_BACKGROUND} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            {(store.getState().AuthSlice.isTokenExpire) ?
                <CustomAlertModal
                    isOpen={store.getState().AuthSlice.isTokenExpire}
                    title={t(TranslationKeys.error)}
                    subTitle={t(TranslationKeys.your_seesion_has_expired)}
                    onPressYes={() => {
                        setTimeout(() => {
                            // if (Platform.OS === 'ios') {
                            //     PushNotificationIOS.setApplicationIconBadgeNumber(0)
                            // }
                            store.dispatch({ type: USER_LOGOUT });
                            messaging().deleteToken()
                            navigationRef?.current?.reset({ index: 0, routes: [{ name: 'AuthStack' }] });
                            store.dispatch(setTokenExpire(false))
                            getAsyncStorageData(AppStrings.selected_language).then(res => {
                                let c_code = res === null ? 'en' : res
                                store.dispatch(setGlobalLang(c_code))
                            })
                        }, 200);

                    }} /> : null}
        </>
    );
};

export default AppNavigation;