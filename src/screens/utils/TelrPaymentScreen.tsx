import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    SafeAreaView,
    StyleSheet,
    View,
    Pressable,
    Text,
    Alert,
    TextInput,
    Platform,
} from "react-native";
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from "react-native-google-places-autocomplete";
import { LocationTypes, createDeliveryRide } from "../../redux/slice/homeSlice/HomeSlice";
import { store, useAppDispatch, useAppSelector } from "../../redux/Store";
import { useGlobalStyles } from "../../hooks/useGlobalStyles";
import TelrSdk from "../telr/TelrSdk";
import CustomContainer from "../../components/CustomContainer";
import CustomTextInput from "../../components/CustomTextInput";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import { Fonts } from "../../styles/Fonts";
import { FontSizes } from "../../styles/FontSizes";
import DeviceInfo from "react-native-device-info";
import { useLanguage } from "../../context/LanguageContext";
import useCustomNavigation from "../../hooks/useCustomNavigation";
import { AppAlert } from "../../utils/AppAlerts";
import { TranslationKeys } from "../../localization/TranslationKeys";
import { PICK_UP_MODE } from "../../utils/Constats";
import { RootStackParamList } from "../../types/RootStackType";
import { RouteProp, useRoute } from "@react-navigation/native";


const TelrPaymentScreen = () => {

    const navigation = useCustomNavigation("TelrPaymentScreen");
    const [telrModalVisible, setTelrModalVisible] = useState(false);
    const [paymentRequest, setPaymentRequest] = useState(null);
    const Styles = useStyles();
    const {userDetail,code} = useAppSelector(state => state.AuthSlice)
    const {deliveryDetails} = useAppSelector(state => state.RideSlice)
    const {locale} = useLanguage()
    const {t} = useTranslation()
    const dispatch = useAppDispatch()
    type NestedScreenRouteProp = RouteProp<RootStackParamList, 'TelrPaymentScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const merchantId = route.params?.merchantId;
    const { bookingDestinations, paymentMethod, rideQuotationList,createRideData } = useAppSelector(state => state.HomeSlice)

    const originLocation = {
        latitude: bookingDestinations[0]?.latitude,
        longitude: bookingDestinations[0]?.longitude,
        state: bookingDestinations[0]?.state
    }
    const destinationLocation = {
        latitude: bookingDestinations[bookingDestinations.length - 1]?.latitude,
        longitude: bookingDestinations[bookingDestinations.length - 1]?.longitude,
        state: bookingDestinations[bookingDestinations.length - 1]?.state
    }
    
    const telrModalClose = () => {
        setTelrModalVisible(false);
        // Alert.alert("Transaction aborted by user");
        navigation.goBack()
        
    };
    const didFailWithError = (message) => {
        setTelrModalVisible(false);
        console.log("message-didFailWithError",message)
        Alert.alert(
            `${message}`,
            '',[
                {
                    text: t(TranslationKeys.ok),
                    onPress: () => {
                        if(message === "Cancelled"){
                            navigation.goBack()
                        }
                        if(message === "Email not valid/not supplied"){
                            navigation.navigate("EditProfileScreen")
                            // navigation.reset({
                            //     index: 0, routes: [
                            //         {
                            //             name: 'DrawerStack',
                            //             params: {
                            //                 screen: 'EditProfileScreen',
                            //                 // params: {isOpenFrom: "BookingScreen"}
                            //             }
                            //         },
                            //     ]
                            // })
                        }
                    }
                },
            ]
        );
    };
    const didPaymentSuccess = (response) => {
        console.log("didPaymentSuccess",response);
        setTelrModalVisible(false);
        if(response.message === "Authorised"){
            if(store.getState().HomeSlice?.createDeliveryRideData){
                navigation.navigate("SearchingRiderScreen", { id: store.getState().HomeSlice?.createDeliveryRideData?.id , isDeliveryModule: true})
            }else {
             console.log("id--createRideData", createRideData?.id)
            navigation.navigate("SearchingRiderScreen", { id: store.getState().HomeSlice?.createRideData?.id })
         }
       
        }else {    
            Alert.alert(response.message, '',[
                {
                    text: t(TranslationKeys.ok),
                    onPress: () => {
                      navigation.goBack()
                    }
                }
            ]);
        }
    };

    const showTelrPaymentPage = async () => {
       
        const deviceId = await DeviceInfo.getUniqueId();
        const APP_VERSION = DeviceInfo.getVersion()
        var paymentRequest = {
            sdk_env: "prod", //prod//dev
            something_went_wrong_message: "Something went wrong", //  this message for suppose someitng is happen wrong with payment then you can config this one.
            store_id: "32000",
            key: "JJks@jC6ML^mVpNg",
            device_type: Platform.OS, //Android
            device_id: deviceId,
            app_name: "RYD Now", //enter app name
            app_version: APP_VERSION, //app version
            app_user: "123456", //app user
            app_id: "6670171093", //app user id
            tran_test: "1", // 1=test, 0=production
            tran_type: "auth", //sale
            tran_class: "paypage",
            tran_cartid: merchantId, //enter cart id it shoud be unique for every transaction //1234567890
            tran_description: "Test Mobile API", // enter tran description
            tran_currency: "AED",
            tran_amount: deliveryDetails ? deliveryDetails?.selectedCar?.fare : createRideData?.totalFare,
            tran_language: locale,
            tran_firstref: null,
            // billing_name_title: "Mr",
            billing_name_first: userDetail?.name,
            // billing_name_last: billing_name_last,
            // billing_address_line1: "sclk lk fk",
            // billing_address_city: "Riyad",
            // billing_address_region: "Saudi Arabia",
            billing_address_country: code,
            billing_custref: null,
            billing_email: userDetail?.email,
            billing_phone: userDetail?.phoneNumber,
        };
        setPaymentRequest(paymentRequest);
        setTelrModalVisible(true);
    };
    
    useEffect(() => {
        // setTelrModalVisible(true);
        showTelrPaymentPage()
    },[])

    return (
        <SafeAreaView style={Styles.backgroundStyle}>
            <TelrSdk
                // backButtonText={"Back"}
                buttonBackStyle={Styles.buttonBackStyle}
                buttonBackColor={Styles.buttonBackColor}
                backButtonTextStyle={Styles.backButtonTextStyle}
                paymentRequest={paymentRequest}
                telrModalVisible={telrModalVisible}
                telrModalClose={telrModalClose}
                didFailWithError={didFailWithError}
                didPaymentSuccess={didPaymentSuccess}
            />
        </SafeAreaView>
    );
};

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        backgroundStyle: {
            backgroundColor: "white",
            flex: 1,
        },
        centeredView: {
            flex: 1,
            marginTop: 22,
            margin: 22,
        },
        headerCloseIconStyle: {
            width: wp(4),
            height: wp(4),
            resizeMode: 'contain',
            tintColor: colors.PRIMARY,
            marginHorizontal: wp(1.5)
        },
        telrTextStyle: {
            color: "#2196F3",
            fontWeight: "bold",
            textAlign: "center",
            fontSize: 40,
            paddingTop: 20,
            marginBottom: 30,
        },
        buttonPay: {
            borderRadius: 10,
            padding: 10,
            elevation: 2,
        },
        buttonPayment: {
            backgroundColor: "#2196F3",
            marginTop: 20,
        },
        payButtonTextStyle: {
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
        },
        buttonBackStyle: {
            borderRadius: 10,
            padding: 5,
            margin: 5,
            elevation: 2,
            width: 80,
        },
        buttonBackColor: {
            backgroundColor: "#2196F3",
        },
        backButtonTextStyle: {
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
        },
        inputTextStyle: {
            marginTop: 10,
            color: "black",
            fontWeight: "bold",
            textAlign: "left",
            fontSize: 14,
        },
        input: {
            marginTop: 10,
            height: 40,
            borderWidth: 1,
            padding: 10,
        },
        conatiner: {
            backgroundColor: colors.WHITE_ICON,
            padding: wp(4),
            borderRadius: wp(2),
            // borderColor: colors.BOX_BORDER,
            // borderWidth: wp(0.5)
        },
        senderText: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_16,
            color: colors.PRIMARY_TEXT,
            marginBottom: wp(2)
        },
        textInputLabelText: {
            fontSize: FontSizes.FONT_SIZE_14,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
            marginVertical: wp(1),
            textAlign: 'left'
        },
        customIconContainerStyle: {
            flexDirection: 'row',
            alignItems: 'center',
            width: wp(12),
            justifyContent: 'space-around',
        },
        mapIconStyle: {
            width: wp(5),
            height: wp(5),
            tintColor: colors.PRIMARY_ICON,
            resizeMode: 'contain'
        },
        googleTextInputListView: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            alignSelf: 'center',
            width: "100%",
            paddingLeft: wp(5),
        },
        googleTextInputDescription: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_14,
        },
        googleTextInputContainer: {
            flexDirection: 'row',  // Align text input and button in a row
            alignItems: 'center',
            height: wp(12),
            overflow: 'hidden',
            paddingRight: wp(8),  // General padding for the container
            textAlign: 'left',
            borderRadius: wp(2),
            borderWidth: wp(0.3),
            borderColor: colors.BOX_BORDER,
            width: "100%",
            backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
        },
        searchLocationTextInputStyle: {
            flex: 1,  // Ensures input takes available space
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_12,
            color: colors.PRIMARY_TEXT,
            marginTop: wp(1),
            textAlign: 'left',
            paddingRight: wp(8),
        },
        googlePlaceAutoCompleteContainer: {
            // paddingHorizontal: wp(1),
            // position: 'absolute',
            // top: hasNotch() ? wp(15) : wp(20),
            flex: 1,
            // padding: wp(4),
            marginTop: wp(2),
            borderRadius: wp(3)
        },
        pickLocationTextInputStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_15,
            color: colors.PRIMARY_TEXT,
            marginTop: wp(1),
            // textAlign: 'left',
            // borderRadius: wp(2),
            // borderWidth: wp(0.3),
            // borderColor: colors.BOX_BORDER,
            // alignItems: 'center',
            backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
            height: wp(10)
        },
        currentLocationDotView: {
            height: wp(3),
            width: wp(3),
            backgroundColor: colors.PRIMARY_ICON,
            borderRadius: wp(3),
            marginHorizontal: wp(3)
        },
        closeIconStyle: {
            width: wp(4),
            height: wp(4),
            resizeMode: 'contain',
            tintColor: colors.PRIMARY_ICON,
        },
        dropDown: {
            borderRadius: wp(2),
            borderWidth: wp(0.3),
            alignItems: 'center',
            backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
            height: wp(14),
            marginHorizontal: wp(0),
            marginBottom: wp(10)
        },
        radioIconStyle: {
            width: wp(5),
            height: wp(5),
            resizeMode: 'contain',
        },
        packageTypeContainer: {
            borderWidth: wp(0.3),
            padding: wp(3),
            width: '48.5%',
            borderRadius: wp(2),
            marginRight: wp(2),
            marginBottom: wp(2)
        },
        packageTitle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_15,
            color: colors.PRIMARY_TEXT,
            marginLeft: wp(3)
        },
        maximumText: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_13,
            color: colors.SECONDARY_TEXT,
            marginTop: wp(2)
        }
    });
}

export default TelrPaymentScreen;