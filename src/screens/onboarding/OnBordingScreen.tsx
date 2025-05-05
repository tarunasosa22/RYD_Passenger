import React, { useEffect, useRef, useState } from 'react';
import { Fonts } from '../../styles/Fonts';
import { Icons } from '../../utils/IconsPaths';
import { FontSizes } from '../../styles/FontSizes';
import { useAppSelector } from '../../redux/Store';
import { AppStrings } from '../../utils/AppStrings';
import { SafeAreaView } from 'react-native-safe-area-context';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FlatList, Image, ImageSourcePropType, NativeScrollEvent, NativeSyntheticEvent, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { useIsFocused } from '@react-navigation/native';
import { setAsyncStorageData } from '../../utils/HelperFunctions';
import { ANALYTICS_ID } from '../../utils/AnalyticsStringID';
import analytics from '@react-native-firebase/analytics';
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../../localization/TranslationKeys';

interface ItemProps {
    imgUrl: ImageSourcePropType
    title: string
    description: string
};


const OnBordingScreen = () => {

    const Styles = useStyles();
    const flatListRef = useRef<FlatList>(null);
    const navigation = useCustomNavigation("OnBordingScreen");

    const [currentScreen, setCurrentScreen] = useState(0);
    const { t } = useTranslation();

    const focus = useIsFocused();

    const OnBordingScreens = [
        {
            imgUrl: ImagesPaths.PRE_BOOK_RIDE_IMAGE,
            title: t(TranslationKeys.pre_book_your_ride),
            description: t(TranslationKeys.pre_book_your_ride_discription),
        },
        {
            imgUrl: ImagesPaths.CHOOSE_ROUTE_IMAGE,
            title: t(TranslationKeys.choose_the_route),
            description: t(TranslationKeys.choose_the_route_discription),
        },
        {
            imgUrl: ImagesPaths.TRACK_RIDE_IMAGE,
            title: t(TranslationKeys.track_your_ride),
            description: t(TranslationKeys.track_your_ride_discription),
        },
    ];

    useEffect(() => {
        if (focus) {
            setAsyncStorageData(AppStrings.is_first_time_open, false).then((res) => {
                console.log("res", res);
            })
        }
    }, [focus])

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = event.nativeEvent.contentOffset.x;
        const index = Math.round(x / wp(100));
        setCurrentScreen(index);
    };

    const nextPress = (index: number) => {
        if (index <= OnBordingScreens?.length) {
            flatListRef?.current?.scrollToIndex({
                animated: true,
                index: index + 1
            });
        }
    };

    const backPress = (index: number) => {
        if (index >= 1) {
            flatListRef?.current?.scrollToIndex({
                animated: true,
                index: index - 1
            });
        }
    };

    const renderItem = ({ item }: { item: ItemProps }) => {
        return (
            <View style={Styles.renderItemContainerStyle}>
                <Image
                    source={item.imgUrl}
                    style={Styles.image}
                    resizeMode='contain' />
                <View>
                    <Text style={Styles.title}>{t(item.title)}</Text>
                    <Text style={Styles.description}>{t(item.description)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={Styles.container}>
            <TouchableOpacity style={Styles.topBtnStyle}
                onPress={async () => {
                    await analytics().logEvent(ANALYTICS_ID.IS_FIRST_TIME_OPENED_APP)
                    navigation.navigate('AuthStack', { screen: 'SendOtpScreen' })
                }}>
                <Text numberOfLines={1} style={Styles.topBtnText}>{currentScreen == OnBordingScreens?.length - 1 ? null : t(TranslationKeys.skip)}</Text>
            </TouchableOpacity>
            <FlatList
                ref={flatListRef}
                horizontal
                pagingEnabled
                data={OnBordingScreens}
                onScroll={handleScroll}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                renderItem={renderItem}
            />
            <View style={Styles.bottomContainer}>
                {currentScreen != 0 ?
                    <TouchableOpacity
                        style={Styles.prevButton}
                        onPress={() => backPress(currentScreen)}>
                        <Image
                            source={Icons.LEFT_ARROW_PRIMARY_ICON}
                            style={Styles.prevIcon} />
                    </TouchableOpacity>
                    :
                    <View style={Styles.emptyButton} />
                }
                <View style={Styles.paginationContainer}>
                    {OnBordingScreens?.map((item, index) => {
                        return (
                            currentScreen == index ?
                                <View style={Styles.activeDotView} />
                                :
                                <View style={[Styles.activeDotView, Styles.inactiveDotView]} />
                        )
                    })}
                </View>
                {currentScreen < OnBordingScreens?.length - 1 ?
                    <TouchableOpacity
                        style={[Styles.prevButton, Styles.nextButton, Styles.btnBackShadowStyle]}
                        onPress={() => nextPress(currentScreen)}>
                        <Image
                            source={Icons.RIGHT_ARROW_SECONDARY_ICON}
                            style={[Styles.prevIcon, Styles.nextIcon]} />
                    </TouchableOpacity>
                    :
                    <TouchableOpacity onPress={async () => {
                        await analytics().logEvent(ANALYTICS_ID.IS_FIRST_TIME_OPENED_APP)
                        navigation.navigate('AuthStack', { screen: 'SendOtpScreen' })
                    }} style={[Styles.finishBtnStyle]} >
                        <Text numberOfLines={1} style={Styles.topBtnText}>{t(TranslationKeys.finish)}</Text>
                    </TouchableOpacity>
                }
            </View>
        </SafeAreaView>
    );
};

export default OnBordingScreen;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            container: {
                flex: 1,
                backgroundColor: colors.PRIMARY_BACKGROUND,
            },
            topBtnStyle: {
                alignSelf: 'flex-end',
                marginVertical: wp(2),
                marginHorizontal: wp(5),
            },
            topBtnText: {
                color: colors.PRIMARY,
                fontSize: FontSizes.FONT_SIZE_15,
                fontFamily: Fonts.FONT_POP_REGULAR,
            },
            image: {
                width: wp(90),
                height: wp(90),
            },
            title: {
                textAlign: 'center',
                color: colors.PRIMARY_TEXT,
                fontSize: FontSizes.FONT_SIZE_22,
                fontFamily: Fonts.FONT_POP_MEDIUM,
            },
            description: {
                marginTop: wp(3),
                textAlign: 'center',
                color: colors.SECONDARY_TEXT,
                fontSize: FontSizes.FONT_SIZE_15,
                fontFamily: Fonts.FONT_POP_REGULAR,
            },
            activeDotView: {
                width: wp(4),
                height: wp(4),
                borderRadius: wp(4),
                resizeMode: 'contain',
                marginHorizontal: wp(1),
                backgroundColor: colors.PRIMARY,
            },
            inactiveDotView: {
                opacity: 0.2,
                width: wp(3),
                height: wp(3),
            },
            bottomContainer: {
                marginBottom: wp(2),
                flexDirection: 'row',
                paddingHorizontal: wp(5),
                justifyContent: 'space-between',
            },
            paginationContainer: {
                flexDirection: 'row',
                alignItems: 'center',
            },
            prevButton: {
                width: wp(12),
                height: wp(12),
                borderWidth: 2,
                borderRadius: wp(10),
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: colors.PRIMARY,
            },
            nextButton: {
                borderWidth: 0,
                backgroundColor: colors.PRIMARY,
            },
            emptyButton: {
                width: wp(12),
                height: wp(12),
            },
            prevIcon: {
                width: wp(4.5),
                height: wp(4.5),
                tintColor: colors.PRIMARY
            },
            nextIcon: {
                tintColor: colors.WHITE_ICON
            },
            btnBackShadowStyle: {
                elevation: 15,
                shadowRadius: 10,
                shadowColor: colors.PRIMARY,
                shadowOffset: { height: 6, width: 0 },
                shadowOpacity: Platform.OS == "ios" ? 0.4 : 1,
            },
            renderItemContainerStyle: {
                width: wp(90),
                marginHorizontal: wp(5),
                justifyContent: 'space-around',
            },
            finishBtnStyle: {
                alignItems: 'center',
                justifyContent: 'center'
            }
        })
    );
};
