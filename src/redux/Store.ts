import logger from 'redux-logger';
import { persistStore, persistReducer } from 'redux-persist';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommonSlice from './CommonSlice';
import AuthSlice from './slice/authSlice/AuthSlice';
import HomeSlice from './slice/homeSlice/HomeSlice';
import storage from 'redux-persist/lib/storage';
import RideSlice from './slice/rideSlice/RideSlice';
import ContactSlice from './slice/contactSlice/ContactSlice';
import ChatSlice from './slice/chatSlice/ChatSlice';
import NotificationSlice from './slice/notificationSlice/NotificationSlice';
import SettingSlice from './slice/SettingSlice/SettingSlice';
import ReferralSlice from './slice/referralSlice/ReferralSlice';
import PaymentSlice from './slice/paymentSlice/PaymentSlice';

const persistConfig = {
    key: 'root',
    storage: AsyncStorage
};

const reducers = combineReducers({
    CommonSlice: CommonSlice,
    AuthSlice: AuthSlice,
    HomeSlice: HomeSlice,
    RideSlice: RideSlice,
    ContactSlice: ContactSlice,
    ChatSlice: ChatSlice,
    NotificationSlice: NotificationSlice,
    SettingSlice: SettingSlice,
    ReferralSlice: ReferralSlice,
    PaymentSlice: PaymentSlice,
});

export const USER_LOGOUT = 'USER_LOGOUT'
const rootReducer = (state: any, action: any) => {
    if (action.type == USER_LOGOUT) {
        storage.removeItem('persist:root')
        return reducers(undefined, action)
    }
    return reducers(state, action)
}

const persistedReducer = persistReducer({ ...persistConfig, blacklist: ['CommonSlice'] }, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => __DEV__ ?
        getDefaultMiddleware({
            serializableCheck: false
        }).concat(logger) : getDefaultMiddleware()
})

export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch: () => AppDispatch = useDispatch;
