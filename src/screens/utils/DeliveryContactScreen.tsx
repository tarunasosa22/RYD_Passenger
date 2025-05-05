import { NativeScrollEvent, Platform, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native'
import React, { useDebugValue, useEffect, useRef, useState } from 'react'
import { store, useAppSelector } from '../../redux/Store'
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import CustomHeader from '../../components/CustomHeader';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../../localization/TranslationKeys';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CustomContainer from '../../components/CustomContainer';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import CustomTextInput from '../../components/CustomTextInput';
import CommonErrorText from '../../components/CommonErrorText';
import * as  yup from 'yup'
import { useFormik } from 'formik';
import { NameRegExp, PhoneRegExp } from '../../utils/ScreenUtils';
import CustomPhoneTextInput from '../../components/CustomPhoneTextInput';
import { useLanguage } from '../../context/LanguageContext';
import { GOOGLE_MAP_API } from '../../config/Host';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { DestinationsProps, LocationTypes, setAppliedCoupon, setBookingDestinations, setFilteredDestinations } from '../../redux/slice/homeSlice/HomeSlice';
import { FlatList } from 'react-native';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import { DestinationProps, RecentLocationsProps } from '../home/DestinationLocationScreen';
import { AppAlert } from '../../utils/AppAlerts';
import { useDispatch } from 'react-redux';
import { Image } from 'react-native';
import { Icons } from '../../utils/IconsPaths';
import CustomIconButton from '../../components/CustomIconButton';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NativeSyntheticEvent } from 'react-native';
import CommonDropDownComponent from '../../components/CommonDropDownComponent';
import { TouchableOpacity } from 'react-native';
import CustomRadioButton from '../../components/CustomRadioButton';
import { GoodsTypeProps, goodsInfoApi, setDeliveryDetails, setGoodsType, setPackageType } from '../../redux/slice/rideSlice/RideSlice';
import { useIsFocused } from '@react-navigation/native';
import { geoCoderAddress } from '../../utils/HelperFunctions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'native-base';
import CommonStepersContainer from '../../components/CommonStepersContainer';

interface DeliveryDetailsScreensTypes {
    id: number,
    title: string
}

interface GoodTypes {
    // id: number
    label: string,
    value: string
}

