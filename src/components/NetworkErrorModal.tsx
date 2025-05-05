import React from 'react';
import { Alert, BackHandler, StyleSheet, Text, View } from 'react-native';
import ReactNativeModal from 'react-native-modal';
import CustomPrimaryButton from './CustomPrimaryButton';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { store, useAppDispatch } from '../redux/Store';
import { FontSizes } from '../styles/FontSizes';
import { Fonts } from '../styles/Fonts';
import NetInfo from "@react-native-community/netinfo";
import { setNetworkStatus } from '../redux/slice/SettingSlice/SettingSlice';
import { TranslationKeys } from '../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';

const NetworkErrorModal = ({ isVisible }: { isVisible: boolean }) => {

    const Styles = useStyles();
    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    const onTryAgain = () => {
        NetInfo.refresh().then((res) => {
            dispatch(setNetworkStatus(res.isConnected))
        }).catch((error) => {
            dispatch(setNetworkStatus(false))
            console.log("🚀 ~ file: NetworkErrorModal.tsx:22 ~ NetInfo.refresh ~ error:", error)
        })
    }

    return (
        <ReactNativeModal
            isVisible={isVisible}
            style={Styles.modalStyle}
            onBackButtonPress={() => {
                BackHandler.exitApp()
            }}
            animationIn={'fadeIn'}
            animationOut={'fadeOut'}
            animationInTiming={300}
            animationOutTiming={300}
        >
            <View style={Styles.containerStyle}>
                <View style={Styles.modalContainer}>
                    <Text style={Styles.modalTitle}>{t(TranslationKeys.connection_error)}</Text>
                    <Text style={Styles.modalText}>{t(TranslationKeys.device_is_not_connected)}</Text>
                    <CustomPrimaryButton onPress={onTryAgain} title={t(TranslationKeys.try_again)}
                        style={Styles.tryAgainBtnStyle} />
                </View>
            </View>
        </ReactNativeModal>
    );
};

export default NetworkErrorModal;

const useStyles = () => {

    const { colors } = store.getState().CommonSlice;

    return StyleSheet.create({
        modalStyle: {
            margin: 0
        },
        modalContainer: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            paddingHorizontal: wp(5),
            paddingVertical: wp(5),
            alignItems: 'center',
        },
        modalTitle: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_20,
            fontFamily: Fonts.FONT_POP_MEDIUM,
        },
        modalText: {
            fontSize: FontSizes.FONT_SIZE_15,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.SECONDARY_TEXT,
            marginVertical: wp(4),
            textAlign: 'center',
        },
        tryAgainBtnStyle: {
            backgroundColor: colors.PRIMARY,
            paddingVertical: wp(3),
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: wp(2),
            width: wp(85)
        },
        containerStyle: {
            flex: 1,
            justifyContent: "flex-end"
        }
    });
};
