import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import ReactNativeModal from 'react-native-modal'
import { widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { useAppSelector } from '../redux/Store'
import CustomIconButton from './CustomIconButton'
import CustomRadioButton, { ContactsProps } from './CustomRadioButton'
import CustomBottomBtn from './CustomBottomBtn'
import { Icons } from '../utils/IconsPaths'
import { useGlobalStyles } from '../hooks/useGlobalStyles'
import { Fonts } from '../styles/Fonts'
import { FontSizes } from '../styles/FontSizes'
import { useTranslation } from 'react-i18next'
import { TranslationKeys } from '../localization/TranslationKeys'

interface ContactListViewProps {
    isLoading: boolean
    isVisible: boolean,
    onClose: () => void,
    data: ContactsProps[] | [],
    onButtonPress: (item: ContactsProps | undefined) => void,
    selectedItem: ContactsProps | undefined
};

const ContactListView = (props: ContactListViewProps) => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const Styles = useStyles();
    const [selectItem, setSelecteItem] = useState<ContactsProps | undefined>(props.selectedItem ?? undefined);
    const [searchTxt, setSearchTxt] = useState<string>("");
    const textInputRef = useRef<TextInput>(null);
    const { t } = useTranslation();
    // const [contactList, setContactList] = useState([...props.data])

    // useEffect(() => {
    //     setContactList([...props?.data])
    // }, [props?.data])

    // console.log("CONTACTLIST--->", props.data, contactList)

    return (
        <ReactNativeModal
            isVisible={props.isVisible}
            style={Styles.modalContainer}
            onBackButtonPress={props.onClose}
            onModalWillHide={() => {
                setSearchTxt("")
            }}
        >
            <View style={Styles.modalMainViewStyle}>
                <CustomIconButton icon={Icons.CLOSE_ICON}
                    onPress={props.onClose}
                    iconStyle={Styles.closeIconStyle}
                    style={Styles.closeBtnIconStyle} />
                {props.isLoading ?
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size={'large'} color={colors.PRIMARY} />
                        <Text style={{ marginTop: wp(3), color: colors.DISABLE_BUTTON, fontSize: FontSizes.FONT_SIZE_13 }}>Contact Loading...</Text>
                    </View>
                    : <>
                        <View style={[Styles.searchTxtContainerStyle, { paddingVertical: Platform.OS == 'ios' ? wp(3) : wp(0), backgroundColor: colors.BOX_PRIMARY_BACKGROUND, borderColor: colors.BOX_BORDER_PRIMARY, borderWidth: 1, borderRadius: 10 }]}>
                            <CustomIconButton icon={Icons.SEARCH} activeOpacity={1} iconStyle={{ marginRight: wp(2), width: wp(5), height: wp(5) }} />
                            <TextInput
                                ref={textInputRef}
                                placeholder={t(TranslationKeys.search_contacts)}
                                style={Styles.searchTxtStyle}
                                value={searchTxt}
                                onChangeText={setSearchTxt}
                                // autoFocus
                                placeholderTextColor={colors.SECONDARY_TEXT}

                            />
                            {searchTxt ?
                                <CustomIconButton
                                    onPress={() => {
                                        textInputRef.current?.blur()
                                        setSearchTxt('')
                                    }}
                                    icon={Icons.CLOSE_ICON}
                                    style={Styles.clearIconContainerStyle}
                                    iconStyle={Styles.clearIconStyle} />
                                :
                                null}
                        </View>
                        <FlatList
                            data={props.data.filter((item, index) => searchTxt ? item.name?.includes(searchTxt) || item.mobileNumber?.includes(searchTxt) && index !== 0 : index !== 0)}
                            bounces={false}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item, index }: {
                                item: ContactsProps, index: number
                            }) => {
                                return (
                                    <CustomRadioButton
                                        containerStyle={{
                                            paddingHorizontal: wp(0.5)
                                        }}
                                        selectedItem={selectItem === item}
                                        onPress={() => {
                                            setSelecteItem(item)
                                        }}
                                        item={item}
                                        labelContainerStyle={{ backgroundColor: colors.SECONDARY }}
                                        radioIconStyle={{ tintColor: colors.PRIMARY }}
                                        labelTextStyle={{ color: colors.WHITE_ICON }}
                                    />
                                )
                            }}
                            ListEmptyComponent={
                                <View style={Styles.emptyComponentContainerStyle}>
                                    <Text style={Styles.emptyTextStyle}>{t(TranslationKeys.contacts_not_found)}</Text>
                                </View>
                            }
                            extraData={props.data}
                            keyExtractor={(item) => item.id.toString()}
                        />
                    </>}
            </View>
            <CustomBottomBtn
                disabled={selectItem ? false : true}
                style={{
                    backgroundColor: selectItem ? colors.PRIMARY : colors.DISABLE_BUTTON
                }}
                onPress={() => {
                    props.onButtonPress(selectItem)
                }}
                title={t(TranslationKeys.confirm)} />
        </ReactNativeModal>
    );
};

export default ContactListView

const useStyles = () => {

    const GlobalStyles = useGlobalStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);

    return StyleSheet.create({
        emptyTextStyle: {
            ...GlobalStyles.subTitleStyle,
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
            fontSize: FontSizes.FONT_SIZE_18,
            color: colors.SECONDARY_TEXT
        },
        modalContainer: {
            margin: 0,
            backgroundColor: colors.PRIMARY_BACKGROUND,
            paddingTop: Platform.OS === 'android' ? wp(5) : wp(10),
        },
        modalMainViewStyle: {
            flex: 1,
            paddingHorizontal: wp(5)
        },
        closeIconStyle: {
            width: wp(4.5),
            height: wp(4.5)
        },
        closeBtnIconStyle: {
            alignSelf: 'flex-end',
            padding: wp(1.5)
        },
        searchTxtStyle: {
            flex: 1,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_14,
            color: colors.SECONDARY_TEXT
        },
        searchTxtContainerStyle: {
            marginTop: wp(2),
            paddingHorizontal: wp(2),
            flexDirection: 'row',
            alignItems: 'center'
        },
        clearIconContainerStyle: {
            padding: wp(1.2)
        },
        clearIconStyle: {
            width: wp(3.5),
            height: wp(3.5),
        },
        emptyComponentContainerStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: "75%"
        }
    });
};
