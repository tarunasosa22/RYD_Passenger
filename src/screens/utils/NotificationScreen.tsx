import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FontSizes } from "../../styles/FontSizes";
import { Fonts } from "../../styles/Fonts";
import { heightPercentageToDP as hp, widthPercentageToDP as wp, } from "react-native-responsive-screen";
import { useAppDispatch, useAppSelector } from "../../redux/Store";
import { Icons } from "../../utils/IconsPaths";
import CustomContainer from "../../components/CustomContainer";
import CustomHeader from "../../components/CustomHeader";
import { useGlobalStyles } from "../../hooks/useGlobalStyles";
import useCustomNavigation from "../../hooks/useCustomNavigation";
import { useIsFocused } from "@react-navigation/native";
import { NotificationProps, markAllNotification, notificationList, resetNotificationListData } from "../../redux/slice/notificationSlice/NotificationSlice";
import CustomActivityIndicator from "../../components/CustomActivityIndicator";
import moment from "moment";
import ReactNativeModal from "react-native-modal";
import CustomIconButton from "../../components/CustomIconButton";
import { readMoreRegex } from "../../utils/ScreenUtils";
import { TranslationKeys } from "../../localization/TranslationKeys";
import { useTranslation } from "react-i18next";
import { NOTIFICATION_TYPE } from "../../utils/Constats";
import DeviceInfo from "react-native-device-info";
import 'moment/locale/ar';
import 'moment/locale/en-gb';
import 'moment/locale/hi';
import { useLanguage } from "../../context/LanguageContext";

interface paramType {
  offset: number
}

