import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Linking, StyleSheet, View } from 'react-native';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useAppSelector } from '../../redux/Store';
import CustomHeader from '../../components/CustomHeader';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import useCustomNavigation from '../../hooks/useCustomNavigation';
// import Pdf from 'react-native-pdf';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import WebView from 'react-native-webview';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';


const PrivacyPolicy = () => {

  const GlobalStyle = useGlobalStyles();
  const styles = useStyles();
  const navigation = useCustomNavigation('DrawerStack');
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(true);

  return (
    <View style={GlobalStyle.container}>
      <CustomHeader title={t(TranslationKeys.privacy_policy)} onPress={() => {
        if (navigation?.getId() == "DrawerStack") {
          navigation.openDrawer()
        } else {
          navigation.goBack()
        }
      }} />
      {isLoaded && (
        <CustomActivityIndicator />
      )}
      <WebView
        source={{ uri: "https://www.rydtaxi.app/privacy-policy/" }}
        bounces={false}
        onLoadStart={() => setIsLoaded(true)}
        onLoadEnd={() => setIsLoaded(false)}
      />
    </View>
  );
};

export default PrivacyPolicy;

const useStyles = () => {

  const { colors } = useAppSelector((state) => state.CommonSlice);

  return StyleSheet.create({
    container: {
      marginTop: wp(3),
    },
  });
};
