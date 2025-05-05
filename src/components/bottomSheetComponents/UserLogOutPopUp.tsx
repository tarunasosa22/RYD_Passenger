import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../../redux/Store';
import CustomPrimaryButton from '../CustomPrimaryButton';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { LayoutAnimation } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { HomeBottomSheetType } from '../../utils/Constats';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';

interface UserLogOutPopUpProps {
    onCancel: () => void
    onLogOut: () => void
    type: string
};

const UserLogOutPopUp = (props: UserLogOutPopUpProps) => {

    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const focus = useIsFocused();
    const {t} = useTranslation();

    useEffect(() => {
        focus && LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }, [focus]);


    return (
        <View style={Styles.logOutPopUpMainContainerStyle}>
            <View style={Styles.logOutDetailsContainerStyle}>
                <Text numberOfLines={1} style={Styles.louOutTxtStyle}>{props.type == HomeBottomSheetType.deleteAccount.type ? t(TranslationKeys.delete_account) : t(TranslationKeys.logout)}</Text>
                <View style={Styles.logOutItemSepratorStyle} />
                <Text numberOfLines={2} style={Styles.logOutAreYouSureTxtStyle}>{props.type == HomeBottomSheetType.deleteAccount.type ? t(TranslationKeys.are_you_sure_you_want_to_delete_account) : t(TranslationKeys.are_you_sure_you_want_to_log_out)}</Text>
            </View>
            <View style={[GlobalStyle.rowContainer, Styles.spaceBetweenView]}>
                <CustomPrimaryButton
                    onPress={props.onCancel}
                    title={t(TranslationKeys.cancel)}
                    style={[GlobalStyle.primaryBtnStyle, Styles.bottomCancelBtnStyle]}
                    txtStyle={{
                        color: colors.PRIMARY
                    }}
                />
                <CustomPrimaryButton
                    onPress={props.onLogOut}
                    title={props.type == HomeBottomSheetType.deleteAccount.type ? t(TranslationKeys.yes_delete_it) : t(TranslationKeys.yes_log_out)} style={[GlobalStyle.primaryBtnStyle, Styles.bottomContinueBtnStyle]} />
            </View>
        </View>
    );
};

export default memo(UserLogOutPopUp);

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)

    return StyleSheet.create({
        logOutPopUpMainContainerStyle: {
            flex: 1,
            justifyContent: 'space-between',
        },
        logOutDetailsContainerStyle: {
            flex: 1,
            justifyContent: 'space-around',
            alignItems: 'center'
        },
        louOutTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_18,
            color: colors.PRIMARY_TEXT,
            textAlign: 'center'
        },
        logOutItemSepratorStyle: {
            width: '100%',
            backgroundColor: colors.SEPARATOR_LINE,
            height: wp(0.4),
        },
        logOutAreYouSureTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_16,
            color: colors.SECONDARY_TEXT,
            textAlign: 'center'
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
            width: wp(44),
            borderColor: colors.PRIMARY,
            borderWidth: wp(0.3),
        },
    })
};
