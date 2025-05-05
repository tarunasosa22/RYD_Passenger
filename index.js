/**
 * @format
 */
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-get-random-values';
import App from './App';
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import './src/localization/i18n';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log(
    '🚀 ~ file: index.js:14 ~ messaging ~ remoteMessage:',
    remoteMessage,
  );
  const {notification, data} = remoteMessage;
  console.log('This is Called...---->', {notification, data});
});

AppRegistry.registerComponent(appName, () => App);
