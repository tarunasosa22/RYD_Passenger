import React, { useEffect, useRef, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableWithoutFeedback, View, } from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import { FontSizes } from "../styles/FontSizes"
import { Fonts } from "../styles/Fonts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppDispatch, useAppSelector } from "../redux/Store";
import { ImagesPaths } from "../utils/ImagesPaths";
import { Icons } from "../utils/IconsPaths";
import { useGlobalStyles } from "../hooks/useGlobalStyles";
import FastImage from "react-native-fast-image";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { setDeleteAccountPopUp, setLogOutPopUp } from "../redux/slice/SettingSlice/SettingSlice";
import { TranslationKeys } from "../localization/TranslationKeys";
import { useTranslation } from "react-i18next";
import DeviceInfo from "react-native-device-info";

export interface Draweritem {
    id: number;
    title: string;
    icon: string;
    screenName: string
};

export const DrawerItems = [
    {
        id: 0,
        title: TranslationKeys.home,
        icon: Icons.LOCATION_ICON,
        screenName: "HomeScreen",
    },
    {
        id: 13,
        title: TranslationKeys.delivery,
        icon: Icons.DELIVERY_PACKAGE,
        screenName: "DeliveryHomeScreen",
    },
    {
        id: 1,
        title: TranslationKeys.edit_profile,
        icon: Icons.PROFILE,
        screenName: "EditProfile",
    },
    {
        id: 2,
        title: TranslationKeys.notification,
        icon: Icons.NOTIFICATION,
        screenName: "Notification",

    },
    {
        id: 3,
        title: TranslationKeys.your_rides,
        icon: Icons.RIDES,
        screenName: "YourRidesScreen",

    },
    {
        id: 4,
        title: TranslationKeys.pre_booked,
        icon: Icons.CELENDER,
        screenName: 'PreBookScreen',
    },
    {
        id: 10,
        title: TranslationKeys.wallet,
        icon: Icons.WITH_DRAWAL_ICON,
        screenName: "WithDrawalsScreen",
    },
    {
        id: 11,
        title: TranslationKeys.refer_earn,
        icon: Icons.REFER_EARN,
        screenName: "ReferAndEarnScreen",
    },
    {
        id: 12,
        title: TranslationKeys.coupons,
        icon: Icons.COUPON_ICON,
        screenName: "ScratchCouponScreen",
    },
    {
        id: 5,
        title: TranslationKeys.privacy_policy,
        icon: Icons.PRIVACYPOLICY,
        screenName: 'PrivacyPolicy',
    },
    {
        id: 6,
        title: TranslationKeys.help_center,
        icon: Icons.HELPCENTER,
        screenName: 'HelpCenter',
    },
    {
        id: 7,
        title: TranslationKeys.emergency_contact,
        icon: Icons.EMERGENCYCONTACT,
        screenName: 'EmergencyContactScreen',
    },
    {
        id: 9,
        title: TranslationKeys.delete_account,
        icon: Icons.DELETE_ACCOUNT,
        screenName: 'DeleteAccountScreen',
    },
    {
        id: 8,
        title: TranslationKeys.logout,
        icon: Icons.LOGOUT,
        screenName: "LogOut"
    },
];

const APP_VERSION = DeviceInfo.getVersion()

