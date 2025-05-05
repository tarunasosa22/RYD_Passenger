import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useAppSelector } from '../../redux/Store';
import CustomHeader from '../../components/CustomHeader';
import CustomContainer from '../../components/CustomContainer';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CustomIconTextView from '../../components/CustomIconTextView';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import { Icons } from '../../utils/IconsPaths';
import CustomBottomSheet from '../../components/CustomBottomSheet';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet';
import CustomPrimaryButton from '../../components/CustomPrimaryButton';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { RootRouteProps } from '../../types/RootStackType';
import { contactToDriver } from '../../utils/HelperFunctions';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';

const SosScreen = () => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const route = useRoute<RootRouteProps<'SosScreen'>>();
    const navigation = useCustomNavigation('SosScreen');
    const status = route?.params?.status;

    const [alertStatus, setAlertStatus] = useState<string>("pending");
    const bottomSheetRef = useRef<BottomSheet>(null);
    const { t } = useTranslation()
    const snapPoint = useMemo(() => ["25%"], []);

    useEffect(() => {
        if (status == "sending") {
            setAlertStatus(status)
            setTimeout(() => {
                setAlertStatus("complete")
            }, 3000);
        }
    }, [status]);

    return (
        <View style={GlobalStyle.container}>
            <CustomHeader onPress={() => {
                navigation.goBack()
            }} title={t(TranslationKeys.sos)} />
            <CustomContainer>
                <Image source={ImagesPaths.WARNING} style={Styles.warningIconStyle} />
                <Text style={Styles.useInCaseTxtStyle}>{t(TranslationKeys.use_in_case_of_emergency)}</Text>
                <View style={Styles.sepratorContainerStyle} />
                <CustomIconTextView
                    style={{
                        backgroundColor: colors.TRANSPARENT
                    }}
                    onPress={() => { contactToDriver("100") }}
                    leftIcon={Icons.PHONE_ICON} title={t(TranslationKeys.call_police_control_room)} />

                <View style={Styles.sepratorContainerStyle} />
                <CustomIconTextView
                    onPress={() => {
                        bottomSheetRef.current?.snapToIndex(0)
                    }}
                    style={{
                        backgroundColor: colors.TRANSPARENT
                    }}
                    disabled={alertStatus != "pending" ? true : false}
                    leftIcon={Icons.SEND_MESSAGE}
                    rightIcon={alertStatus == "complete" && Icons.RIGHT_ARROW}
                    rightIconStyle={Styles.rightIconStyle}
                    title={alertStatus == "sending" ? t(TranslationKeys.sending_alert) : alertStatus == "complete" ? t(TranslationKeys.alert_sent) : t(TranslationKeys.alert_your_emergency_contacts)}
                />
                <View style={Styles.sepratorContainerStyle} />
                <Text style={Styles.companyCollectsTxtStyle}>{t(TranslationKeys.company_collects_location)}</Text>
            </CustomContainer>
            <CustomBottomSheet ref={bottomSheetRef}
                snapPoints={snapPoint}
                index={-1}
                enablePanDownToClose={true}
                animateOnMount={true}
                containerStyle={Styles.spaceBetweenView}
            >
                <Text style={Styles.continutToSendTxtStyle}>{t(TranslationKeys.continue_to_send_alert)}</Text>
                <View style={[GlobalStyle.rowContainer, Styles.spaceBetweenView]}>
                    <CustomPrimaryButton
                        onPress={() => {
                            bottomSheetRef.current?.close()
                        }}
                        title={t(TranslationKeys.cancel)} style={[GlobalStyle.primaryBtnStyle, Styles.bottomCancelBtnStyle]}
                        txtStyle={{
                            color: colors.PRIMARY
                        }}
                    />
                    <CustomPrimaryButton
                        onPress={() => {
                            bottomSheetRef.current?.close()
                            navigation.navigate("EmergencyContactScreen", { status: 'sos' })
                        }}
                        title={t(TranslationKeys.continue)} style={[GlobalStyle.primaryBtnStyle, Styles.bottomContinueBtnStyle]} />
                </View>
            </CustomBottomSheet>
        </View>
    );
};

export default SosScreen;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        sepratorContainerStyle: {
            height: wp(0.5), backgroundColor: colors.SEPARATOR_LINE
        },
        warningIconStyle: {
            width: wp(20),
            height: wp(20),
            resizeMode: 'contain',
            alignSelf: 'center',
            marginTop: "25%",
            marginBottom: wp(10)
        },
        useInCaseTxtStyle: {
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
            fontSize: FontSizes.FONT_SIZE_22,
            color: colors.PRIMARY_TEXT,
            textAlign: 'center',
            marginBottom: wp(12),
            maxWidth: wp(60),
            alignSelf: 'center'
        },
        companyCollectsTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_11,
            color: colors.SECONDARY_TEXT,
            textAlign: 'center',
            marginTop: wp(10),
            paddingHorizontal: wp(2)
        },
        continutToSendTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_22,
            color: colors.PRIMARY_TEXT,
            textAlign: 'center',
            marginTop: wp(3)
        },
        spaceBetweenView: {
            justifyContent: 'space-between'
        },
        bottomCancelBtnStyle: {
            width: wp(44),
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderColor: colors.PRIMARY,
            borderWidth: wp(0.5),
        },
        bottomContinueBtnStyle: {
            width: wp(44)
        },
        rightIconStyle: {
            width: wp(7),
            height: wp(7),
            tintColor: colors.PRIMARY,
            resizeMode: 'contain'
        }
    });
};
