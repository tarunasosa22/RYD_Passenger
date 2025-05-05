import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useGlobalStyles } from '../../hooks/useGlobalStyles'
import CustomHeader from '../../components/CustomHeader';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import CustomContainer from '../../components/CustomContainer';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import { Icons } from '../../utils/IconsPaths';
import CustomTextInput from '../../components/CustomTextInput';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import { getWalletDetails } from '../../redux/slice/referralSlice/ReferralSlice';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { firebase } from '@react-native-firebase/dynamic-links';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import { setPrice } from '../../utils/HelperFunctions';
import ReactNativeModal from 'react-native-modal';

const stepsOfReferals: { id: number, color: string, title: string }[] = [
    {
        id: 1,
        color: "#FFAAA2",
        title: TranslationKeys.share_your_code
    },
    {
        id: 2,
        color: "#FFB657",
        title: TranslationKeys.people_signup
    },
    {
        id: 3,
        color: "#9EB3E9",
        title: TranslationKeys.they_book_ride
    },
    {
        id: 4,
        color: "#B4A0D5",
        title: TranslationKeys.both_earn_reward
    },
]
export const referList = [
    {
        id: '1',
        title: TranslationKeys.refer_to_driver,
        icon: Icons.referDriver,
    },
    {
        id: '2',
        title: TranslationKeys.refer_to_rider,
        icon: Icons.referRider,
    },
]

