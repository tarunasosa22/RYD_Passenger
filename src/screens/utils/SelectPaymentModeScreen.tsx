import { Alert, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import CustomHeader from '../../components/CustomHeader';
import CommonPaymentButton from '../../components/CommonPaymentButton';
import CustomContainer from '../../components/CustomContainer';
import { Icons } from '../../utils/IconsPaths';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { setPaymentMethod } from '../../redux/slice/homeSlice/HomeSlice';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { SOCKET_STATUS } from '../../utils/Constats';
import { RIDE_DETAILS } from '../../config/Host';
import { RootStackParamList } from '../../types/RootStackType';

const SelectPaymentModeScreen = () => {

    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const navigation = useCustomNavigation('SelectPaymentModeScreen');
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { paymentMethod } = useAppSelector(state => state.HomeSlice);
    type NestedScreenRouteProp = RouteProp<RootStackParamList, 'SelectPaymentModeScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const rideId = route.params?.rideId

    const [selectPaymentMethod, setSelectPaymentMethod] = useState<string>(paymentMethod);
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState<boolean>(false)
    const { t } = useTranslation();
    const { tokenDetail, userCordinates } = useAppSelector(state => state.AuthSlice);
    const focus = useIsFocused();
    // let ws: WebSocket
    const ws = useRef(null); // Use `useRef` to keep the WebSocket instance persistent



    useEffect(() => {
        if (focus && rideId) {
            connectionInit()
        }
        return () => {
            if (ws.current) {
                ws.current.close();
                console.log('WebSocket connection cleaned up');
            }
        }
    }, [focus])

    const connectionInit = () => {
        const url = `${RIDE_DETAILS}${rideId}/`
        // ws = new WebSocket(url, null, {
        //     headers: {
        //         Authorization: `Token ${tokenDetail?.authToken}`
        //     }
        // })

        // ws.onopen = () => {
        //     console.log("CONNECTION OPEN");
        // }

        // ws.addEventListener("error", (erorr) => {
        //     console.log("CONNECTION ERROR", erorr.message, erorr);
        //     if (ws?.readyState == SOCKET_STATUS.CLOSED && networkStatus) {
        //         setTimeout(() => {
        //             connectionInit()
        //         }, 2000);
        //     }
        // })

        // ws.addEventListener("open", () => {
        //     console.log("CONNECTION OPEN");
        // })

        // ws.addEventListener("close", () => {
        //     console.log("CONNECTION CLOSE");
        //     if (focus && navigation.getId() == "TrackDriverScreen") {
        //         setTimeout(connectionInit, 2000);
        //     }
        // })

        // ws.addEventListener('message', (message) => {
        //     console.log("CONNECTION message--->", message);
        // })

        ws.current = new WebSocket(url, null, {
            headers: {
                Authorization: `Token ${tokenDetail?.authToken}`
            }
        })

        // Handle connection open event
        ws.current.onopen = () => {
            console.log('WebSocket connection opened to RYD Taxi API');

            // Create the message object

            // console.log('Message sent:', message);
        };

        // Handle messages received from the server
        ws.current.onmessage = (event) => {
            console.log('Message received from server:', event.data);
        };

        // Handle connection errors
        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        // Handle connection closure
        ws.current.onclose = () => {
            console.log('WebSocket connection closed');
        };
    };

    return (
        <View style={GlobalStyle.container}>
            {loading && <CustomActivityIndicator />}
            <CustomHeader onPress={() => {
                navigation.goBack()
            }} title={t(TranslationKeys.select_payment_mode)} />
            <CustomContainer>
                {/* <CommonPaymentButton
                    onPress={() => {
                        setSelectPaymentMethod("UPI")
                    }}
                    activeOpacity={1}
                    // label={t(TranslationKeys.upi_payment)}
                    title={t(TranslationKeys.upi_payment)}
                    leftIcon={Icons.QR_CODE_ICONS}
                    leftIconStyle={{
                        tintColor: colors.PRIMARY
                    }}
                    rightIcon={selectPaymentMethod == "UPI" ? Icons.ACTIVE_RADIO_BUTTON : Icons.RADIO_BUTTON_ICON}
                    rightIconStyle={{
                        tintColor: selectPaymentMethod == "UPI" ? colors.PRIMARY : colors.DOTTED_BORDER
                    }}
                /> */}
                <CommonPaymentButton
                    onPress={() => {
                        setSelectPaymentMethod("Card")
                    }}
                    activeOpacity={1}
                    // label={t(TranslationKeys.upi_payment)}
                    title={t(TranslationKeys.card_payment)}
                    leftIcon={Icons.CARD}
                    leftIconStyle={{
                        tintColor: colors.PRIMARY
                    }}
                    rightIcon={selectPaymentMethod == "Card" ? Icons.ACTIVE_RADIO_BUTTON : Icons.RADIO_BUTTON_ICON}
                    rightIconStyle={{
                        tintColor: selectPaymentMethod == "Card" ? colors.PRIMARY : colors.DOTTED_BORDER
                    }}
                />
                <CommonPaymentButton
                    onPress={() => {
                        setSelectPaymentMethod("Cash")
                    }}
                    activeOpacity={1}
                    // label={t(TranslationKeys.cash)}
                    title={t(TranslationKeys.cash)}
                    leftIcon={Icons.CASH_ICON}
                    leftIconStyle={{
                        tintColor: colors.PRIMARY
                    }}
                    rightIcon={selectPaymentMethod == "Cash" ? Icons.ACTIVE_RADIO_BUTTON : Icons.RADIO_BUTTON_ICON}
                    rightIconStyle={{
                        tintColor: selectPaymentMethod == "Cash" ? colors.PRIMARY : colors.DOTTED_BORDER
                    }}
                />
            </CustomContainer>
            <CustomBottomBtn onPress={() => {
                // Send the message as JSON
                console.log("selectPaymentMethod-->", selectPaymentMethod === "Card" ? "CARD" : 'CASH')
                if (ws?.current?.readyState === WebSocket.OPEN) {
                    ws?.current?.send(JSON.stringify({
                        event: 'change_payment_method',
                        new_payment_method: selectPaymentMethod === "Card" ? "CARD" : 'CASH',
                    }));
                }
                dispatch(setPaymentMethod(selectPaymentMethod))
                // if (selectPaymentMethod == "Card") {
                //     razorPayCheckout()
                // }

                // if (selectPaymentMethod == "Card") {
                //     // initializePaymentSheet()
                //     initializePaymentSheet()
                // } else {
                //     dispatch(setSelectPaymentType("Cash"))
                // }
                setTimeout(() => {
                    navigation.goBack()
                }, 200);
            }} title={t(TranslationKeys.confirm_payment_mode)} />
        </View>
    );
};

export default SelectPaymentModeScreen;

const useStyles = () => {
    const { colors } = useAppSelector(state => state.CommonSlice)
    return StyleSheet.create({
        sepratorContainerStyle: {
            paddingVertical: wp(2),
            justifyContent: "center",
            alignItems: 'center',
            marginTop: wp(5)
        },
        sepratorLineStyle: {
            width: "100%",
            backgroundColor: colors.SEPARATOR_LINE,
            height: wp(0.3),
            position: 'absolute'
        },
        orTxtStyle: {
            zIndex: 5,
            width: wp(20),
            backgroundColor: colors.PRIMARY_BACKGROUND,
            textAlign: 'center',
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
        },
    });
};