const DeliveryContactScreen = () => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const { t } = useTranslation()
    const navigation = useCustomNavigation('DeliveryContactScreen');
    const { userDetail, cc, code, userCordinates } = useAppSelector(state => state.AuthSlice)
    const { goodsType, packageType, goodsInfo } = useAppSelector(state => state.RideSlice)
    const { bookingDestinations, destinations } = useAppSelector(state => state.HomeSlice)
    const { locale } = useLanguage()
    const flatListRef = useRef<FlatList<DestinationsProps | null>>(null);
    const keyBoardAvoidingRef = useRef<KeyboardAwareScrollView | null>(null);
    const dispatch = useDispatch()
    const [searchLocation, setSearchLocation] = useState<{
        id?: string,
        address?: string,
        latitude?: number,
        longitude?: number,
    } | undefined>(undefined);
    const [locationInputFeildCoordinate, setLocationInputFeildCoordinate] = useState<LocationTypes | undefined>(bookingDestinations[0]);
    const [locationReceiverInputFeildCoordinate, setLocationReceiverInputFeildCoordinate] = useState<LocationTypes | undefined>(bookingDestinations[1]);
    const [isShowCancelLocation, setIsShowCancelLocation] = useState<boolean>();
    const [isShowCancelReceiverLocation, setIsShowCancelReceiverLocation] = useState<boolean>();
    const [currentScreen, setCurrentScreen] = useState(false);
    const [selectItem, setSelectItem] = useState<any>()
    const focus = useIsFocused()
    const [newGoods, setNewGoods] = useState<GoodTypes[] | []>([])
    const [ErrorText, setErrorText] = useState('')
    const [selectedCountry, setselectedCountry] = useState(cc?.replace('+', ''))
    const [selectedSenderCountry, setselectedSenderCountry] = useState(cc?.replace('+', ''))
    const [goodPackage, setgoodPackage] = useState('')
    const googlePlacesRef = useRef<GooglePlacesAutocompleteRef>(null)
    const googlePlacesRefReceiver = useRef<GooglePlacesAutocompleteRef>(null)
    const [focusedWeight, setFocusedWeight] = useState(false);
    const [selectedGoodType, setSelectedGoodType] = useState({ lable: "", isError: false })
    const [selectedPackageType, setSelectedPackageType] = useState({ lable: "", isError: false })

    useEffect(() => {
        if (focus) {
            dispatch(goodsInfoApi(null)).unwrap().then((res: any) => {
                dispatch(setGoodsType(res.goodsType))
                // dispatch(setPackageType(res.packageType))
                let newGoodType: any[] = []
                res?.goodsType?.map((item) => {
                    newGoodType.push({
                        label: item,
                        value: item
                    })
                })
                setNewGoods(newGoodType)
            }).catch((e: any) => { })
        }
    }, [focus])

    const senderDetailsSchema = yup.object().shape({
        senderName: yup.string().trim().required(t(TranslationKeys.please_enter_name)).matches(NameRegExp, t(TranslationKeys.name_cannot_containe_number)).max(50, t(TranslationKeys.name_not_exceed)),
        receiverName: yup.string().trim().required(t(TranslationKeys.please_enter_name)).matches(NameRegExp, t(TranslationKeys.name_cannot_containe_number)).max(50, t(TranslationKeys.name_not_exceed)),
        senderPhoneNumber: yup.string().trim().min(4, t(TranslationKeys.please_enter_valid_phone_number)).required(t(TranslationKeys.phone_number_is_requried)),
        receiverPhoneNumber: yup.string().trim().min(4, t(TranslationKeys.please_enter_valid_phone_number)).required(t(TranslationKeys.phone_number_is_requried)),
        receiverAddress: yup.string().trim().test(
            'receiverAddress',
            (t(TranslationKeys.please_enter_delivery_address)),
            function (value) {
                if (this.parent.receiverAddressTouched || !bookingDestinations[1]?.address) {
                    return !!value; 
                }
                return true;
            }
        ),
        senderAddress: yup.string().trim().test(
            'senderAddress',
            (t(TranslationKeys.please_enter_pickup_address)),
            function (value) {
                if (this.parent.senderAddressTouched || !bookingDestinations[0]?.address) {
                    return !!value;
                }
                return true; 
            }
        ),
    });

    const packageDetailsSchema = yup.object().shape({
        goodsType: yup.object({
            label: yup.string().trim().required(t(TranslationKeys.please_select_good_type))
        }),
        goodPackage: yup.string().required(t(TranslationKeys.choose_package_type)),
        packageWeight: yup
            .number()
            .typeError(t(TranslationKeys.please_enter_valid_weight)) // Ensures input is a number
            .max(Number(goodsInfo?.maxWeight), `${t(TranslationKeys.not_enter_maximum_weight)} ${goodsInfo?.maxWeight} ${t(TranslationKeys.kg)}.`) // ✅ Weight must be more than 50
            .required(t(TranslationKeys.please_enter_weight)),
    });

    const {
        handleChange,
        handleSubmit,
        values,
        errors,
        touched,
        resetForm,
        validateField,
        setFieldValue,
        setFieldTouched,
        setFieldError,
        setValues
    } = useFormik({
        initialValues: {
            senderName: userDetail?.name ?? '',
            senderPhoneNumber: userDetail?.phoneNumber ?? '',
            receiverName: '',
            goodsType: {
                label: ""
            },
            packageWeight: '',
            goodPackage: '',
            receiverPhoneNumber: '',
            senderAddress: bookingDestinations[0]?.address ?? '',
            receiverAddress: bookingDestinations[1]?.address ?? '',
            senderAddressTouched: false,
            receiverAddressTouched: false,
        },
        enableReinitialize: true,
        // validateOnChange: false,// ✅ Prevents all fields from being validated on every change
        // validateOnBlur: true,
        validationSchema: !currentScreen ? senderDetailsSchema : packageDetailsSchema,
        onSubmit: (values) => {
            if (!currentScreen) {
                if ((values.senderAddressTouched || !bookingDestinations[0]?.address) && !values.senderAddress) {
                    setFieldError('senderAddress', t(TranslationKeys.please_enter_pickup_address));
                    return;
                }

                if ((values.receiverAddressTouched || !bookingDestinations[1]?.address) && !values.receiverAddress) {
                    setFieldError('receiverAddress', t(TranslationKeys.please_enter_delivery_address));
                    return;
                }
        
                setCurrentScreen(true);
                dispatch(setBookingDestinations(destinations))
            } else {
                const params: {
                    senderFullName?: string
                    senderPhoneNumber?: string
                    receiverFullName?: string
                    receiverPhoneNumber?: string
                    goodsType?: string
                    goodsPackage?: string
                    goodsWeight?: any
                    senderPickupAddress?: any
                    receiverDeliveryAddress?: any
                } = {
                    senderFullName: values.senderName,
                    senderPhoneNumber: values.senderPhoneNumber.startsWith('+') ? values.senderPhoneNumber : '+' + selectedSenderCountry + values.senderPhoneNumber,
                    receiverFullName: values.receiverName,
                    receiverPhoneNumber: '+' + selectedCountry + values.receiverPhoneNumber,
                    goodsType: values.goodsType.label,
                    goodsPackage: values.goodPackage,
                    goodsWeight: values.packageWeight,
                };

                if (locationInputFeildCoordinate?.address) {
                    params.senderPickupAddress = locationInputFeildCoordinate?.address;
                }

                if (locationReceiverInputFeildCoordinate?.address) {
                    params.receiverDeliveryAddress = locationReceiverInputFeildCoordinate?.address;
                }
                dispatch(setDeliveryDetails(params));
                dispatch(setAppliedCoupon(-1))
                navigation.navigate("BookingScreen", { isDeliveryModule: true });
            }
        }

    })

    useEffect(() => {
        if (bookingDestinations[0]?.address) {
            setFieldValue('senderAddress', bookingDestinations[0].address);
            setLocationInputFeildCoordinate(bookingDestinations[0]);
        }
        if (bookingDestinations[1]?.address) {
            setFieldValue('receiverAddress', bookingDestinations[1].address); 
            setLocationReceiverInputFeildCoordinate(bookingDestinations[1]); 
        }
    }, [bookingDestinations]);

    const getStateFromAddressComponents = (addressComponents: any) => {
        // Loop through the address components to find the "administrative_area_level_1"
        const stateComponent = addressComponents.find(
            (component: any) => component.types.includes('administrative_area_level_1')
        );
        return stateComponent ? stateComponent.long_name : null; 
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        return (
            <TouchableOpacity
                style={[GlobalStyle.rowContainer, Styles.packageTypeContainer, { borderColor: selectItem == index ? colors.PRIMARY_TEXT : colors.DOTTED_BORDER }]}
                onPress={() => {
                    setgoodPackage(item)
                    setSelectItem(index)
                    setFieldValue("goodPackage", item)
                    setSelectedPackageType({ lable: item, isError: false })
                }}>
                <Image source={selectItem == index ? Icons.SELECTED_RADIO_BUTTON_ICON : Icons.RADIO_BUTTON_ICON} style={[Styles.radioIconStyle, { tintColor: colors.SECONDARY_ICON, }]} />
                <Text style={Styles.packageTitle}>{item}</Text>
            </TouchableOpacity>
        )
    }

    const addNewdestination = (location: RecentLocationsProps & DestinationProps, isSender: boolean) => {

        const olddestinationData = [...destinations]
        const findLocation = olddestinationData.find((item) => ((item?.latitude == location?.latitude) && (item.longitude == location.longitude)))
        let newData = {
            id: Math.random().toFixed(3).toString(),
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
            state: location.state
        }
        if (!findLocation) {
            if (isSender) {
                olddestinationData[0] = newData;
            } else {
                olddestinationData[1] = newData;
            }
        }
        dispatch(setFilteredDestinations(olddestinationData))

    };

    return (
        <>
            <View style={GlobalStyle.container}>
                {/* {(isLoading) ? <CustomActivityIndicator /> : null} */}
                <CommonStepersContainer step={!currentScreen ? 1 : 2} />
                <CustomHeader
                    safeAreacontainer={{ backgroundColor: colors.PRIMARY_BACKGROUND }}
                    headerStyle={{ marginVertical: wp(1) }}
                    edges={["left"]}
                    title={currentScreen ? t(TranslationKeys.package_details) : t(TranslationKeys.delivery_contact_details)}
                    onPress={() => {
                        if (currentScreen) {
                            setSelectItem(-1)
                            setFieldValue("goodsType", '');
                            setFieldValue("goodPackage", '');
                            setFieldValue("packageWeight", '');
                            setCurrentScreen(false)
                        } else {
                            navigation.goBack()
                        }
                    }} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : 'padding'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight} // 50 is Button height
                    enabled
                    style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps={'handled'} showsVerticalScrollIndicator={false}>
                        <CustomContainer>
                            {!currentScreen ? <>
                                <View style={Styles.conatiner}>
                                    <Text style={Styles.senderText}>{t(TranslationKeys.sender_details)}</Text>
                                    <Text style={Styles.textInputLabelText}>{t(TranslationKeys.full_name)}</Text>
                                    <CustomTextInput
                                        maxLength={50}
                                        isError={(errors.senderName && touched.senderName)}
                                        style={{ paddingVertical: Platform.OS === 'ios' ? 0 : wp(2) }}
                                        value={values.senderName}
                                        onChangeText={handleChange('senderName')}
                                        placeholder={`${t(TranslationKeys.enter_sender_name)}`} />
                                    {(touched.senderName && errors.senderName) ? <CommonErrorText title={errors.senderName} /> : null}
                                    <Text style={Styles.textInputLabelText}>{t(TranslationKeys.phone_number)}</Text>
                                    <CustomPhoneTextInput
                                        isError={(errors.senderPhoneNumber && touched.senderPhoneNumber)}
                                        iscountryshow={true}
                                        selectedCountry={selectedSenderCountry}
                                        setSelectCountry={setselectedSenderCountry}
                                        textInputStyle={{
                                            color: colors.PRIMARY_TEXT,
                                            textAlign: locale ? 'right' : 'left'
                                        }}
                                        // countryPickerDisable={true}
                                        editable={true}
                                        onChangeText={handleChange('senderPhoneNumber')}
                                        value={values.senderPhoneNumber.replace('+' + cc, '')} />
                                    {touched.senderPhoneNumber && errors.senderPhoneNumber ? <CommonErrorText title={errors.senderPhoneNumber} /> : null}
                                    <Text style={Styles.textInputLabelText}>{t(TranslationKeys.pickup_address)}</Text>
                                    <View style={Styles.googlePlaceAutoCompleteContainer}>
                                        <GooglePlacesAutocomplete
                                            ref={googlePlacesRef}
                                            placeholder={t(TranslationKeys.enter_complete_address)}
                                            onPress={(data, details) => {
                                                if (details?.geometry?.location) {
                                                    const { lat, lng } = details?.geometry?.location
                                                    if (lat && lng) {
                                                        const addressComponents = details?.address_components;
                                                        const state = getStateFromAddressComponents(addressComponents);
                                                        const address: RecentLocationsProps & DestinationProps = {
                                                            id: Math.random().toFixed(3).toString(),
                                                            address: details?.formatted_address,
                                                            latitude: lat,
                                                            longitude: lng,
                                                            state: state
                                                        };
                                                        addNewdestination(address, true)
                                                        setLocationInputFeildCoordinate(address)
                                                        setFieldTouched('senderAddress', true);
                                                        setFieldValue('senderAddress', address.address);
                                                        setFieldValue('senderAddressTouched', true);
                                                        setFieldError('senderAddress', '');
                                                    }
                                                }
                                            }}
                                            onFail={(e) => { console.log(e) }}
                                            isRowScrollable={false}
                                            styles={{
                                                listView: Styles.googleTextInputListView,
                                                description: Styles.googleTextInputDescription,
                                                textInputContainer: [Styles.googleTextInputContainer, { borderColor: (errors.senderAddress && touched.senderAddress ? colors.ERROR_TEXT : colors.BOX_BORDER) }],
                                                textInput: Styles.pickLocationTextInputStyle,
                                            }}
                                            fetchDetails={true}
                                            keepResultsAfterBlur={true}
                                            textInputProps={{
                                                clearButtonMode: 'never',
                                                onChangeText: (text) => {
                                                    setLocationInputFeildCoordinate({ address: text });
                                                    setFieldTouched('senderAddress', true);
                                                    setFieldValue('senderAddress', text);
                                                    setFieldValue('senderAddressTouched', true); 
                                                    if (!text) {
                                                        setFieldError('senderAddress', t(TranslationKeys.please_enter_pickup_address));
                                                    } else {
                                                        setFieldError('senderAddress', ''); 
                                                    }
                                                },
                                                placeholderTextColor: colors.SECONDARY_TEXT,
                                                value: locationInputFeildCoordinate?.address
                                            }}
                                            enablePoweredByContainer={false}
                                            renderRightButton={() => {
                                                return (
                                                    locationInputFeildCoordinate?.address ?
                                                        <CustomIconButton icon={Icons.CLOSE_ICON} iconStyle={Styles.closeIconStyle}
                                                            onPress={() => {
                                                                googlePlacesRef?.current?.setAddressText("")
                                                                googlePlacesRef?.current?.blur()
                                                                setLocationInputFeildCoordinate(undefined)
                                                                setFieldTouched('senderAddress', true);
                                                                setFieldValue('senderAddress', '');
                                                                setFieldValue('senderAddressTouched', true);
                                                                setFieldError('senderAddress', t(TranslationKeys.please_enter_pickup_address));
                                                            }} /> : <></>
                                                )
                                            }}
                                            query={{
                                                key: store.getState().AuthSlice.commonCredentialsData?.googleApiKey,
                                                language: 'en',
                                                components: `country:${code}`,
                                            }}
                                        />
                                        {touched.senderAddress && errors.senderAddress && (<CommonErrorText title={errors.senderAddress} />)}
                                    </View>
                                </View>
                                <View style={[Styles.conatiner, { marginTop: wp(6) }]}>
                                    <Text style={Styles.senderText}>{t(TranslationKeys.receiver_details)}</Text>
                                    <Text style={Styles.textInputLabelText}>{t(TranslationKeys.full_name)}</Text>
                                    <CustomTextInput
                                        maxLength={50}
                                        isError={(errors.receiverName && touched.receiverName)}
                                        style={{ paddingVertical: Platform.OS === 'ios' ? 0 : wp(2) }}
                                        value={values.receiverName} onChangeText={handleChange('receiverName')} placeholder={`${t(TranslationKeys.enter_receiver_name)}`} />
                                    {(touched.receiverName && errors.receiverName) ? <CommonErrorText title={errors.receiverName} /> : null}
                                    <Text style={Styles.textInputLabelText}>{t(TranslationKeys.phone_number)}</Text>
                                    <CustomPhoneTextInput
                                        iscountryshow={true}
                                        // countryPickerDisable={true}
                                        selectedCountry={selectedCountry}
                                        value={values.receiverPhoneNumber}
                                        onChangeText={handleChange("receiverPhoneNumber")}
                                        setSelectCountry={setselectedCountry}
                                        isError={(errors.receiverPhoneNumber && touched.receiverPhoneNumber)}
                                    />
                                    {touched.receiverPhoneNumber && errors.receiverPhoneNumber ? <CommonErrorText title={errors.receiverPhoneNumber} /> : null}
                                    <Text style={Styles.textInputLabelText}>{t(TranslationKeys.delivery_address)}</Text>
                                    <View style={Styles.googlePlaceAutoCompleteContainer}>
                                        <GooglePlacesAutocomplete
                                            ref={googlePlacesRefReceiver}
                                            placeholder={t(TranslationKeys.enter_complete_address)}
                                            onPress={(data, details) => {
                                                if (details?.geometry?.location) {
                                                    const { lat, lng } = details?.geometry?.location
                                                    if (lat && lng) {
                                                        const addressComponents = details?.address_components;
                                                        const state = getStateFromAddressComponents(addressComponents);
                                                        const address: RecentLocationsProps & DestinationProps = {
                                                            id: Math.random().toFixed(3).toString(),
                                                            address: details?.formatted_address,
                                                            latitude: lat,
                                                            longitude: lng,
                                                            state: state
                                                        };
                                                        addNewdestination(address, false)
                                                        setLocationReceiverInputFeildCoordinate(address)
                                                        setFieldTouched('receiverAddress', true);
                                                        setFieldValue('receiverAddress', address.address);
                                                        setFieldValue('receiverAddressTouched', true);
                                                        setFieldError('receiverAddress', '');
                                                    }
                                                }
                                            }}
                                            onFail={(e) => { console.log(e) }}
                                            isRowScrollable={false}
                                            styles={{
                                                listView: Styles.googleTextInputListView,
                                                description: Styles.googleTextInputDescription,
                                                textInputContainer: [Styles.googleTextInputContainer, { borderColor: (errors.receiverAddress && touched.receiverAddress ? colors.ERROR_TEXT : colors.BOX_BORDER) }],
                                                textInput: Styles.pickLocationTextInputStyle,
                                            }}
                                            fetchDetails={true}
                                            keepResultsAfterBlur={true}
                                            textInputProps={{
                                                clearButtonMode: 'never',
                                                onChangeText: (text) => {
                                                    setLocationReceiverInputFeildCoordinate({ address: text });
                                                    setFieldTouched('receiverAddress', true);
                                                    setFieldValue('receiverAddress', text);
                                                    if (!text) {
                                                        setFieldError('receiverAddress', t(TranslationKeys.please_enter_delivery_address)); // Set error if text is empty
                                                    } else {
                                                        setFieldError('receiverAddress', ''); // Clear error if text is not empty
                                                    }
                                                },
                                                placeholderTextColor: colors.SECONDARY_TEXT,
                                                value: locationReceiverInputFeildCoordinate?.address,
                                            }}
                                            enablePoweredByContainer={false}
                                            renderRightButton={() => {
                                                return (
                                                    locationReceiverInputFeildCoordinate?.address ?
                                                        <CustomIconButton icon={Icons.CLOSE_ICON} iconStyle={Styles.closeIconStyle} onPress={() => {
                                                            googlePlacesRefReceiver?.current?.setAddressText("")
                                                            googlePlacesRefReceiver?.current?.blur()
                                                            setLocationReceiverInputFeildCoordinate(undefined)
                                                            setFieldTouched('receiverAddress', true);
                                                            setFieldValue('receiverAddress', '');
                                                            setFieldValue('receiverAddressTouched', true);
                                                            setFieldError('receiverAddress', t(TranslationKeys.please_enter_delivery_address));
                                                        }} /> : <></>
                                                )
                                            }}
                                            // renderLeftButton={() => {
                                            //     return (
                                            //         <View style={[Styles.currentLocationDotView, { marginHorizontal: 0 }]} />
                                            //     )
                                            // }}
                                            query={{
                                                key: store.getState().AuthSlice.commonCredentialsData?.googleApiKey,
                                                language: 'en',
                                                components: `country:${code}`,
                                            }}
                                        />
                                        {touched.receiverAddress && errors.receiverAddress && (
                                            <CommonErrorText title={errors.receiverAddress} />
                                        )}
                                    </View>
                                </View>
                            </> : <>
                                <View style={Styles.conatiner}>
                                    <Text style={Styles.senderText}>{t(TranslationKeys.goods_type)}</Text>
                                    <CommonDropDownComponent
                                        labelField="label"
                                        valueField="value"
                                        placeholder={t(TranslationKeys.please_select_good_type)}
                                        placeholderStyle={{ color: colors.SECONDARY_TEXT, fontSize: FontSizes.FONT_SIZE_16 }}
                                        data={newGoods}
                                        keyboardAvoiding={true}
                                        value={values.goodsType.label}
                                        isError={(errors.goodsType?.label && touched.goodsType?.label)}
                                        onChange={(item: GoodTypes) => {
                                            const goodTypeData = {
                                                label: item.value,
                                            }
                                            // setSelectedGoodType({ lable: item.value, isError: false })
                                            setFieldValue("goodsType", goodTypeData);
                                        }}
                                        style={[Styles.dropDown]}
                                        txtStyle={{width:wp(70)}}
                                    />
                                    <Text style={[Styles.senderText, { marginBottom: wp(3) }]}>{t(TranslationKeys.package_type)}</Text>
                                    <FlatList
                                        data={store.getState()?.RideSlice?.goodsInfo?.packageType ?? []}
                                        renderItem={renderItem}
                                        numColumns={2}
                                        keyExtractor={(index) => index.toString()}
                                        showsVerticalScrollIndicator={false}
                                        bounces={false}
                                    />
                                    {touched.goodPackage && errors.goodPackage && (<CommonErrorText title={errors.goodPackage} />)}
                                    <Text style={[Styles.senderText, { marginTop: wp(10), marginBottom: wp(3) }]}>{t(TranslationKeys.package_weight)}</Text>
                                    <View style={GlobalStyle.rowContainer}>
                                        <CustomTextInput
                                            isError={(errors.packageWeight && touched.packageWeight)}
                                            keyboardType='number-pad'
                                            returnKeyType='done'
                                            textInputContainerStyle={{ width: '91%' }}
                                            value={values.packageWeight}
                                            onChangeText={handleChange('packageWeight')}
                                            onFocus={() => setFocusedWeight(true)}   // ✅ Track focus on weight field
                                            onBlur={() => setFocusedWeight(false)}
                                            placeholder={`${t(TranslationKeys.enter_weight)}`} />
                                        <Text style={[Styles.packageTitle, { marginLeft: wp(1), fontSize: FontSizes.FONT_SIZE_16, color: colors.SECONDARY_TEXT }]}>{t(TranslationKeys.kg)}</Text>
                                    </View>
                                    {(touched.packageWeight && errors.packageWeight) ? <CommonErrorText title={errors.packageWeight} /> : null}
                                    <Text style={Styles.maximumText}>{t(TranslationKeys.maximum_weight)}</Text>
                                </View>
                            </>}
                        </CustomContainer>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
            <CustomBottomBtn
                title={t(TranslationKeys.next)}
                // disabled={isBtnDisable}
                onPress={() => {
                    handleSubmit()
                }}
            />
        </>
    )
}

