import { Alert, Button, FlatList, Modal, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { store, useAppDispatch, useAppSelector } from '../../redux/Store'
import { useGlobalStyles } from '../../hooks/useGlobalStyles'
import CustomActivityIndicator from '../../components/CustomActivityIndicator'
import CustomHeader from '../../components/CustomHeader'
import { TranslationKeys } from '../../localization/TranslationKeys'
import { useTranslation } from 'react-i18next'
import useCustomNavigation from '../../hooks/useCustomNavigation'
import CustomContainer from '../../components/CustomContainer'
import moment from 'moment'
import { widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { getAllWithoutPhotos } from 'react-native-contacts'
import { Image } from 'react-native'
import { ImagesPaths } from '../../utils/ImagesPaths'
import { AirbnbRating } from 'react-native-ratings'
import { Icons } from '../../utils/IconsPaths'
import { Fonts } from '../../styles/Fonts'
import CommonDraggableItem from '../../components/CommonDraggableItem'
import CommonDraggableDashView from '../../components/CommonDraggableDashView'
import { RideLocationTypes, resetRideOtpReducer, rideBillPdf, setRideStatusReducer } from '../../redux/slice/rideSlice/RideSlice'
import { FontSizes } from '../../styles/FontSizes'
import ZigzagLines from 'react-native-zigzag-lines'
import CustomBottomBtn from '../../components/CustomBottomBtn'
import { ANALYTICS_ID } from '../../utils/AnalyticsStringID'
import { setPaymentMethod } from '../../redux/slice/homeSlice/HomeSlice'
import analytics from '@react-native-firebase/analytics';
import { RIDE_STATUS } from '../../utils/Constats'
import CustomIconButton from '../../components/CustomIconButton'
import RNFS from 'react-native-fs';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet'
import FileViewer from "react-native-file-viewer";
import DeviceInfo from 'react-native-device-info'
import { useIsFocused, useRoute } from '@react-navigation/native'
import { setPrice } from '../../utils/HelperFunctions'
import { useLanguage } from '../../context/LanguageContext'
import 'moment/locale/ar';
import 'moment/locale/en-gb';
import 'moment/locale/hi'

const RideBillScreen = () => {
  const GlobalStyle = useGlobalStyles()
  const Styles = useStyle()
  const { colors } = useAppSelector(state => state.CommonSlice)
  const { tokenDetail } = useAppSelector(state => state.AuthSlice);
  const { isLoading: rideLoading, billData } = useAppSelector(state => state.RideSlice)
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigation = useCustomNavigation('DrawerStack')
  const { rideDetails } = useAppSelector(state => state.RideSlice)
  const route = useRoute()
  const from = route?.params?.from
  const createRideDateTime = moment(rideDetails?.createdAt).format('ddd, MMM DD, hh:mm A');
  const [userImageError, setUserImageError] = useState<boolean>(false)
  const [location, setLocation] = useState<RideLocationTypes[] | []>([])

  const basefare = Number(rideDetails?.ridePayment.baseFare) ?? 0
  const tipamount = Number(rideDetails?.ridePayment.tipAmount) ?? 0
  const cgst = Number(rideDetails?.ridePayment.cgst) ?? 0
  const igst = Number(rideDetails?.ridePayment.igst) ?? 0
  const sgst = Number(rideDetails?.ridePayment.sgst) ?? 0
  const stateTax = Number(rideDetails?.ridePayment.stateTax) ?? 0
  const platformFee = Number(rideDetails?.ridePayment.platformFee) ?? 0
  const platformFeeGst = Number(rideDetails?.ridePayment.platformFeeGst) ?? 0

  // const ridePercentage = Number(rideDetails?.ridePayment?.ridePercentage) ?? 0
  // const discount = Number(rideDetails?.ridePayment?.discount) ?? 0
  // const totalFare = basefare + ridePercentage

  const focus = useIsFocused()
  const { langCode } = useLanguage()

  const getFormattedDate = () => {
    moment.locale(langCode);
  }

  useEffect(() => {
    if (focus) {
      getFormattedDate()
      // dispatch(rideBillPdf(rideDetails?.id))
    }
  }, [focus])

  useEffect(() => {
    let locationData: RideLocationTypes[] = []
    if (rideDetails?.rideLocation && rideDetails?.rideLocation?.pickup && rideDetails?.rideLocation?.destination) {
      if (rideDetails?.rideLocation?.stop) {
        locationData = [rideDetails?.rideLocation?.pickup, ...rideDetails?.rideLocation?.stop, rideDetails?.rideLocation?.destination]
      } else {
        locationData = [rideDetails?.rideLocation?.pickup, rideDetails?.rideLocation?.destination]
      }
    }
    setLocation(locationData)
  }, [rideDetails?.rideLocation])

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      let deviceVersion = Number(DeviceInfo.getSystemVersion());
      let granted = PermissionsAndroid.RESULTS.DENIED;
      try {
        if (deviceVersion >= 13) {
          return granted = PermissionsAndroid.RESULTS.GRANTED;
        } else {

          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: t(TranslationKeys.storage_permission),
              message: t(TranslationKeys.app_needs_access),
              buttonNeutral: t(TranslationKeys.ask_me_later),
              buttonNegative: t(TranslationKeys.cancel),
              buttonPositive: t(TranslationKeys.ok)
            }
          );
          console.log("grant", granted)
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.log("error", err)
        return false;
      }
    } else {
      return true;
    }
  }

  const downloadRideBill = async (type: string) => {
    if (Platform.OS == "android") {
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) return;
    }
    let filename = ''
    if (type == 'receipt') {
      filename = 'rideBill.pdf'
    } else if (type == 'tax_invoice') {
      filename = 'rideTaxInvoce.pdf'
    } else {
      filename = 'ridePlatformFeesInvoce.pdf'
    }

    // const downloadDir = `${RNFS.ExternalDirectoryPath}`;
    // const path = `${downloadDir}/rideBill.pdf`;
    const downloadDir = Platform.OS === 'ios'
      ? `${RNFS.DocumentDirectoryPath}`  // iOS path
      : `${RNFS.ExternalDirectoryPath}`; // Android path
    const path = `${downloadDir}/${filename}`;
    await RNFS.mkdir(downloadDir);

    dispatch(rideBillPdf({ id: rideDetails?.id, type: type })).unwrap().then(async (res) => {

      let url = res.rideDetails.billUrl
      if (type == 'receipt') {
        url = res.rideDetails.billUrl
      } else if (type == 'tax_invoice') {
        url = res.rideDetails.taxInvoice
      } else {
        url = res.rideDetails.platformFeeInvoice
      }

      RNFS.downloadFile({
        fromUrl: url,
        toFile: path,
      }).promise.then(() => {
        FileViewer.open(path)
          .then(() => {
            // success
          })
          .catch(error => {
            console.error("Error opening file:", error);
          });
      }).catch((error) => {
        console.log("Download error: ", error);
      });
    }).catch(() => { })
  }


  const renderItem = ({ item, index }: { item: RideLocationTypes, index: number }) => {
    return (
      <View>
        <CommonDraggableItem
          disabled={true}
          icon={index == 0 ? Icons.ROUND_LOCATION_ICON : Icons.LOCATION_MARKER_ICON}
          iconStyle={{
            tintColor: index == 0 ? colors.SECONDARY_ICON : colors.PRIMARY
          }}
          item={item}
        />
        {index == location?.length - 1 ?
          null :
          <CommonDraggableDashView
            dashGap={3}
            dashLength={6}
            dashThickness={2.5}
          />
        }
        {index == location?.length - 1 ?
          null :
          <View style={Styles.listItemSepratorStyle} />
        }
      </View>
    );
  };

  const invoiceAmout1 = basefare + tipamount + cgst + sgst + igst + stateTax
  const invoiceAmout2 = platformFee + platformFeeGst

  return (
    <>
      {(rideLoading) ? <CustomActivityIndicator /> : null}
      <ScrollView style={GlobalStyle.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <CustomHeader onPress={() => {
          navigation.goBack()
        }}
          title={createRideDateTime}
        // headerRightComponent={
        //   <TouchableOpacity onPress={downloadRideBill}>
        //     <Image source={ImagesPaths.DOWNLOAD_ICON} style={{ width: wp(6), height: wp(6) }} />
        //   </TouchableOpacity>
        // }
        />
        <View style={Styles.headerSperator} />
        <CustomContainer>
          <View style={[GlobalStyle.rowContainer, Styles.profileContainer, { justifyContent: 'space-between' }]}>
            <View style={GlobalStyle.rowContainer}>
              <Image source={rideDetails?.driver?.profilePic && !userImageError ? { uri: rideDetails?.driver?.profilePic } : ImagesPaths.EMPTY_IMAGE} onError={() => {
                setUserImageError(true)
              }} style={Styles.userProfileStyle} />
              <View style={{ marginLeft: wp(3) }}>
                <Text style={GlobalStyle.subTitleStyle}>{rideDetails?.driver?.name ?? t(TranslationKeys.driver_not_found)}</Text>
                <Text style={Styles.commonTxtStyle}>{rideDetails?.driverCar?.name}</Text>
              </View>
            </View>
            <View style={Styles.completeContainer}>
              <Text style={Styles.completeTxt}>{t(TranslationKeys.completed)}</Text>
            </View>
          </View>
          {rideDetails?.deliveryDetails && (
          <View>
            <Text style={[Styles.commonTxtStyle, {marginTop:wp(2), fontFamily: Fonts.FONT_POP_SEMI_BOLD}]}>{t(TranslationKeys.delivery_ride)}</Text>
            <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between' }]}>
              <Text style={[Styles.requestTxtStyle,]}>{rideDetails?.deliveryDetails?.goodsType}</Text>
              <Text style={[Styles.requestTxtStyle,]}>{rideDetails?.deliveryDetails?.goodsWeight}{t(TranslationKeys.kg)} {rideDetails?.deliveryDetails?.goodsPackage}</Text>
            </View>
          </View>
          )}
          <View style={Styles.itemSeprator} />
          <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between' }]}>
            <Image source={ImagesPaths.DISTANCE_METER} style={Styles.distanceImgStyle} />
            <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, rideDetails?.ridePayment.totalFare, false, false)}</Text>
            <Text style={GlobalStyle.subTitleStyle}>{rideDetails?.distance} {t(TranslationKeys.km)}</Text>
            <Text style={GlobalStyle.subTitleStyle}>{rideDetails?.estimatedTime} {t(TranslationKeys.min)}</Text>
          </View>
          <View style={Styles.itemSeprator} />
          <View>
            <FlatList
              data={location}
              renderItem={renderItem}
            />
          </View>

          <TouchableOpacity onPress={() => downloadRideBill('receipt')} style={Styles.receiptContainer}>
            <Image source={Icons.RECEIPT} style={Styles.receiptImg} />
            <Text style={Styles.receiptTxt}>{t(TranslationKeys.receipt)}</Text>
          </TouchableOpacity>
          <View style={[Styles.itemSeprator2, { marginTop: wp(10) }]} />

          <TouchableOpacity
            onPress={() => downloadRideBill('tax_invoice')}
            style={[GlobalStyle.rowContainer, { paddingHorizontal: wp(1), justifyContent: 'space-between' }]}>
            <View style={GlobalStyle.rowContainer}>
              <Image source={Icons.RECEIPT2} style={Styles.receiptImg} />
              <View style={{ alignItems: 'flex-start', marginHorizontal: wp(5) }}>
                <Text style={Styles.viewTitleTxt}>{t(TranslationKeys.view_tax_invoice)}</Text>
                <View style={GlobalStyle.rowContainer}>
                  <Text style={Styles.viewAmountTxt}>{t(TranslationKeys.amount)} </Text>
                  <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, invoiceAmout1, false, false)}</Text>
                </View>
                <Text style={Styles.viewSubTitleTxt}>{t(TranslationKeys.access_download_invoice)}</Text>
              </View>
            </View>
            <Image source={Icons.RIGHT_ARROW_ICON}
              style={[Styles.rightArrowIconStyle]} />
          </TouchableOpacity>

          <View style={Styles.itemSeprator2} />

          <TouchableOpacity
            onPress={() => downloadRideBill('platform_fees_invoice')}
            style={[GlobalStyle.rowContainer, { paddingHorizontal: wp(1), justifyContent: 'space-between' }]}>
            <View style={GlobalStyle.rowContainer}>
              <Image source={Icons.RECEIPT2} style={Styles.receiptImg} />
              <View style={{ alignItems: 'flex-start', marginHorizontal: wp(5) }}>
                <Text style={Styles.viewTitleTxt}>{t(TranslationKeys.view_platform_fees_invoice)}</Text>
                <View style={GlobalStyle.rowContainer}>
                  <Text style={Styles.viewAmountTxt}>{t(TranslationKeys.amount)} </Text>
                  <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, invoiceAmout2, false, false)}</Text>
                </View>
                <Text style={Styles.viewSubTitleTxt}>{t(TranslationKeys.access_download_invoice)}</Text>
              </View>
            </View>
            <Image source={Icons.RIGHT_ARROW_ICON}
              style={[Styles.rightArrowIconStyle]} />
          </TouchableOpacity>
          <View style={Styles.itemSeprator2} />
          {/* <View style={Styles.itemSeprator} />
          <Text style={[GlobalStyle.subTitleStyle, { marginBottom: wp(2), fontFamily: Fonts.FONT_POP_MEDIUM }]}>{t(TranslationKeys.bill_details)}</Text>
          <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between', marginVertical: wp(2) }]}>
            <Text style={Styles.commonTxtStyle}>{t(TranslationKeys.your_trip)}</Text>
            <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, totalFare, false, false)}</Text>
          </View>
          {(rideDetails?.ridePayment.discount == null || rideDetails?.ridePayment.discount === '0.00') ? <></> :
            <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between', marginVertical: wp(2) }]}>
              <Text style={Styles.commonTxtStyle}>{t(TranslationKeys.discount_amount)}</Text>
              <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, discount, false, false)}</Text>
            </View>
          }
          {(rideDetails?.ridePayment.tipAmount == null || rideDetails?.ridePayment.tipAmount === '0.00') ? <></> :
            <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between', marginVertical: wp(2) }]}>
              <Text style={Styles.commonTxtStyle}>{t(TranslationKeys.tip_amount)}</Text>
              <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, rideDetails?.ridePayment.tipAmount, false, false)}</Text>
            </View>
          }
          <View style={Styles.itemSeprator} />
          {(!rideDetails?.ridePayment.stateTax || rideDetails?.ridePayment.stateTax == null || rideDetails?.ridePayment.stateTax === '0.00') ? <></> :
            <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between', marginVertical: wp(2) }]}>
              <Text style={Styles.commonTxtStyle}>{t(TranslationKeys.state_tax)}</Text>
              <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, rideDetails?.ridePayment.stateTax, false, false)}</Text>
            </View>
          }
          {(!rideDetails?.ridePayment.platformFee || rideDetails?.ridePayment.platformFee == null || rideDetails?.ridePayment.platformFee === '0.00') ? <></> :
            <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between', marginVertical: wp(2) }]}>
              <Text style={Styles.commonTxtStyle}>{t(TranslationKeys.platform_fee)}</Text>
              <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, rideDetails?.ridePayment.platformFee, false, false)}</Text>
            </View>
          }
          {(!rideDetails?.ridePayment.tollAmount || rideDetails?.ridePayment.tollAmount == null || rideDetails?.ridePayment.tollAmount === '0.00') ? <></> :
            <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between', marginVertical: wp(2) }]}>
              <Text style={Styles.commonTxtStyle}>{t(TranslationKeys.toll_amount)}</Text>
              <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, rideDetails?.ridePayment.tollAmount, false, false)}</Text>
            </View>
          }
          <View style={Styles.itemSeprator} />
          {(!rideDetails?.ridePayment.totalFare || rideDetails?.ridePayment.totalFare == null || rideDetails?.ridePayment.totalFare <= 0) ? <></> :
            <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between', marginVertical: wp(2) }]}>
              <Text style={Styles.commonTxtStyle}>{t(TranslationKeys.total_payable)}</Text>
              <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, rideDetails?.ridePayment.totalFare, false, false)}</Text>
            </View>
          }
          {(!rideDetails?.ridePayment.serviceTax || rideDetails?.ridePayment.serviceTax == null || rideDetails?.ridePayment.serviceTax === '0.00') ? <></> :
            <Text style={[Styles.seactCapacityTxtStyle, { textAlign: 'center' }]}>{t(TranslationKeys.includes)}&nbsp;{t(TranslationKeys.service_taxes)}&nbsp;{setPrice(t, rideDetails?.ridePayment.serviceTax)} </Text>
          }
          <ZigzagLines
            position="bottom"
            width={wp(100)}
            backgroundColor={colors.SHEET_INDICATOR}
            color={colors.PRIMARY_BACKGROUND}
            style={{ marginVertical: wp(4) }}
          />
          <Text style={GlobalStyle.subTitleStyle}>{t(TranslationKeys.payment)}</Text>
          <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between', marginVertical: wp(2) }]}>
            <Text style={Styles.commonTxtStyle}>{rideDetails?.ridePayment.paymentMethod == "CASH" ? t(TranslationKeys.cash) : t(TranslationKeys.cards)}</Text>
            <Text style={GlobalStyle.subTitleStyle}>{setPrice(t, rideDetails?.ridePayment.totalFare, false, false)}</Text>
          </View> */}
        </CustomContainer>
      </ScrollView>
      <CustomBottomBtn onPress={() => {
        dispatch(setRideStatusReducer(undefined))
        dispatch(resetRideOtpReducer())
        dispatch(setPaymentMethod("Card"))
        if (rideDetails?.rideStatus === RIDE_STATUS.CANCELLED) {
          navigation.reset({
            index: 0,
            routes: [{
              name: 'DrawerStack',
            }]
          })
        } else {
          analytics().logEvent(ANALYTICS_ID.RIDE_PAYMENT_COMPLETED, {
            'userDetails': {
              'id': tokenDetail?.userData?.id,
              'name': tokenDetail?.userData?.name,
              'phoneNumber': tokenDetail?.userData?.phoneNumber
            }
          })
          // if (rideDetails?.feedbackStatus?.riderGivenFeedback == true) {
          //   navigation.reset({
          //     index: 0, routes: [
          //       {
          //         name: 'DrawerStack',
          //         params: {
          //           screen: 'YourRidesScreen',
          //           params: {
          //             notificationType: undefined
          //           }
          //         }
          //       },
          //     ]
          //   })
          // }
          // else {
          if (from === "YourRidesScreen") {
            if (store.getState().RideSlice.rideDetails?.feedbackStatus?.riderGivenFeedback == true) {
              navigation.goBack()
            } else {
              navigation.navigate('RateDriverScreen', { rideId: rideDetails?.id, from: "YourRidesScreen" })
            }
          } else {
            navigation.reset({
              index: 1,
              routes: [{
                name: 'DrawerStack',
              },
              {
                name: 'RateDriverScreen',
                params: {
                  rideId: rideDetails?.id,
                  from: "YourRidesScreen"
                }
              }]
            })
          }
          // }
        }
      }} title={from === "YourRidesScreen" ? t(TranslationKeys.got_it) : t(TranslationKeys.end_ride)}
      // style={Styles.completedButton}
      />

    </>
  )
}

