import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import CustomHeader from '../../components/CustomHeader';
import CustomContainer from '../../components/CustomContainer';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import { AirbnbRating } from 'react-native-ratings';
import { Icons } from '../../utils/IconsPaths';
import CustomTextInput from '../../components/CustomTextInput';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import { feedbackApi, setRideDetailsData } from '../../redux/slice/rideSlice/RideSlice';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { RootRouteProps } from '../../types/RootStackType';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { resetRideDetails, rideDetails } from '../../redux/slice/homeSlice/HomeSlice';
import FastImage from 'react-native-fast-image';
import { setAdjustPan, setAdjustResize } from 'rn-android-keyboard-adjust';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import Lottie from 'lottie-react-native';
// import CustomScratchCardView from '../../components/CustomScratchCardView';
import { isScratachCard } from '../../redux/slice/referralSlice/ReferralSlice';
import CustomScratchCardView from '../../components/CustomScratchCardView';

export interface TipContainerProps {
    id: number;
    tip: string
};

const RateDriverScreen = () => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const navigation = useCustomNavigation('RateDriverScreen');
    const route = useRoute<RootRouteProps<'RateDriverScreen'>>();
    const rideId = route?.params?.rideId;
    const from = route?.params?.from;
    const [isSelect, setIsSelect] = useState<number>();
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const { feedbackLoading } = useAppSelector((state) => state.RideSlice);
    const { isLoading: rideLoading, rideDetailsData } = useAppSelector((state) => state.HomeSlice);
    const { scratchCardDetails } = useAppSelector(state => state.ReferralSlice);
    const [isShowModal, setIsShowModal] = useState(false)
    const [ratings, setratings] = useState<number>(4);
    const [reason, setReason] = useState<string>();
    const [imageError, setImageError] = useState<boolean>(false)
    const dispatch = useAppDispatch();
    const focus = useIsFocused();
    const { t } = useTranslation()
    const [isScratch, setIsScratch] = useState(false)
    const [isCouponLoading, setisCouponLoading] = useState(false)
    const { paymentMethod } = useAppSelector(state => state.HomeSlice)
    const [isFullscratch, setIsFullScratch] = useState(false)
    const [isBtnDiabled, setIsBtnDisable] = useState(false)

    useEffect(() => {
        setAdjustResize()
        if (rideId) {
            dispatch(rideDetails(rideId)).unwrap().then((res) => {
                dispatch(setRideDetailsData(res))
                console.log("🚀 ~ file: RateDriverScreen.tsx:67 ~ dispatch ~ res:", res)
            }).catch((error) => {
                console.log("🚀 ~ file: RateDriverScreen.tsx:69 ~ dispatch ~ error:", error)
            })
        }
    }, []);

    useEffect(() => {
        return () => {
            if (from !== "YourRidesScreen") {
                dispatch(resetRideDetails())
            }
            setAdjustPan()
        }
    }, []);

    useEffect(() => {
        if (focus) {
            if (scratchCardDetails?.id && !scratchCardDetails?.isScratched
            ) {
                setIsShowModal(true)
            }
            setisCouponLoading(false)
        }

    }, [focus])

    const handleScratchCard = useCallback((id: number | undefined) => {
        setisCouponLoading(true)
        const data = new FormData()
        data.append("is_scratched", true)
        const params = {
            id: id,
            formData: data
        }
        dispatch(isScratachCard(params)).unwrap().then((res) => {
            setIsScratch(true)
            setisCouponLoading(false)
        }).catch(() => { })
    }, [dispatch]);

    const renderItem = ({ item }: { item: TipContainerProps }) => (
        <TouchableOpacity activeOpacity={1} onPress={() => setIsSelect(item.id)}>
            <View style={[Styles.tipContianer, isSelect === item.id ? { backgroundColor: colors.PRIMARY } : null]}>
                <Text style={[Styles.tipContainerText, isSelect === item.id ? { color: colors.PRIMARY_BACKGROUND } : null]}>{item.tip}</Text>
            </View>
        </TouchableOpacity>
    );

    const ratingCompleted = (rating: number) => {
        setratings(rating)
    };

    const submitFeedback = () => {
        if (rideId) {
            const data = new FormData()
            if (rideId) {
                data.append("ride_booking", rideId)
            }
            if (ratings != 0) {
                data.append("rating", ratings)
            }
            if (reason != undefined) {
                data.append("reason", reason)
            }
            setIsBtnDisable(true)
            dispatch(feedbackApi(data)).unwrap()
                .then(res => {
                    if (from !== "YourRidesScreen") {
                        setIsBtnDisable(false)
                        dispatch(resetRideDetails())
                    }
                    if (from === "YourRidesScreen") {
                        dispatch(rideDetails(rideId)).unwrap().then((res) => {
                            setIsBtnDisable(false)
                            dispatch(setRideDetailsData(res))
                            navigation.goBack()
                            console.log("🚀 ~ file: RateDriverScreen.tsx:67 ~ dispatch ~ res:", res)
                        }).catch((error) => {
                            setIsBtnDisable(false)
                            console.log("🚀 ~ file: RateDriverScreen.tsx:69 ~ dispatch ~ error:", error)
                        })
                    } else {
                        setIsBtnDisable(false)
                        navigation.reset({
                            index: 0, routes: [{
                                name: 'DrawerStack',
                            }]
                        })
                    }
                    console.log("response", res)
                })
                .catch(e => {
                    console.log("error", e)
                    setIsBtnDisable(false)
                })
        }
    };

    return (
        <View style={GlobalStyle.container}>
            {(feedbackLoading || rideLoading && isCouponLoading) ? <CustomActivityIndicator /> : null}
            <CustomHeader onPress={() => {
                navigation.goBack()
            }} title={t(TranslationKeys.rate_driver)} />
            <KeyboardAwareScrollView extraHeight={hp(20)} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: wp(5) }} >
                <CustomContainer>
                    <View style={[GlobalStyle.centerContainer, { marginTop: wp(6) }]}>
                        <FastImage onError={() => {
                            setImageError(true)
                        }} source={rideDetailsData?.driver?.profilePic && !imageError ? { uri: rideDetailsData?.driver?.profilePic } : ImagesPaths.EMPTY_IMAGE} style={Styles.profile_picture} />
                        <View style={GlobalStyle.rowContainer}>
                            <Text style={Styles.driverNameText}>{rideDetailsData?.driver?.name}</Text>
                            {rideDetailsData?.driver?.isVerified && <Image source={Icons.VERIFIED_ICON} style={Styles.verifiedTickMark} />}
                        </View>
                        <View style={[GlobalStyle.rowContainer, { marginVertical: wp(2) }]}>
                            <Text style={Styles.subTitleStyle}>{rideDetailsData?.driverCar?.name}</Text>
                            <View style={Styles.itemSeprator} />
                            <Text style={Styles.subTitleStyle}>{rideDetailsData?.driverCar?.registrationNumber}</Text>
                        </View>
                        <Text style={Styles.mainHeadingText}>{t(TranslationKeys.how_was_your_trip_with)} {rideDetailsData?.driver?.name}?</Text>
                        <AirbnbRating
                            count={5}
                            defaultRating={4}
                            showRating={false}
                            selectedColor={colors.SECONDARY}
                            unSelectedColor={colors.SHADOW_1}
                            starImage={Icons.RATING}
                            onFinishRating={ratingCompleted}
                        />
                    </View>
                    <Text style={Styles.textInputLabelText}>{t(TranslationKeys.comment)}</Text>
                    <CustomTextInput
                        placeholder={t(TranslationKeys.write_here)}
                        multiline
                        textInputContainerStyle={Styles.textInputContainerStyle}
                        onChangeText={reason => setReason(reason)}
                        value={reason}
                        returnKeyType='done'
                        blurOnSubmit={true}
                        style={{
                            height: wp(23),
                        }}
                    />
                </CustomContainer>
            </KeyboardAwareScrollView>
            <CustomBottomBtn title={t(TranslationKeys.share_feedback)} onPress={submitFeedback} disabled={isBtnDiabled} />
            <Modal
                animationType="slide"
                transparent={true}
                visible={isShowModal}
                onRequestClose={() => {
                    setIsShowModal(false)
                    setIsFullScratch(false)
                }
                }
            >
                <View style={Styles.modalContainer}>
                    <TouchableOpacity onPress={() => {
                        setIsShowModal(false)
                        setIsFullScratch(false)
                    }} style={{ position: 'absolute', top: 20, margin: wp(4), right: 0, }}>
                        <Image source={Icons.CLOSE_ICON} style={[GlobalStyle.commonIconStyle, { tintColor: colors.WHITE_ICON }]} />
                    </TouchableOpacity>
                    <View style={Styles.modalContent}>
                        <CustomScratchCardView
                            rewardPrice={scratchCardDetails?.scratchAmount}
                            isFullscratch={isFullscratch}
                            handleScratch={(event) => {
                                if (event > 30) {
                                    if (!isCouponLoading) {
                                        handleScratchCard(scratchCardDetails?.id)
                                        setTimeout(() => {
                                            setIsFullScratch(true)
                                        }, 100);
                                    }
                                }
                            }} />
                        {isScratch ? (
                            <>
                                <View style={[{ alignContent: 'center', position: 'absolute' }]}>
                                    <Lottie source={require('../../assets/lottie/rewardCelebration.json')} resizeMode='cover' loop autoPlay style={{
                                        width: wp(60),
                                        height: wp(60),
                                        top: 5
                                    }} />
                                </View>
                                <Text style={Styles.rewardSuccessMaintext}>{t(TranslationKeys.congratulation)}</Text>
                                <Text style={Styles.rewardSuccessSubtext}>{t(TranslationKeys.reward_price_add_wallet)}</Text>
                            </>
                        )
                            : <></>}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default RateDriverScreen;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        profile_picture: {
            height: wp(20),
            width: wp(20),
            resizeMode: 'cover',
            borderRadius: wp(10),
            marginBottom: wp(3)
        },
        driverNameText: {
            fontSize: FontSizes.FONT_SIZE_20,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
        },
        subTitleStyle: {
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.SECONDARY_TEXT,
        },
        itemSeprator: {
            width: wp(2),
            height: wp(2),
            backgroundColor: colors.PRIMARY,
            borderRadius: wp(2),
            marginHorizontal: wp(1.5)
        },
        mainHeadingText: {
            textAlign: 'center',
            fontSize: FontSizes.FONT_SIZE_22,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
            marginHorizontal: wp(5),
            marginVertical: wp(5)
        },
        textInputLabelText: {
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
            marginTop: wp(6),
            marginBottom: wp(2)
        },
        textInputContainerStyle: {
            alignItems: 'flex-start',
            maxHeight: wp(30),
            minHeight: wp(30)
        },
        addTipText: {
            textAlign: 'center',
            marginVertical: wp(4.5),
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_14,
            color: colors.PRIMARY_TEXT,
        },
        tipContianer: {
            width: wp(17),
            height: wp(17),
            backgroundColor: colors.SHADOW_1,
            borderRadius: wp(2),
            alignItems: 'center',
            justifyContent: 'center'
        },
        tipContainerText: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM
        },
        contentContainer: {
            flex: 1,
            justifyContent: 'space-around',
            alignItems: 'center'
        },
        verifiedTickMark: {
            width: wp(6.5),
            height: wp(6.5),
            resizeMode: 'contain',
            marginBottom: wp(1),
            marginLeft: wp(1.5)
        },
        scratchContainer: {
            marginRight: wp(4),
            marginBottom: wp(4),
        },
        rewardSuccessMaintext: {
            fontFamily: Fonts.FONT_POP_BOLD,
            fontSize: FontSizes.FONT_SIZE_17,
            color: colors.PRIMARY,
            marginTop: wp(10)
        },
        rewardSuccessSubtext: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_16,
            color: colors.BOX_BORDER,
            textAlign: 'center'
        },
        modalContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.SCRATCH_BACKGROUND,
        },
        modalContent: {
            width: wp(100),
            padding: wp(4),
            borderRadius: wp(2),
            alignItems: 'center',
        },
    });
};