export default DeliveryContactScreen

const useStyles = () => {
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const { locale } = useLanguage()

    return (
        StyleSheet.create({
            conatiner: {
                backgroundColor: colors.WHITE_ICON,
                paddingVertical: wp(4),
                paddingHorizontal: wp(2),
                borderRadius: wp(2),
                // borderColor: colors.BOX_BORDER,
                // borderWidth: wp(0.5)
            },
            senderText: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_17,
                color: colors.PRIMARY_TEXT,
                marginBottom: wp(2),
                textAlign: 'left'
            },
            textInputLabelText: {
                fontSize: FontSizes.FONT_SIZE_16,
                fontFamily: Fonts.FONT_POP_MEDIUM,
                color: colors.PRIMARY_TEXT,
                marginVertical: wp(2),
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
                // height: wp(14),
                overflow: 'hidden',
                paddingHorizontal: wp(2), // General padding for the container
                paddingVertical: wp(0.5), // General padding for the container
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
                textAlign: locale ? 'right' : 'left'
            },
            googlePlaceAutoCompleteContainer: {
                // paddingHorizontal: wp(1),
                // position: 'absolute',
                // top: hasNotch() ? wp(15) : wp(20),
                // position: 'absolute',
                // top: hasNotch() ? wp(15) : wp(20),
                flex: 1,
                // padding: wp(4),
                marginTop: wp(2),
                borderRadius: wp(3)
            },
            pickLocationTextInputStyle: {
                fontSize: FontSizes.FONT_SIZE_16,
                fontFamily: Fonts.FONT_POP_REGULAR,
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
                minHeight: wp(14),
                flex:1,
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
                marginTop: wp(2),
                textAlign: 'left'
            }
        })
    )
}