const CustomDrawerItem = ({ currentScreen, navigation }: { currentScreen: number } & DrawerContentComponentProps) => {

    const [selectedDrawerItem, setSelectedDrawerItem] = useState<number>(0);
    const insets = useSafeAreaInsets();
    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const dispatch = useAppDispatch();

    const { colors } = useAppSelector(state => state.CommonSlice);
    const { userDetail } = useAppSelector(state => state.AuthSlice);
    const [imageError, setImageError] = useState<boolean>(false);
    const flatListRef = useRef<FlatList>(null)
    const { t } = useTranslation();

    useEffect(() => {
        setSelectedDrawerItem(currentScreen)
        flatListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
    }, [currentScreen])

    const handleClick = (item: Draweritem) => {
        navigation?.closeDrawer()
        setSelectedDrawerItem(item.id);
        if (item.screenName === "LogOut") {
            dispatch(setLogOutPopUp(true))
            navigation.navigate('DrawerStack', { screen: 'HomeScreen' })
        } else if (item.screenName === "DeleteAccountScreen") {
            dispatch(setDeleteAccountPopUp(true))
            navigation.navigate('DrawerStack', { screen: 'HomeScreen' })
        } else {
            navigation.navigate('DrawerStack', { screen: item.screenName })
        }
    };

    return (
        <View style={[GlobalStyle.container, { marginTop: Math.max(insets.top) }]}>
            <View style={Styles.drawerContainer}>
                <FastImage
                    source={(userDetail?.profilePic && !imageError) ? { uri: userDetail?.profilePic } : ImagesPaths.EMPTY_IMAGE}
                    style={Styles.userProfileImage}
                    resizeMode={'cover'}
                    onError={() => {
                        setImageError(true)
                    }}
                />
                <Text numberOfLines={2} style={Styles.welcomeText}>
                    {t(TranslationKeys.welcome)}&nbsp;{userDetail?.name}
                </Text>
                <FlatList
                    ref={flatListRef}
                    data={DrawerItems}
                    bounces={false}
                    contentContainerStyle={{ paddingBottom: hp(16) }}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => {
                        if (!item?.title) {
                            return null
                        }
                        return (
                            <TouchableWithoutFeedback onPress={() => handleClick(item)}>
                                <View
                                    style={[GlobalStyle.rowContainer,
                                    Styles.DrawerItems,
                                    item.id === selectedDrawerItem
                                        ? { backgroundColor: '#79797914', }
                                        : null,
                                    ]}
                                >
                                    <View
                                        style={[Styles.activeDrawerItem, item.id === selectedDrawerItem ? { backgroundColor: colors.SECONDARY, } : null]}
                                    ></View>
                                    <View style={item.id === selectedDrawerItem && Styles.activeIconContainer}>
                                        <Image
                                            source={
                                                item.icon
                                            }
                                            style={[GlobalStyle.commonIconStyle, { marginHorizontal: wp(1) }, item.id === selectedDrawerItem ? { tintColor: colors.WHITE_ICON } : { tintColor: colors.SECONDARY_ICON }]}
                                        />
                                    </View>
                                    <Text style={[GlobalStyle.subTitleStyle, { marginLeft: "5%", fontFamily: item.id === selectedDrawerItem ? Fonts.FONT_POP_MEDIUM : Fonts.FONT_POP_REGULAR }]}>{t(item.title)}</Text>
                                </View>
                            </TouchableWithoutFeedback>
                        )
                    }}
                    ListFooterComponent={
                        <Text style={[GlobalStyle.subTitleStyle, Styles.versionText]}>
                            {APP_VERSION}
                        </Text>
                    }
                />
            </View>
        </View>
    );
};

export default CustomDrawerItem;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            userProfileImage: {
                width: wp(17),
                height: wp(17),
                borderRadius: wp(17),
            },
            drawerContainer: {
                padding: "5%"
            },
            welcomeText: {
                fontSize: FontSizes.FONT_SIZE_18,
                fontFamily: Fonts.FONT_POP_REGULAR,
                paddingVertical: "5%",
                color: colors.PRIMARY_TEXT,
                textAlign: 'left'
            },
            DrawerItems: {
                borderRadius: wp(2),
                marginVertical: "3.7%",
                padding: "4%",
            },
            versionText: {
                textAlign: "center",
                marginTop: "30%",
                color: colors.SECONDARY_TEXT
            },
            activeDrawerItem: {
                height: "95%",
                width: "2%",
                borderBottomRightRadius: wp(5),
                borderTopRightRadius: wp(5),
                marginLeft: "-4%",
            },
            userImageContainerStyle: {
                width: wp(17),
                height: wp(17),
                borderRadius: wp(17),
                backgroundColor: colors.BOX_PRIMARY_BACKGROUND,
                alignItems: 'center',
                justifyContent: "center"
            },
            emptyUserImageStyle: {
                width: wp(6),
                height: wp(6),
            },
            activeIconContainer: {
                backgroundColor: colors.SECONDARY,
                marginLeft: wp(1.5),
                borderRadius: wp(2),
                paddingVertical: wp(1),
                justifyContent: 'center',
                alignItems: 'center'
            }
        })
    );
};
