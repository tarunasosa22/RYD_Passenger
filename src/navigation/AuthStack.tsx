import React from 'react';
import SendOtpScreen from '../screens/auth/SendOtpScreen';
import { AuthStackParamList } from '../types/RootStackType';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import UserDetailsScreen from '../screens/auth/UserDetailsScreen';
import { useAppSelector } from '../redux/Store';
import EmergencyContactScreen from '../screens/home/EmergencyContactScreen';

const Auth = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {

    const { userDetail, tokenDetail } = useAppSelector(state => state.AuthSlice)

    return (
        <Auth.Navigator screenOptions={{ headerShown: false }}
            initialRouteName={(tokenDetail?.authToken && !userDetail?.name) ? 'UserDetailsScreen' : 'SendOtpScreen'}
        >
            <Auth.Screen name={'SendOtpScreen'} component={SendOtpScreen} />
            <Auth.Screen name={'OtpVerificationScreen'} component={OtpVerificationScreen} />
            <Auth.Screen name={'UserDetailsScreen'} component={UserDetailsScreen} />
            <Auth.Screen name={'EmergencyContactScreen'} component={EmergencyContactScreen} />
        </Auth.Navigator>
    );
};

export default AuthStack;
