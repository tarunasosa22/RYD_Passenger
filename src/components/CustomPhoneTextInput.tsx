import React, { Dispatch, SetStateAction } from 'react';
import { StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CountryPicker from 'rn-country-picker';
import { useAppSelector } from '../redux/Store';
import { Fonts } from '../styles/Fonts';
import { FontSizes } from '../styles/FontSizes';
import { Icons } from '../utils/IconsPaths';
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../localization/TranslationKeys';
import { useLanguage } from '../context/LanguageContext';

interface CustomPhoneTextInputProps {
    setSelectCountry?: Dispatch<SetStateAction<string>>,
    countryPickerDisable?: boolean,
    containerStyle?: ViewStyle,
    textInputStyle?: TextStyle,
    selectedCountry?: string
    iscountryshow?: boolean,
    isError?: boolean | "" | undefined
};

const CustomPhoneTextInput = (props: CustomPhoneTextInputProps & TextInputProps) => {

    const Styles = useStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { t } = useTranslation();
    const { langCode } = useLanguage();

    return (
        <View style={[Styles.countryPickerContainerStyle, props.containerStyle, { borderColor: props.isError ? colors.ERROR_TEXT : colors.BOX_BORDER }]}>
            {props?.iscountryshow && <>
                <CountryPicker
                    disable={props?.countryPickerDisable}
                    animationType={'slide'}
                    countryCode={props?.selectedCountry ? props?.selectedCountry : '91'}
                    dropDownImage={Icons.DOWN_ARROW_ICON}
                    dropDownImageStyle={props?.countryPickerDisable ? Styles.disableDropDownIconStyle : Styles.dropDownImageStyle}
                    countryFlagStyle={Styles.countryFlagStyle}
                    countryNameTextStyle={{
                        marginHorizontal: wp(1)
                    }}
                    searchBarStyle={Styles.countrySearchInputStyle}
                    selectedCountryTextStyle={Styles.selectedCountryTextStyle}
                    language={langCode == 'hi' ? 'en' : langCode}
                    selectedValue={props?.setSelectCountry}
                />
                <View style={Styles.sepratorLineStyle} />
            </>}
            <TextInput
                {...props}
                style={[Styles.textInputStyle, props?.textInputStyle]}
                maxLength={10}
                keyboardType={'number-pad'}
                placeholder={t(TranslationKeys.enter_phonenumber)}
                placeholderTextColor={colors.SECONDARY_TEXT}
                inputMode={'numeric'}
                returnKeyType={'done'}
            />
        </View>
    );
};

export default CustomPhoneTextInput;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const { locale } = useLanguage()

    return (
        StyleSheet.create({
            textInputStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.PRIMARY_TEXT,
                width: '100%',
                flex: 1,
                textAlign: locale ? 'right' : 'left'
            },
            countryPickerContainerStyle: {
                backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
                borderRadius: wp(2),
                height: wp(14),
                // borderColor: colors.BOX_BORDER,
                borderWidth: wp(0.3),
                marginTop: wp(2),
                alignItems: 'center',
                paddingHorizontal: wp(3),
                flexDirection: 'row',
            },
            dropDownImageStyle: {
                width: wp(3.5),
                height: wp(3.5),
                resizeMode: 'contain',
                tintColor: colors.SECONDARY_ICON
            },
            sepratorLineStyle: {
                backgroundColor: colors.BOX_BORDER,
                width: wp(0.5),
                height: wp(6),
                marginHorizontal: wp(2),
                marginRight: wp(2.5)
            },
            selectedCountryTextStyle: {
                marginHorizontal: wp(1),
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.PRIMARY_TEXT
            },
            countryFlagStyle: {
                width: wp(8),
                height: wp(6),
                resizeMode: 'contain'
            },
            disableDropDownIconStyle: {
                width: 0,
                height: 0,
                marginLeft: wp(-2)
            },
            countrySearchInputStyle: {
                color: colors.PRIMARY_TEXT,
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_15,
                textAlign: locale ? 'right' : 'left'
            }
        })
    );
};