export default RideBillScreen

const useStyle = () => {
  const { colors } = useAppSelector(state => state.CommonSlice)
  const { locale } = useLanguage()

  return StyleSheet.create({
    headerSperator: {
      height: wp(0.8),
      backgroundColor: colors.SHEET_INDICATOR,
      shadowColor: colors.SHADOW_2,
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { height: 6, width: 0 },
      elevation: 10,
    },
    userProfileStyle: {
      width: wp(17),
      height: wp(17),
      resizeMode: 'cover',
      borderRadius: wp(17)
    },
    profileContainer: {
      marginTop: wp(2)
    },
    completeContainer: {
      backgroundColor: colors.BOTTOM_TOAST_CONTAINER,
      padding: wp(2),
      borderRadius: wp(2)
    },
    completeTxt: {
      fontFamily: Fonts.FONT_POP_SEMI_BOLD,
      color: colors.GREEN_ICON,
    },
    commonTxtStyle: {
      fontFamily: Fonts.FONT_POP_REGULAR,
      color: colors.PRIMARY_TEXT,
      textAlign: 'left'
    },
    ratingContainer: {
      marginLeft: wp(20),
      alignItems: 'flex-start',
    },
    starStyle: {
      marginLeft: wp(0),
    },
    itemSeprator: {
      height: wp(0.5),
      backgroundColor: colors.SHEET_INDICATOR,
      marginVertical: wp(4)
    },
    itemSeprator2: {
      height: wp(0.2),
      backgroundColor: colors.SHEET_INDICATOR,
      marginVertical: wp(4)
    },
    distanceImgStyle: {
      width: wp(10),
      height: wp(10),
      tintColor: colors.BOX_BORDER_PRIMARY
    },
    listItemSepratorStyle: {
      backgroundColor: colors.SEPARATOR_LINE,
      height: wp(0.4),
      width: "86%",
      alignSelf: 'center',
      marginLeft: wp(10),
      borderRadius: wp(2)
    },
    seactCapacityTxtStyle: {
      alignSelf: 'flex-start',
      fontFamily: Fonts.FONT_POP_REGULAR,
      fontSize: FontSizes.FONT_SIZE_10,
      color: colors.SECONDARY_TEXT,
      letterSpacing: 0.5,
    },
    bottomSheetContent: {
      flex: 1,
      backgroundColor: 'white',
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pdf: {
      flex: 1,
      width: '100%',
    },
    rightArrowIconStyle: {
      height: wp(4),
      width: wp(4),
      tintColor: colors.SECONDARY_ICON,
      resizeMode: 'contain',
      transform: [{ rotate: locale ? '180deg' : '0deg' }]
    },
    receiptContainer: {
      backgroundColor: colors.ALERT_BACKGROUND_COLOR,
      flexDirection: 'row', top: wp(2),
      alignSelf: 'flex-start',
      padding: wp(2),
      paddingHorizontal: wp(3),
      borderRadius: wp(5)
    },
    receiptTxt: {
      fontSize: FontSizes.FONT_SIZE_14,
      fontFamily: Fonts.FONT_POP_MEDIUM,
      marginLeft: wp(2),
      color: colors.PRIMARY_TEXT
    },
    receiptImg: {
      width: wp(5),
      height: wp(6)
    },
    viewTitleTxt: {
      fontSize: FontSizes.FONT_SIZE_15,
      fontFamily: Fonts.FONT_POP_MEDIUM,
      color: colors.PRIMARY_TEXT
    },
    viewAmountTxt: {
      fontSize: FontSizes.FONT_SIZE_14,
      fontFamily: Fonts.FONT_POP_MEDIUM,
      color: colors.PRIMARY_TEXT
    },
    viewSubTitleTxt: {
      fontFamily: Fonts.FONT_POP_REGULAR,
      fontSize: FontSizes.FONT_SIZE_13,
      color: colors.PRIMARY_TEXT,
    },
    requestTxtStyle: {
      color: colors.SECONDARY_TEXT,
      fontSize: FontSizes.FONT_SIZE_14,
      fontFamily: Fonts.FONT_POP_MEDIUM,
      maxWidth: wp(45)
    },
  })
}