const NotificationScreen = () => {

  const Styles = useStyles();
  const GlobalStyle = useGlobalStyles();
  const navigation = useCustomNavigation('DrawerStack');
  const focus = useIsFocused();
  const dispatch = useAppDispatch();
  const { isLoading, notificationListData } = useAppSelector(state => state.NotificationSlice);
  const { colors } = useAppSelector(state => state.CommonSlice);
  const [offset, setOffset] = useState<number>(0);
  const [isExpandNotificationMessage, setIsExpandNotificationMessage] = useState<{ isVisible: boolean, mainTitle?: string, title: string, image?: string | null }>({ isVisible: false, title: '', mainTitle: '' })
  const { t } = useTranslation();
  const [isFooterLoading, setIsFooterLoading] = useState(false)
  const { langCode } = useLanguage()

  const getApiCall = async () => {
    const param = {
      offset: 0,
      device_id: await DeviceInfo.getUniqueId()
    }
    notificationListApiCall(param)
  }

  const getFormattedDate = () => {
    moment.locale(langCode);
  }

  useEffect(() => {
    if (focus) {
      getFormattedDate()
      getApiCall()
    }
    else {
      dispatch(resetNotificationListData())
      markAllNotifications()
    }
  }, [focus]);

  const notificationListApiCall = (param: paramType) => {
    dispatch(notificationList(param)).unwrap().then(res => {
      setIsFooterLoading(false)
      setOffset(param.offset + 10)
    }).catch(e => {
      setIsFooterLoading(false)
      console.log("🚀 ~ file: NotificationScreen.tsx:132 ~ dispatch ~ e:", e)
    })
  };

  const markAllNotifications = () => {
    dispatch(markAllNotification(null)).unwrap().then(res => {
    }).catch(e => {
      console.log("🚀 ~ file: NotificationScreen.tsx:159 ~ dispatch ~ e:", e)
    })
  };

  const ItemSeparatorComponent = () => (
    <View style={Styles.itemSeperatorLine} />
  );

  const renderItem = ({ item }: { item: NotificationProps }) => {
    const containsThreeNewlines = readMoreRegex.test(item?.description);
    return (
      <>
        <View style={[GlobalStyle.rowContainer, Styles.notificationViewContainer]}>
          <Image source={Icons.NOTIFICATION_UI_ICON} style={Styles.notificationIcon} />
          <View style={{ flex: 1, marginHorizontal: wp(2), justifyContent: 'center', }}>
            {(item.body?.type == 'CUSTOM_NOTIFICATION' && item?.title) ?
              <Text style={[Styles.notificationTitle,]} numberOfLines={3}>{item?.title}</Text> : null}
            <Text style={[Styles.notificationText,]} numberOfLines={4}>{item?.description}</Text>
          </View>
          <TouchableOpacity
            style={{ alignItems: 'flex-end', paddingHorizontal: wp(4) }}
            onPress={() => {
              setIsExpandNotificationMessage({
                isVisible: true,
                mainTitle: item?.title,
                title: item?.description,
                image: item.body.imageUrl ? item.body.imageUrl : null
              })
            }}>
            {(item.body?.type == 'CUSTOM_NOTIFICATION' && item.body.imageUrl) ? <Image source={{ uri: item.body.imageUrl }} style={{ width: wp(12), height: wp(12), resizeMode: 'contain' }} /> : null}
          </TouchableOpacity>
        </View>
        {(item?.description?.length > 150 || containsThreeNewlines) ? 
          <TouchableOpacity
            style={{ alignItems: 'flex-end', paddingHorizontal: wp(4) }}
            onPress={() => {
              setIsExpandNotificationMessage({
                isVisible: true,
                mainTitle: item?.title,
                title: item?.description,
                image: item.body.imageUrl ? item.body.imageUrl : null
              })
            }}>
            <>
              <Text style={{ ...Styles.notificationText, marginTop: wp(-3), color: colors.SECONDARY, textDecorationLine: 'underline' }}>{t(TranslationKeys.read_more)}</Text>
            </>
          </TouchableOpacity> : null}
      </>

    )
  };

  return (
    <View style={GlobalStyle.container}>
      {(isLoading && !isFooterLoading) && <CustomActivityIndicator />}
      <CustomHeader title={t(TranslationKeys.notification)} onPress={() => {
        if (navigation?.getId() == "DrawerStack") {
          navigation.openDrawer()
        } else {
          navigation.goBack()
        }
      }} />
      <CustomContainer>
        <FlatList
          data={notificationListData?.results}
          showsVerticalScrollIndicator={false}
          // bounces={false}
          onEndReachedThreshold={0.05}
          ListFooterComponent={() => {
            return (
              isFooterLoading &&
              <ActivityIndicator style={{ margin: wp(5) }} color={colors.PRIMARY} />
            );
          }}
          onEndReached={async () => {
            if (notificationListData?.next && !isLoading) {
              const deviceId = await DeviceInfo.getUniqueId();
              const param = {
                offset: offset,
                device_id: deviceId
              }
              setIsFooterLoading(true)
              notificationListApiCall(param)
            }
          }}
          ListEmptyComponent={() => {
            return (
              <View style={Styles.emptyContainer}>
                <Image source={Icons.NOTIFICATION} style={Styles.emptyIconStyle} />
                <Text style={Styles.emptyContainerText}>{t(TranslationKeys.no_notification_yet)}</Text>
                <Text style={Styles.emptySubtitleText}>{t(TranslationKeys.when_you_get_notification_they_will_show_up_here)}</Text>
              </View>
            )
          }}
          renderItem={({ item }) => {
            return (
              <>
                <Text style={Styles.dateText}>{moment(item.date).format('DD MMM YYYY')}</Text>
                <FlatList
                  bounces={false}
                  data={item.details}
                  style={Styles.notificationListContainer}
                  renderItem={renderItem}
                  ItemSeparatorComponent={ItemSeparatorComponent}
                />
              </>
            );
          }}
        />
        <ReactNativeModal
          isVisible={isExpandNotificationMessage?.isVisible}
          animationIn={'slideInLeft'}
          animationOut={'slideOutRight'}
          onBackButtonPress={() => {
            setIsExpandNotificationMessage({ isVisible: false, title: '' })
          }}
          onBackdropPress={() => {
            setIsExpandNotificationMessage({ isVisible: false, title: '' })
          }}
        >
          <View style={Styles.notificationModalContainer}>
            <View style={{ ...GlobalStyle.rowContainer, ...Styles.rowModalContaner }}>
              <Text style={Styles.titleTextStyle}>{isExpandNotificationMessage?.mainTitle}</Text>
              <CustomIconButton icon={Icons.ROUND_CLOSE_ICON} style={{ alignSelf: 'flex-end' }} onPress={() => { setIsExpandNotificationMessage({ isVisible: false, title: '' }) }} />
            </View>
            <ScrollView>
              <Text style={Styles.notificationTitleText}>{isExpandNotificationMessage?.title}</Text>
              {(isExpandNotificationMessage.image) ? <Image source={{ uri: isExpandNotificationMessage?.image }} style={{ width: wp(80), height: wp(30), resizeMode: 'contain', margin: wp(2) }} /> : null}
            </ScrollView>
          </View>
        </ReactNativeModal>
      </CustomContainer>
    </View>
  );
};

