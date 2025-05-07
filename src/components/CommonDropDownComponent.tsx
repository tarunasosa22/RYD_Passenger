import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextStyle, TouchableOpacity, View } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppSelector } from '../redux/Store';
import { FontSizes } from '../styles/FontSizes';
import { Fonts } from '../styles/Fonts';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Icons } from '../utils/IconsPaths';
import { Dropdown } from 'react-native-element-dropdown';
import { DropdownProps } from 'react-native-element-dropdown/lib/typescript/components/Dropdown/model';
import { useLanguage } from '../context/LanguageContext';

interface DropdownListProps {
    id?: number,
    label: string,
    value?: string,
};

interface CommonDropDownPickerProps {
    data: DropdownListProps[];
    value?: string | null;
    txtStyle?: TextStyle;
    renderLeftIconVisible?: boolean,
    isError?: boolean | "" | undefined
};

const CommonDropDownComponent = (props: CommonDropDownPickerProps & DropdownProps<any>) => {
    const Globalstyle = useGlobalStyles();
    const Styles = useStyle();
    const [open, setOpen] = useState<boolean>(false)
    const { colors } = useAppSelector(state => state.CommonSlice)
    const { locale } = useLanguage()

    const renderItem = (item: any) => {
        return (
            <View style={[Styles.item, { backgroundColor: colors.SECONDARY_BACKGROUND }]}>
                <Text style={[Styles.textItem, props.txtStyle]}>{item.label}</Text>
                <Image source={item.value === props.value ? Icons.SELECTED_RADIO_BUTTON_ICON : Icons.RADIO_BUTTON_ICON} style={[{ width: wp(6), height: wp(6), resizeMode: 'contain' }, { tintColor: item.value === props.value ? colors.PRIMARY : colors.SECONDARY_ICON, marginRight: wp(2) }]} />
            </View>
        );
    };
    return (
        // <View>
        <Dropdown
            {...props}
            onFocus={() => setOpen(!open)}
            onBlur={() => setOpen(false)}
            style={[Styles.dropdown, props.style, { borderColor: props.isError ? colors.ERROR_TEXT : colors.BOX_BORDER }]}
            placeholderStyle={[Styles.placeholderStyle, props.placeholderStyle]}
            selectedTextStyle={[Styles.selectedTextStyle, props.selectedTextStyle]}
            inputSearchStyle={Styles.inputSearchStyle}
            renderLeftIcon={() => props.renderLeftIconVisible ? <Image source={Icons.CLOCK_ICON} style={[Styles.leftIconStyle, { tintColor: colors.SECONDARY }]} /> : locale ? <><Image source={Icons.DOWN_ARROW_ICON} style={[Styles.iconStyle, open ? Styles.upIconStyle : null]} /></> : <></>}
            renderRightIcon={() => !locale ? <Image source={Icons.DOWN_ARROW_ICON} style={[Styles.iconStyle, open ? Styles.upIconStyle : null]} /> : <></>}
            data={props.data}
            maxHeight={300}
            value={props.value}
            renderItem={renderItem}
            containerStyle={[Styles.containerStyle, props.containerStyle]}
        />
        // </View>
    );
};

export default CommonDropDownComponent;

const useStyle = () => {
    const { colors } = useAppSelector(state => state.CommonSlice)

    return StyleSheet.create({
        dropdown: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3),
            paddingHorizontal: wp(4),
            paddingVertical: wp(2),
            marginVertical: wp(2),
            marginHorizontal: wp(4),
            flex: 1
        },
        item: {
            paddingLeft: wp(2),
            paddingRight: wp(1.5),
            paddingVertical: wp(4),
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        textItem: {
            fontSize: FontSizes.FONT_SIZE_16,
            color: colors.PRIMARY_TEXT,
        },
        placeholderStyle: {
            fontSize: FontSizes.FONT_SIZE_14,
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_REGULAR
        },
        selectedTextStyle: {
            fontSize: FontSizes.FONT_SIZE_16,
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_REGULAR,
        },
        iconStyle: {
            width: wp(4),
            height: wp(4),
            resizeMode: 'contain',
            tintColor: colors.SECONDARY_ICON,
        },
        upIconStyle: {
            transform: [{ rotate: '180deg' }]
        },
        inputSearchStyle: {
            height: wp(12),
            color: colors.PRIMARY_TEXT
        },
        containerStyle: {
            borderRadius: wp(3),
            padding: wp(1),
        },
        leftIconStyle: {
            width: wp(6),
            height: wp(6),
            resizeMode: 'contain',
            tintColor: colors.SECONDARY_ICON,
            marginRight: wp(4)
        }

    });
};
