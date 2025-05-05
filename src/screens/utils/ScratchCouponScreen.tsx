import { FlatList, Image, ImageBackground, Modal, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../redux/Store'
import { useGlobalStyles } from '../../hooks/useGlobalStyles'
import { TranslationKeys } from '../../localization/TranslationKeys'
import { useTranslation } from 'react-i18next'
import useCustomNavigation from '../../hooks/useCustomNavigation'
import { widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { ImagesPaths } from '../../utils/ImagesPaths'
import { FontSizes } from '../../styles/FontSizes'
import { Fonts } from '../../styles/Fonts'
import { Icons } from '../../utils/IconsPaths'
import { navigationRef } from '../../utils/NavigationServices'
import CustomScratchCardView from '../../components/CustomScratchCardView'
import CustomContainer from '../../components/CustomContainer'
import { getScrtachCardDetailsList, isScratachCard, paramsTypes, scrachCardDetails, setScrtachCardDetails, setScrtachCardDetailsList, sratchCardDetailsProps } from '../../redux/slice/referralSlice/ReferralSlice'
import { useIsFocused } from '@react-navigation/native'
import Lottie from 'lottie-react-native';
import CustomActivityIndicator from '../../components/CustomActivityIndicator'
import CustomHeader from '../../components/CustomHeader'
import { setPrice } from '../../utils/HelperFunctions'
import { useLanguage } from '../../context/LanguageContext'

const ScratchCouponScreen = () => {

  const GlobalStyle = useGlobalStyles()
  const { colors } = useAppSelector(state => state.CommonSlice)
  const { scratchCardDetailsList, isLoading } = useAppSelector(state => state.ReferralSlice)
  const { t } = useTranslation()
  const Styles = useStyles()
  const navigation = useCustomNavigation('DrawerStack')
  const focus = useIsFocused()
  const dispatch = useAppDispatch()
  const [isScrolling, setIsScrolling] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [offset, setOffset] = useState(0)
  const [isScratch, setIsScratch] = useState(false)
  const [totalAmount, settotalAmount] = useState<number>()
  const [selectedReward, setSelectedReward] = useState<scrachCardDetails>();
  const [isCouponLoading, setisCouponLoading] = useState(false)
  const [isFullscratch, setIsFullScratch] = useState(false)
  const { locale } = useLanguage()

  const scrtachCard = (params: paramsTypes) => {
    dispatch(getScrtachCardDetailsList(null)).unwrap().then((res) => {
      settotalAmount(res.totalScratchAmount)
      dispatch(setScrtachCardDetailsList(res.results))
    }).catch(() => { })
  }

  useEffect(() => {
    const params = {
      offset: offset
    }
    if (focus) {
      scrtachCard(params)
    }
    // else if (focus && isScratch) {
    //   scrtachCard(params)
    // }
    setisCouponLoading(false)
    setIsScratch(false)
    return () => {
      setOffset(0)
    }
  }, [focus])

  const handleScratchCard = useCallback((id: number | undefined) => {
    // setisLoadingCoupon(false)
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
  }, [dispatch, scratchCardDetailsList]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <>
        {!item?.isScratched ?
          (
            <TouchableWithoutFeedback
              style={Styles.scratchContainer}
              onPress={() => {
                setIsScratch(item?.isScratched)
                setModalVisible(true);
                setSelectedReward(item)
              }}
            >
              <Image source={ImagesPaths.SCRATCH_COVER_ICON} style={Styles.scratchIconStyle} />
            </TouchableWithoutFeedback>
          )
          : (
            <View style={[Styles.container]}>
              <Image source={ImagesPaths.OFFER_ICON} style={Styles.background_view} />
              <View style={[Styles.background_view, { top: wp(20), width: wp(40), alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={[Styles.totalRewardtxtStyle, { textAlign: 'center' }]}>{t(TranslationKeys.your_reward)}</Text>
                <Text style={[GlobalStyle.subTitleStyle, { textAlign: 'center', fontFamily: Fonts.FONT_POP_SEMI_BOLD }]} numberOfLines={1}>{setPrice(t, item.scratchAmount)}</Text>
              </View>
            </View>
          )}
      </>
    );
  }, [isScrolling]);

  return (
    <>
      {(isLoading) && <CustomActivityIndicator />}
      {scratchCardDetailsList?.length !== 0 ? (
        <View style={{ flex: 1 }}>
          <View style={{
            backgroundColor: colors.PRIMARY,
            height: wp(50),
            padding: wp(1),
          }}>
            <ImageBackground
              source={ImagesPaths.SCARTCH_CARD_BACKGROUND}
              style={Styles.imageBackground}
            >
              <>
                <TouchableOpacity
                  style={{ alignSelf: 'baseline' }}
                  onPress={() => {
                    if (navigation?.getId() == "DrawerStack") {
                      navigation.openDrawer()
                    } else {
                      navigation.goBack()
                    }
                  }}>
                  <Image source={Icons.LEFT_ARROW_ICON} style={[GlobalStyle.commonIconStyle, {
                    tintColor: colors.PRIMARY_TEXT, marginTop: wp(10), marginLeft: wp(6),
                    transform: [{ rotate: locale ? '180deg' : '0deg' }]
                  }]} />
                </TouchableOpacity>
                <View style={Styles.rewardContainer}>
                  <View>
                    <Text style={[GlobalStyle.mainTitleStyle, { color: colors.PRIMARY_TEXT }]}>{setPrice(t, totalAmount)}</Text>
                    <Text style={Styles.totalRewardtxtStyle}>{t(TranslationKeys.total_reward)}</Text>
                  </View>
                </View>
              </>
            </ImageBackground>
          </View>
          <CustomContainer>
            <View style={{ marginTop: wp(6), flex: 1 }}>
              <FlatList
                data={scratchCardDetailsList}
                renderItem={renderItem}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                // bounces={false}
                // onEndReachedThreshold={0.05}
                ListFooterComponent={<View style={{ height: wp(5) }}></View>}
                // onEndReached={() => {
                //   if (scratchCardDetailsList?.next && !isLoading) {
                //     const params: paramsTypes = {
                //       offset: offset
                //     }
                //     scrtachCard(params)
                //   }
                // }}
                style={{ flex: 1 }}
              />
            </View>
          </CustomContainer>
        </View>
      ) : (
        <View style={GlobalStyle.container}>
          <CustomHeader title={t(TranslationKeys.reward_coupons)} onPress={() => {
            if (navigation?.getId() == "DrawerStack") {
              navigation.openDrawer()
            } else {
              navigation.goBack()
            }
          }} />
          <View style={Styles.emptyContainer}>
            <Image source={Icons.COUPON_ICON} style={Styles.emptyIconStyle} />
            <Text style={Styles.emptyContainerText}>{t(TranslationKeys.no_rewards)}</Text>
            <Text style={Styles.emptySubtitleText}>{t(TranslationKeys.you_do_not_have_rewards)}</Text>
          </View>
        </View>
      )}

      {selectedReward && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            // setisCouponLoading(true)
            const params = {
              offset: offset
            }
            scrtachCard(params)
            setModalVisible(false)
            setIsFullScratch(false)
          }}
        >
          <View style={Styles.modalContainer}>
            <TouchableOpacity onPress={() => {
              // setisCouponLoading(true)
              const params = {
                offset: offset
              }
              scrtachCard(params)
              setIsFullScratch(false)
              setModalVisible(false)
            }} style={{ position: 'absolute', top: 20, margin: wp(4), right: 0 }}>
              <Image source={Icons.CLOSE_ICON} style={[GlobalStyle.commonIconStyle, { tintColor: colors.WHITE_ICON }]} />
            </TouchableOpacity>
            <View style={Styles.modalContent}>
              <CustomScratchCardView
                rewardPrice={selectedReward?.scratchAmount}
                isFullscratch={isFullscratch}
                handleScratch={(event) => {
                  if (event > 30) {
                    if (!isCouponLoading) {
                      handleScratchCard(selectedReward?.id)
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
      )}

    </>
  )
}

export default ScratchCouponScreen

const useStyles = () => {

  const { colors } = useAppSelector(state => state.CommonSlice)

  return StyleSheet.create({
    imageBackground: {
      height: wp(50),
      width: wp(100),
      position: 'absolute',
      zIndex: 1,
      opacity: 1,
      justifyContent: 'space-between'
    },
    rewardContainer: {
      flexDirection: 'row',
      flex: 1,
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: wp(6)
    },
    totalRewardtxtStyle: {
      color: colors.PRIMARY_TEXT,
      fontSize: FontSizes.FONT_SIZE_14,
      fontFamily: Fonts.FONT_POP_REGULAR,
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
      // backgroundColor: colors.WHITE_ICON,
      borderRadius: wp(2),
      alignItems: 'center',
    },
    closeModalText: {
      marginTop: wp(2),
      color: colors.PRIMARY,
      fontSize: FontSizes.FONT_SIZE_16,
      fontFamily: Fonts.FONT_POP_SEMI_BOLD,
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
    scratchCard: {
      borderRadius: 16,
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
    container: {
      width: wp(44),
      marginRight: wp(1),
      marginBottom: wp(1),
      height: wp(44),
      borderRadius: wp(2),
      backgroundColor: colors.BOX_BORDER,
    },
    background_view: {
      position: 'absolute',
      width: wp(20),
      height: wp(20),
      marginTop: wp(3),
      alignSelf: 'center',
      borderRadius: 16,
    },
    scratchIconStyle: {
      width: wp(44),
      height: wp(44),
      resizeMode: 'contain',
      borderRadius: wp(2),
      marginBottom: wp(1),
      marginRight: wp(1)
    }
  })
}