const ReferAndEarnScreen = () => {

    const GlobalStyles = useGlobalStyles();
    const Styles = useStyles();
    const navigation = useCustomNavigation('DrawerStack');
    const { colors } = useAppSelector(state => state.CommonSlice);
    const [isSharePress, setIsSharePress] = useState<boolean>(false);
    const { userDetail } = useAppSelector(state => state.AuthSlice);
    const dispatch = useAppDispatch()
    const { isLoading, walletDetails } = useAppSelector(state => state.ReferralSlice);
    const { t } = useTranslation();
    const focus = useIsFocused();
    const [isCopiedCode, setIsCopiedCode] = useState<boolean>(false);
    const [isVisibleReferOption, setIsVisibleReferOption] = useState(false)
    const [isSelectedReferOption, setIsSelectedReferOption] = useState<string>()


    useEffect(() => {
        if (focus) {
            dispatch(getWalletDetails(null)).unwrap()
        }
    }, [focus])

    const handleShareRiderLink = async () => {
        try {
            const link = await firebase.dynamicLinks().buildShortLink(
                {
                    link: `https://rydpassenger.page.link/ReferralCode/${userDetail?.referralCode}`,
                    domainUriPrefix: 'https://rydpassenger.page.link',
                    android: {
                        packageName: 'com.rydpassenger.client',
                    },
                    ios: {
                        appStoreId: '6670190125',
                        bundleId: 'com.ryd-passenger.client',
                    },
                    navigation: {
                        forcedRedirectEnabled: true,
                    },
                },
                firebase.dynamicLinks.ShortLinkType.SHORT,
            );
            const options = {
                title: 'RYD Now',
                url: link,
                message: t(TranslationKeys.marketingMessage),
            };
            setIsSharePress(true)
            Share.open(options)
                .then((res) => {
                    setIsSharePress(false)
                })
                .catch((err) => {
                    setIsSharePress(false)
                    console.log(err);
                });
        } catch (error) {
            console.log({ error })
        }
    }

    const handleShareDriverLink = async () => {
        try {
            const link = await firebase.dynamicLinks().buildShortLink(
                {
                    link: `https://ryddriver.page.link/ReferralCode/${userDetail?.referralCode}`,
                    domainUriPrefix: 'https://ryddriver.page.link',
                    android: {
                        packageName: 'com.ryddriver.client', // Android package name
                    },
                    ios: {
                        appStoreId: '6670171093',
                        bundleId: 'com.ryd-driver.client',
                    },
                    navigation: {
                        forcedRedirectEnabled: true,
                    },
                },
                firebase.dynamicLinks.ShortLinkType.SHORT,
            );
            const options = {
                title: 'RYD Now Driver',
                url: link,
                message: t(TranslationKeys.marketingMessage),
            };
            setIsSharePress(true)
            Share.open(options)
                .then((res) => {
                    setIsSharePress(false)
                })
                .catch((err) => {
                    setIsSharePress(false)
                });
        } catch (error) {
            console.log("🚀 ~ handleShareLink ~ error:", error)
        }
    }

    const handleSwitchReferoption = (id: string) => {
        // setIsVisibleReferOption(false)
        if (id == "1") {
            setIsSelectedReferOption(id)

            handleShareDriverLink()
        } else if (id == "2") {
            setIsSelectedReferOption(id)

            handleShareRiderLink()
        }
    }

    const renderReferOption = ({ item }: { item: any }) => {
        return (
            <TouchableWithoutFeedback onPress={() => {
                setIsVisibleReferOption(false)
                setTimeout(() => {
                    handleSwitchReferoption(item.id)
                }, 100)
            }}>
                <View
                    style={[GlobalStyles.rowContainer,
                    Styles.languageItemContainer,
                    item?.id === isSelectedReferOption
                        ? { backgroundColor: colors.SHADOW_1 }
                        : null,
                    ]}
                >
                    <View
                        style={[Styles.selectedLanguageContainer, item?.id === isSelectedReferOption ? { backgroundColor: colors.SECONDARY } : null]}
                    />
                    <Image
                        source={
                            item?.icon
                        }
                        style={Styles.languageListContainer}
                    />
                    <Text style={[GlobalStyles.subTitleStyle, { marginLeft: "5%" }]}>{t(item?.title)}</Text>
                </View>
            </TouchableWithoutFeedback>
        )
    }

    return (
        <View style={GlobalStyles.container}>
            {isLoading ? <CustomActivityIndicator /> : null}
            <CustomHeader
                title={t(TranslationKeys.refer_earn)}
                onPress={() => {
                    if (navigation?.getId() == "DrawerStack") {
                        navigation.openDrawer()
                    } else {
                        navigation.goBack()
                    }
                }}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
                <CustomContainer>
                    <View style={Styles.mainContainerStyle}>
                        <View style={[GlobalStyles.rowContainer, { justifyContent: 'space-between' }]}>
                            <View style={GlobalStyles.rowContainer}>
                                <Image source={ImagesPaths.MONEY_IMAGE} style={Styles.moneyImageStyle} />
                                <View style={{ paddingHorizontal: wp(3) }}>
                                    <Text style={Styles.totalRewardText}>{t(TranslationKeys.total_reward)}</Text>
                                    <Text style={[GlobalStyles.mainTitleStyle, { maxWidth: wp(50) }]}>{setPrice(t, walletDetails?.balance)}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={Styles.withdrawBtnContainer}
                                onPress={() => {
                                    navigation.navigate('DrawerStack', {
                                        screen: 'WithDrawalsScreen',
                                    })
                                }}
                            >
                                <Image source={Icons.WITHDRAW_ICON} style={Styles.withdrawIconStyle} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[Styles.totalRewardText, Styles.descriptionText]}>{t(TranslationKeys.referral_bonus_description)}</Text>
                    </View>
                    <View style={Styles.itemSeperatorLine} />
                    <View style={Styles.mainContainerStyle}>
                        <Text style={Styles.referEarnTextStyle}>{t(TranslationKeys.refer)}</Text>
                        <Text style={{ ...GlobalStyles.subTitleStyle, marginBottom: wp(3) }}>{t(TranslationKeys.invite_friend_to_join_app)}</Text>
                        <CustomTextInput
                            editable={false}
                            value={userDetail?.referralCode}
                            textInputRightComponent={
                                isCopiedCode ?
                                    <Image source={Icons.CODE_COPIED_SUCCESS} style={{ ...GlobalStyles.commonIconStyle, tintColor: colors.PRIMARY, width: wp(8), height: wp(8) }} />
                                    :
                                    <TouchableOpacity
                                        activeOpacity={1}
                                        disabled={isCopiedCode}
                                        style={GlobalStyles.rowContainer} onPress={() => {
                                            setIsCopiedCode(true)
                                            Clipboard.setString(userDetail?.referralCode ?? "")
                                        }}>
                                        <Image source={Icons.CODE_COPIED} style={{ ...GlobalStyles.commonIconStyle, tintColor: colors.PRIMARY, width: wp(8), height: wp(8) }} />
                                    </TouchableOpacity>
                            }
                        />
                    </View>
                    <View style={Styles.mainContainerStyle}>
                        <Text style={{ ...Styles.referEarnTextStyle, paddingBottom: wp(3) }}>{t(TranslationKeys.how_it_work)}</Text>
                        {stepsOfReferals.map(item => {
                            return (
                                <View style={GlobalStyles.rowContainer}>
                                    <View style={{ ...Styles.stpesContainer, backgroundColor: item.color }}>
                                        <Text style={Styles.stepsCountText}>{item.id}</Text>
                                    </View>
                                    <Text style={Styles.stepsTitleText}>{t(item.title)}</Text>
                                </View>
                            )
                        })}
                    </View>
                </CustomContainer>
            </ScrollView>
            <CustomBottomBtn disabled={isSharePress} title={t(TranslationKeys.refer_earn)} onPress={() => { setIsVisibleReferOption(true) }} />
            <ReactNativeModal
                isVisible={isVisibleReferOption}
                animationIn={'slideInLeft'}
                animationOut={'slideOutRight'}
                onBackdropPress={() => setIsVisibleReferOption(false)}
                onBackButtonPress={() => setIsVisibleReferOption(false)}
            >
                <View style={{ padding: wp(5), backgroundColor: colors.SECONDARY_BACKGROUND, borderRadius: wp(3) }}>
                    <Text style={Styles.chooseLanguageText}>{t(TranslationKeys.choose_your_referral)}</Text>
                    <Text style={Styles.languageModalSubtitle}>{t(TranslationKeys.please_choose_refer_option)}</Text>
                    <FlatList data={referList} renderItem={renderReferOption} />
                </View>
            </ReactNativeModal>
        </View>
    )
}

