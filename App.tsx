import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { persistor, store } from './src/redux/Store';
import AppNavigation from './src/navigation/AppNavigation';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider } from 'native-base';
import NetInfo from '@react-native-community/netinfo';
import NetworkErrorModal from './src/components/NetworkErrorModal';
import NotificationController from './src/notification/NotificationController';
import { navigationRef } from './src/utils/NavigationServices';
import SplashScreen from 'react-native-splash-screen';
import { LogBox, Platform } from 'react-native';
import SpInAppUpdates, {
  NeedsUpdateResponse,
  IAUUpdateKind,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';
import { setNetworkStatus } from './src/redux/slice/SettingSlice/SettingSlice';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import RideBillScreen from './src/screens/utils/RideBillScreen';

// import * as Sentry from "@sentry/react-native";

if (!__DEV__) {
  // Sentry.init({
  //   dsn: "https://64b1c10b541920e58a8c7f29692d1dcd@o4508165059117056.ingest.us.sentry.io/4508165857804288",
  //   // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  //   // We recommend adjusting this value in production.
  //   tracesSampleRate: 1.0,
  //   // profilesSampleRate is relative to tracesSampleRate.
  //   // Here, we'll capture profiles for 100% of transactions.
  //   profilesSampleRate: 1.0,
  // });
}

const App = () => {
  LogBox.ignoreAllLogs();
  const { networkStatus } = store?.getState().SettingSlice;
  const [connection, setConnection] = useState<boolean | undefined>(
    networkStatus ?? false,
  );

  const inAppUpdates = new SpInAppUpdates(
    false, // isDebug
  );
  if (!__DEV__) {
    try {
      inAppUpdates.checkNeedsUpdate().then(result => {
        if (result.shouldUpdate && Platform.OS === 'android') {
          let updateOptions: StartUpdateOptions = {};
          if (Platform.OS === 'android') {
            // android only, on iOS the user will be prompted to go to your app store page
            updateOptions = {
              updateType: IAUUpdateKind.IMMEDIATE,
            };
          } else {
            updateOptions = {
              title: 'Update available',
              message:
                'There is a new version of the app available on the App Store, do you want to update it?',
              buttonUpgradeText: 'Update',
              buttonCancelText: 'Cancel',
            };
          }
          inAppUpdates.startUpdate(updateOptions);
        }
      });
    } catch (error) {
      console.error('In-app update check failed with error:', error);
      // Handle the specific error for InstallException (-10)
      if (error.message.includes('InstallException: -10')) {
        console.log('App is not installed from Google Play Store.');
      }
    }
  }

  useEffect(() => {
    const removeNetInfoSubscription = NetInfo.addEventListener(state => {
      const offline =
        state.isInternetReachable == null
          ? !state.isConnected
          : !(state.isConnected && state.isInternetReachable);
      store.dispatch(setNetworkStatus(offline));
      setConnection(offline);
    });
    setTimeout(() => {
      SplashScreen.hide();
    }, 1500);
    return () => {
      removeNetInfoSubscription();
      setConnection(false);
      store.dispatch(setNetworkStatus(false));
    };
  }, []);

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate persistor={persistor}>
            <NavigationContainer ref={navigationRef}>
              <NativeBaseProvider>
                <NotificationController />
                <AppNavigation />
                {connection ? <NetworkErrorModal isVisible={connection} /> : null}
              </NativeBaseProvider>
            </NavigationContainer>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default __DEV__ ? App : App;
