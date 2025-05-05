import React, { useEffect, useState } from 'react';
import HomeScreen from '../screens/home/HomeScreen';
import { DrawerStackParamList } from '../types/RootStackType';
import { createDrawerNavigator } from '@react-navigation/drawer';
import EditProfileScreen from '../screens/utils/EditProfileScreen';
import NotificationScreen from '../screens/utils/NotificationScreen';
import HelpCenter from '../screens/utils/HelpCenterScreen';
import PrivacyPolicy from '../screens/utils/PrivacyPolicy';
import CustomDrawerItem, { DrawerItems } from '../components/CustomDrawerItem';
import EmergencyContactScreen from '../screens/home/EmergencyContactScreen';
import { useAppDispatch, useAppSelector } from '../redux/Store';
import YourRidesScreen from '../screens/utils/YourRidesScreen';
import PreBookScreen from '../screens/utils/PreBookScreen';
import { ChangeLocationProps, onChangePickUpLocation, resetDestinations } from '../redux/slice/homeSlice/HomeSlice';
import ReferAndEarnScreen from '../screens/utils/ReferAndEarnScreen';
import WithDrawalsScreen from '../screens/utils/WithDrawalsScreen';
import ScratchCouponScreen from '../screens/utils/ScratchCouponScreen';
import DeliveryHomeScreen from '../screens/utils/DeliveryHomeScreen';


const Drawer = createDrawerNavigator<DrawerStackParamList>();

const DrawerStack = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)
    const { userDetail } = useAppSelector(state => state.AuthSlice)
    const [currentScreen, setcurrentScreen] = useState(0);
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(resetDestinations())
        const params: ChangeLocationProps = {
            openPickUpLocation: false,
            resetDestinationDate: true,
            location: undefined
        }
        dispatch(onChangePickUpLocation(params))
    }, [])

    return (
        <Drawer.Navigator initialRouteName='HomeScreen'
            id='DrawerStack'
            screenListeners={{
                focus: (preProps) => {
                    let scrName = preProps?.target?.split("-")[0]
                    let screen = DrawerItems.find((item) => item.screenName == scrName);
                    if (!!screen && Object.keys(screen).length != 0) {
                        setcurrentScreen(screen.id);
                    }
                }
            }}
            screenOptions={{
                unmountOnBlur: true,
                headerShown: false, drawerStyle: {
                    backgroundColor: colors.PRIMARY_BACKGROUND,
                },
                swipeEnabled: userDetail?.name ? true : false,
                drawerType: 'front'
            }} drawerContent={(props) => <CustomDrawerItem {...props} currentScreen={currentScreen} />}>
            <Drawer.Screen name={'HomeScreen'} component={HomeScreen} />
            <Drawer.Screen name={'EditProfile'} component={EditProfileScreen} />
            <Drawer.Screen name={'Notification'} component={NotificationScreen} />
            <Drawer.Screen name={'YourRidesScreen'} component={YourRidesScreen} />
            <Drawer.Screen name={'PreBookScreen'} component={PreBookScreen} />
            <Drawer.Screen name={'ReferAndEarnScreen'} component={ReferAndEarnScreen} />
            <Drawer.Screen name={'WithDrawalsScreen'} component={WithDrawalsScreen} />
            <Drawer.Screen name={'HelpCenter'} component={HelpCenter} />
            <Drawer.Screen name={'PrivacyPolicy'} component={PrivacyPolicy} />
            <Drawer.Screen name={'EmergencyContactScreen'} component={EmergencyContactScreen} />
            <Drawer.Screen name={'LogOut'} component={HomeScreen} />
            <Drawer.Screen name={'DeleteAccountScreen'} component={HomeScreen} />
            <Drawer.Screen name={'ScratchCouponScreen'} component={ScratchCouponScreen} />
            <Drawer.Screen name={'DeliveryHomeScreen'} component={DeliveryHomeScreen} />
        </Drawer.Navigator>
    );
};

export default DrawerStack;