export default ReferAndEarnScreen;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)

    return StyleSheet.create({
        mainContainerStyle: {
            padding: wp(5),
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3),
            marginVertical: wp(3)
        },
        moneyImageStyle: {
            width: wp(15),
            height: wp(15),
            resizeMode: 'contain'
        },
        totalRewardText: {
            color: colors.SECONDARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_REGULAR,
        },
        withdrawIconStyle: {
            width: wp(8),
            height: wp(8),
            resizeMode: 'contain',
            tintColor: colors.WHITE_ICON
        },
        withdrawBtnContainer: {
            backgroundColor: colors.PRIMARY,
            padding: wp(2),
            borderRadius: wp(2)
        },
        itemSeperatorLine: {
            width: "88%",
            height: "0.1%",
            alignSelf: "center",
            marginVertical: wp(3),
            backgroundColor: colors.SHEET_INDICATOR,
        },
        referEarnTextStyle: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
            textAlign: 'left'
        },
        copyTextStyle: {
            color: colors.SECONDARY,
            fontSize: FontSizes.FONT_SIZE_14,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            marginLeft: wp(1)
        },
        stpesContainer: {
            width: wp(10),
            height: wp(10),
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: wp(1.5),
            borderRadius: wp(5)
        },
        stepsCountText: {
            color: colors.BUTTON_TEXT,
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM,
        },
        stepsTitleText: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_14,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            paddingHorizontal: wp(3),
            maxWidth: wp(70)
        },
        descriptionText: {
            paddingVertical: wp(2),
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
            textAlign: 'left'
        },
        languageItemContainer: {
            borderRadius: wp(2),
            marginVertical: "2%",
            padding: "3.5%",
        },
        selectedLanguageContainer: {
            height: "95%",
            width: "2%",
            borderBottomRightRadius: wp(5),
            borderTopRightRadius: wp(5),
            marginLeft: "-4%",
        },
        languageListContainer: {
            marginHorizontal: wp(1.5),
            tintColor: undefined,
            width: wp(8),
            height: wp(8)
        },
        languageModalContainer: {
            padding: wp(5),
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3)
        },
        chooseLanguageText: {
            fontSize: FontSizes.FONT_SIZE_17,
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
            marginVertical: wp(2)
        },
        languageModalSubtitle: {
            fontSize: FontSizes.FONT_SIZE_13,
            color: colors.SECONDARY_TEXT,
            fontFamily: Fonts.FONT_POP_REGULAR,
            marginBottom: wp(3)
        },
    });
};