export default NotificationScreen;

const useStyles = () => {

  const { colors } = useAppSelector((state) => state.CommonSlice);

  return StyleSheet.create({
    dateText: {
      marginVertical: wp(2),
      color: colors.SECONDARY_TEXT,
      fontSize: FontSizes.FONT_SIZE_16,
      fontFamily: Fonts.FONT_POP_MEDIUM,
      textAlign: 'left'
    },
    notificationViewContainer: {
      padding: wp(3),
      alignItems: 'center'
    },
    notificationListContainer: {
      backgroundColor: colors.SECONDARY_BACKGROUND,
      borderRadius: wp(3),
      overflow: 'hidden'
    },
    notificationIcon: {
      width: wp(13),
      height: wp(13),
      borderRadius: wp(10),
      resizeMode: 'contain'
    },
    notificationText: {
      // flex: 1,
      color: colors.PRIMARY_TEXT,
      fontSize: FontSizes.FONT_SIZE_12,
      fontFamily: Fonts.FONT_POP_REGULAR,
      textAlign: 'left'
    },
    itemSeperatorLine: {
      width: "95%",
      height: hp(0.1),
      alignSelf: "center",
      marginVertical: wp(1),
      backgroundColor: colors.SHEET_INDICATOR,
    },
    emptyIconStyle: {
      width: wp(20),
      height: wp(20),
      resizeMode: 'contain',
      tintColor: colors.PRIMARY_ICON,
      alignSelf: 'center',
      marginVertical: wp(2)
    },
    emptyContainerText: {
      fontSize: FontSizes.FONT_SIZE_17,
      fontFamily: Fonts.FONT_POP_SEMI_BOLD,
      marginBottom: wp(1),
      color: colors.PRIMARY_TEXT,
      textAlign: 'center',
    },
    emptySubtitleText: {
      fontSize: FontSizes.FONT_SIZE_15,
      fontFamily: Fonts.FONT_POP_MEDIUM,
      alignSelf: 'center',
      textAlign: 'center',
      color: colors.SECONDARY_TEXT
    },
    emptyContainer: {
      marginVertical: "50%",
      alignItems: 'center'
    },
    notificationModalContainer: {
      padding: wp(4),
      backgroundColor: colors.SECONDARY_BACKGROUND,
      borderRadius: wp(2),
      maxHeight: wp(80)
    },
    rowModalContaner: {
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: wp(3)
    },
    titleTextStyle: {
      fontFamily: Fonts.FONT_POP_MEDIUM,
      fontSize: FontSizes.FONT_SIZE_18,
      color: colors.PRIMARY_TEXT
    },
    notificationTitleText: {
      fontFamily: Fonts.FONT_POP_MEDIUM,
      fontSize: FontSizes.FONT_SIZE_14,
      color: colors.SECONDARY_TEXT,
      textAlign: 'left'
    },
    notificationTitle: {
      // flex: 1,
      // marginTop: wp(2),
      // marginLeft: wp(18),
      color: colors.PRIMARY_TEXT,
      fontSize: FontSizes.FONT_SIZE_12,
      fontFamily: Fonts.FONT_POP_SEMI_BOLD,
      marginBottom: wp(0.5)
    },
  });
};
