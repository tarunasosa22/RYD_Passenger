import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Image, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import CustomHeader from '../../components/CustomHeader';
import CustomContainer from '../../components/CustomContainer';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet';
import CustomCheckBox from '../../components/CustomCheckBox';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import CustomBottomSheet from '../../components/CustomBottomSheet';
import CustomIconButton from '../../components/CustomIconButton';
import { Icons } from '../../utils/IconsPaths';
import CommonErrorText from '../../components/CommonErrorText';
import { useFormik } from 'formik';
import * as yup from 'yup'
import Contacts from 'react-native-contacts';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { RootRouteProps } from '../../types/RootStackType';
import { addSosRideIdReducer, createEmergenceyContact, deleteEmergencyContact, filterEmergencyContactReducer, getContactList, sendSosMessage } from '../../redux/slice/contactSlice/ContactSlice';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import ContactListView from '../../components/ContactListView';
import { ContactsProps } from '../../components/CustomRadioButton';
import { AppAlert } from '../../utils/AppAlerts';
import { Linking } from 'react-native';
import { ContactsDetailsRegExp } from '../../utils/ScreenUtils';
import { SOS_URL } from '../../config/Host';
import { contactToDriver } from '../../utils/HelperFunctions';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { ANALYTICS_ID } from '../../utils/AnalyticsStringID';
import analytics from '@react-native-firebase/analytics';
import { useLanguage } from '../../context/LanguageContext';

export interface contactProps {
    id: number,
    contactOf: string | undefined,
    relationship: string | undefined,
    contact: string | undefined,
    selected?: boolean,
    name?: string
};

interface CreateContactProps {
    contact: string | undefined,
    relationship: string,
    name: string | undefined
}



const EmergencyContactScreen = () => {

    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { userDetail } = useAppSelector(state => state.AuthSlice);
    const navigation = useCustomNavigation("DrawerStack");
    const focus = useIsFocused();
    const dispatch = useAppDispatch();
    const route = useRoute<RootRouteProps<'EmergencyContactScreen'>>();
    const { contactList, isLoading, rideId } = useAppSelector(state => state.ContactSlice);
    const status = route?.params?.status;
    const [showBottomSheet, setShowBottomSheet] = useState<boolean>(false);
    const [selectAll, setSelectAll] = useState<boolean>(false);
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["35%"], []);
    const [offset, setOffset] = useState<number>(0);
    const [selectedTempContact, setSelectedTempContact] = useState<ContactsProps>();
    const [showContactListModal, setShowContactListModal] = useState<boolean>(false);
    const [selectedContact, setSelectedContact] = useState<ContactsProps | undefined>();
    const [contactsList, setContactsList] = useState<ContactsProps[]>([]);
    const [isContactLoading, setIsContactLoading] = useState(false)
    const [selectedContactList, setSelectedContactList] = useState<number[]>([])
    const [selectedContactNumberList, setSelectedContactNumberList] = useState<number[]>([])
    const { t } = useTranslation();

    //Contact List api call
    useEffect(() => {
        if (focus) {
            const params = {
                offset: offset,
            }
            contactListApiCall(params)
        }
        else {
            setOffset(0)
        }
    }, [focus])

    const RelationshipValidationSchema = yup.object().shape({
        relationship: yup.string().trim().required(t(TranslationKeys.please_enter_relationship))
    });

    const contactListApiCall = (params: { offset: number }) => {
        dispatch(getContactList(params)).unwrap()
            .then((res) => {
                setOffset(params?.offset + 10)
            })
            .catch((error) => {
            })
    };

    //Create Contact
    const createContactApiCall = (param: CreateContactProps) => {
        dispatch(createEmergenceyContact(param)).unwrap()
            .then((res) => {
                const params = {
                    offset: 0,
                }
                contactListApiCall(params)
                bottomSheetRef.current?.close()
            })
            .catch((error) => {
                bottomSheetRef.current?.close()
            })
    }

    // Delete Contact
    const deleteContact = (item: contactProps) => {
        AppAlert(
            `${t(TranslationKeys.delete_contact)}`,
            `${t(TranslationKeys.are_you_sure_you_want_to_delete_your)} ${item.relationship} ${t(TranslationKeys.mobile_number_small)}?`,
            () => {
                dispatch(deleteEmergencyContact(item.id)).unwrap()
                    .then((res) => {
                        const filterData = contactList?.results?.filter((res) => res.id !== item.id)
                        dispatch(filterEmergencyContactReducer({
                            ...contactList,
                            results: filterData
                        }))
                    })
                    .catch((error) => {
                    })
            },
            () => { }
        );
    }

    // Send Sos Message 
    const sendSosAlertApiCall = () => {
        const data = new FormData()
        if (selectedContactList && selectedContactList.length !== 0) {
            const contactListString = `+${JSON.stringify(selectedContactList)}`;
            data.append("contact_no", JSON.stringify(selectedContactList))
            data.append("ride_id", rideId)
            // Sos Url is here 
            data.append("tracking_link", `I am reaching out in a state of emergency and urgently require your assistance. Please click on the following SOS link without delay.  ${SOS_URL}/track/${rideId}/`)
        }
        dispatch(sendSosMessage(data)).unwrap()
            .then(res => {
                analytics().logEvent(ANALYTICS_ID.SOS_REQUEST_SENT, {
                    'userDetails': {
                        'id': userDetail?.id,
                        'name': userDetail?.name,
                        'phoneNumber': userDetail?.phoneNumber
                    }
                })
                const contactNumber = selectedContactNumberList[0]?.toString() || '';
                const formattedContactNumber = contactNumber.startsWith('91') ? contactNumber : `91${contactNumber}`;
                contactToDriver(`+${formattedContactNumber}`)
                dispatch(addSosRideIdReducer(undefined))
                navigation.navigate("SosScreen", { status: 'sending' })
            })
            .catch(e => {
                navigation.navigate("SosScreen", { status: 'sending' })
            })
    }

    const openSettingsForAskPermission = () => {
        AppAlert(t(TranslationKeys.contacts), t(TranslationKeys.Ryd_access_to_contacts_for_safety_and_emergancy_alerts),
            async () => {
                await Linking.openSettings()
            }, () => { })
    }

    //check contacts permission
    const checkContactsPermission = async () => {
        const checkPermission = await Contacts.checkPermission()
        if (Platform.OS === 'android') {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)
                .then(res => {
                    if (res === 'never_ask_again') {
                        openSettingsForAskPermission()
                    }
                })
        }
        if (checkPermission == 'authorized') {
            getContactData()
        } else {
            await requestPermission()
        }
    };

    // Request contact permission
    const requestPermission = async () => {
        const permission = await Contacts.requestPermission()
        if (permission == 'authorized') {
            getContactData()
        } else {
            await openSettingsForAskPermission()
        }
    };

    //get contact Data
    const getContactData = () => {
        setIsContactLoading(true)
        setShowContactListModal(true)
        Contacts.getAll()
            .then((contacts) => {
                const uniqueContacts: {
                    id: number,
                    name: string,
                    mobileNumber: string
                }[] = [];
                const contactNumbers = new Set();
                contacts.forEach((res) => {
                    if (res.phoneNumbers.length !== 0) {
                        res.phoneNumbers.forEach((phoneNumber) => {
                            let formattedNumber = phoneNumber?.number.replace(ContactsDetailsRegExp, "");
                            console.log('formattedNumber', formattedNumber, phoneNumber?.number)
                            // if (!formattedNumber.startsWith("+")) {
                            //     if (formattedNumber.startsWith("91")) {
                            //         formattedNumber = `+${formattedNumber}`;
                            //     }
                            //     else if (!formattedNumber.startsWith("+91")) {
                            //         formattedNumber = `+91${formattedNumber}`;
                            //     }
                            // }
                            if (!contactNumbers.has(formattedNumber)) {
                                uniqueContacts.push({
                                    id: Math.random(),
                                    name: `${res.givenName} ${res.familyName}`,
                                    mobileNumber: formattedNumber
                                });
                                contactNumbers.add(formattedNumber);
                            }
                        });
                    }
                });
                // let listttt: {
                //     id: number,
                //     name: string,
                //     mobileNumber: string
                // }[] = uniqueContacts?.map(contact1 => {
                //     // Check if the contact from the first array matches any in the second array
                //     const isMatched = contactList?.results?.some(contact2 => contact1.mobileNumber === contact2.contact);
                //     console.log("isMatched", isMatched, contact1.mobileNumber, contactList?.results, uniqueContacts)
                //     // If matched, add isSelected key
                //     if (isMatched) {
                //         return { ...contact1, isSelected: true };
                //     } else {
                //         return { ...contact1, isSelected: false };

                //     }

                // });
                // console.log("LIST___>", contactList, uniqueContacts, listttt)

                // setContactsList(listttt?.sort((a, b) => a?.name?.localeCompare(b?.name)));
                setContactsList(uniqueContacts?.sort((a, b) => a?.name?.localeCompare(b?.name)));

                setIsContactLoading(false)
            })
            .catch((error) => {
                setIsContactLoading(false)
                console.log("🚀 ~ file: BookingScreen.tsx:256 ~ getContactData ~ error:", error);
            });
    };

    const selectContactList = (id: number, contactNumber: number) => {
        const findContact = selectedContactList.find(item => item === id)
        if (findContact) {
            setSelectedContactList(selectedContactList.filter((item) => item !== id))
            setSelectedContactNumberList(selectedContactNumberList?.filter((item) => item !== contactNumber))
        } else {
            setSelectedContactList([...selectedContactList, id])
            setSelectedContactNumberList([...selectedContactNumberList, contactNumber])
        }
    };

    const renderItem = ({ item, index }: { item: contactProps, index: number }) => {
        return (
            <CustomCheckBox
                index={index}
                rightIconVisible={(status && status === 'sos') ? true : false}
                disabled={(status && status === 'sos') ? false : true}
                title={item?.contact ?? ""}
                name={item?.name ?? ""}
                subTitle={"(" + item?.relationship + ")"}
                value={selectedContactList.find(value => value == item.id) ? true : false}
                showCloseIcon
                onPress={() => {
                    selectContactList(item?.id, Number(item?.contact))
                }}
                onClose={() => {
                    deleteContact(item)
                }}
                containerStyle={Styles.checkBoxContainerStyle}
                titleStyle={{
                    ...Styles.checkBoxTitleStyle,
                    marginLeft: (status && status === 'sos') ? wp(2) : wp(0)
                }}
                subTitleStyle={Styles.checkBoxSubTitleStyle}
                inActiveIconStyle={Styles.checkBoxInActiveStyle}
                activeIconStyle={Styles.checkBoxActiveStyle}
            />
        );
    };

    const {
        handleChange,
        handleSubmit,
        values,
        errors,
        touched,
        resetForm,
    } = useFormik({
        initialValues: { relationship: '' },
        enableReinitialize: true,
        validationSchema: RelationshipValidationSchema,
        onSubmit: (values) => {
            if (selectedContact?.mobileNumber && values.relationship) {
                const param: CreateContactProps = {
                    contact: selectedContact?.mobileNumber,
                    relationship: values.relationship,
                    name: selectedContact?.name
                }
                createContactApiCall(param)
                setSelectedContact(undefined)

                resetForm()
            } else {
                Alert.alert(t(TranslationKeys.mobile_number_not_found))
            }
        }
    });

    const allNumberSelected = (selectall: boolean) => {
        if (selectall) {
            const selectedItem: number[] = []
            const selectedNumber: number[] = []
            contactList.results.map((item) => {
                selectedItem?.push(Number(item?.id))
                selectedNumber?.push(Number(item?.contact))
            })
            setSelectedContactList(selectedItem)
            setSelectedContactNumberList(selectedNumber)
        } else {
            setSelectedContactList([])
            setSelectedContactNumberList([])
        }
    };

    return (
        <View style={GlobalStyle.container}>
            {isLoading ? <CustomActivityIndicator /> : null}
            <CustomHeader onPress={() => {
                if (navigation?.getId() == "DrawerStack") {
                    navigation.openDrawer()
                } else {
                    navigation.goBack()
                }
            }} title={t(TranslationKeys.emergency_contacts)} />
            <CustomContainer>
                {contactList?.results?.length !== 0 ? <FlatList
                    data={contactList.results}
                    renderItem={renderItem}
                    bounces={false}
                    onEndReachedThreshold={0.2}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => {
                        if (contactList?.next && !isLoading) {
                            let params: { offset: number } = {
                                offset: offset,
                            }
                            contactListApiCall(params)
                        }
                    }}
                    ListHeaderComponent={
                        status && contactList?.results?.length !== 0 ?
                            <>
                                <CustomCheckBox
                                    rightIconVisible
                                    title={t(TranslationKeys.select_all)}
                                    value={selectAll}
                                    onPress={() => {
                                        setSelectAll(!selectAll)
                                        allNumberSelected(!selectAll)
                                    }}
                                    containerStyle={Styles.checkBoxContainerStyle}
                                    titleStyle={Styles.checkBoxTitleStyle}
                                    subTitleStyle={Styles.checkBoxSubTitleStyle}
                                    inActiveIconStyle={Styles.checkBoxInActiveStyle}
                                    activeIconStyle={Styles.checkBoxActiveStyle}
                                />
                                <View style={Styles.itemSepratorStyle} />
                            </>
                            :
                            null
                    }
                    ItemSeparatorComponent={() => {
                        return (
                            <View style={Styles.itemSepratorStyle} />
                        )
                    }}
                    ListEmptyComponent={
                        <View style={[GlobalStyle.centerContainer, Styles.emptyContainer]}>
                            <Image source={Icons.EMERGENCYCONTACT} style={{ tintColor: colors.SECONDARY_TEXT, marginBottom: wp(4) }} />
                            <Text style={Styles.emptyTextStyle}>{t(TranslationKeys.contacts_not_found)}</Text>
                        </View>
                    }
                /> :
                    <View style={[GlobalStyle.centerContainer, Styles.emptyContainer]}>
                        <Image source={Icons.EMERGENCYCONTACT} style={{ tintColor: colors.SECONDARY_TEXT, marginBottom: wp(4) }} />
                        <Text style={Styles.emptyTextStyle}>{t(TranslationKeys.contacts_not_found)}</Text>
                    </View>
                }
                <CustomBottomSheet
                    ref={bottomSheetRef}
                    snapPoints={snapPoints}
                    index={-1}
                    enablePanDownToClose={true}
                    keyboardBehavior={'interactive'}
                    onChange={(index) => {
                        setShowBottomSheet(index == 0 ? true : false)
                    }}
                >
                    <TouchableOpacity
                        onPress={checkContactsPermission}
                        activeOpacity={1} style={Styles.selectContactContainerStyle}>
                        <View style={Styles.selectContactViewStyle}>
                            <CustomIconButton
                                disabled
                                icon={Icons.USER_ICON} iconStyle={{
                                    tintColor: colors.PRIMARY
                                }} />
                            <Text style={Styles.selectContactTxtStyle}> {selectedContact?.name === undefined ? t(TranslationKeys.select_contacts) : selectedContact?.name}</Text>
                        </View>
                        <CustomIconButton
                            disabled
                            icon={Icons.DOWN_ARROW_ICON} iconStyle={Styles.rightArrowIconStyle} />
                    </TouchableOpacity>
                    <Text style={Styles.thisNumberUseTxtStyle}>{t(TranslationKeys.relationship)}</Text>
                    <BottomSheetTextInput
                        placeholder={t(TranslationKeys.enter_relationship)}
                        placeholderTextColor={colors.SECONDARY_TEXT}
                        style={Styles.bottonSheetTextInputStyle}
                        value={values.relationship}
                        onChangeText={handleChange("relationship")}
                    />
                    {(errors.relationship && touched.relationship) ?
                        <CommonErrorText title={errors.relationship} />
                        :
                        null}
                </CustomBottomSheet>
            </CustomContainer>
            <ContactListView
                isLoading={isContactLoading}
                isVisible={showContactListModal}
                selectedItem={selectedTempContact}
                onClose={() => {
                    setShowContactListModal(false)
                }}
                data={contactsList}
                onButtonPress={(item) => {
                    item && setSelectedContact(item)
                    setSelectedTempContact(item)
                    setShowContactListModal(false)
                }}
            />
            <CustomBottomBtn
                onPress={() => {
                    // checkContactsPermission()
                    if (showBottomSheet) {
                        handleSubmit()
                    } else {
                        if (status == "sos") {
                            sendSosAlertApiCall()
                        } else {
                            bottomSheetRef.current?.snapToIndex(0)
                        }
                    }
                }}
                disabled={!showBottomSheet && status == "sos" && selectedContactList.length === 0 ? true : false}
                style={{ backgroundColor: !showBottomSheet && status == "sos" && selectedContactList.length === 0 ? colors.DISABLE_BUTTON : colors.PRIMARY }}
                containerStyle={{
                    shadowColor: showBottomSheet ? colors.TRANSPARENT : colors.SHADOW_2,
                    paddingTop: showBottomSheet ? wp(0) : wp(4),
                    paddingHorizontal: wp(4.5)
                }}
                title={showBottomSheet ? t(TranslationKeys.add_emergency_contact) : status == 'sos' ? t(TranslationKeys.alert_now) : t(TranslationKeys.add_new_contact)}
                bottomComponent={
                    !showBottomSheet && status == "sos" ?
                        <TouchableOpacity onPress={() => {
                            bottomSheetRef.current?.snapToIndex(0)
                        }} style={Styles.bottomAddNewContactBtnStyle}>
                            <Text style={Styles.bottonBtnAddNewContactTxtStyle}>{t(TranslationKeys.add_new_contact)}</Text>
                        </TouchableOpacity>
                        :
                        null
                }
            />
        </View>
    );
};

export default EmergencyContactScreen;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const GlobalStyle = useGlobalStyles();
    const { locale } = useLanguage()

    return (
        StyleSheet.create({
            thisNumberUseTxtStyle: {
                ...GlobalStyle.subTitleStyle,
                color: colors.PRIMARY_TEXT,
                fontSize: FontSizes.FONT_SIZE_13,
                fontFamily: Fonts.FONT_POP_MEDIUM,
                marginVertical: wp(2),
                textAlign: 'left'
            },
            selectContactContainerStyle: {
                borderRadius: wp(2),
                flexDirection: 'row',
                borderWidth: wp(0.3),
                alignItems: 'center',
                paddingVertical: wp(3),
                paddingHorizontal: wp(4),
                borderColor: colors.BOX_BORDER,
                backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
                justifyContent: 'space-between',
                marginVertical: wp(1)
            },
            itemSepratorStyle: {
                backgroundColor: colors.SEPARATOR_LINE,
                height: wp(0.4),
                width: "91%",
                alignSelf: 'flex-end',
                borderRadius: wp(2)
            },
            bottonSheetTextInputStyle: {
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_12,
                color: colors.SECONDARY_TEXT,
                borderRadius: wp(2),
                flexDirection: 'row',
                borderWidth: wp(0.3),
                alignItems: 'center',
                paddingVertical: wp(3),
                paddingHorizontal: wp(4),
                borderColor: colors.BOX_BORDER,
                backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
                textAlign: locale ? 'right' : 'left'
            },
            selectContactTxtStyle: {
                marginHorizontal: wp(3),
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_15,
                color: colors.SECONDARY_TEXT
            },
            rightArrowIconStyle: {
                tintColor: colors.SECONDARY_ICON,
                width: wp(5),
                height: wp(5),
                transform: [{ rotate: locale ? '450deg' : '630deg' }]
            },
            selectContactViewStyle: {
                flexDirection: 'row',
                alignItems: "center",
                flex: 1
            },
            checkBoxContainerStyle: {
                marginVertical: wp(0.5)
            },
            checkBoxTitleStyle: {
                maxWidth: wp(55),
                marginLeft: wp(2),
                fontSize: FontSizes.FONT_SIZE_15,
            },
            checkBoxSubTitleStyle: {
                maxWidth: wp(35),
                fontSize: FontSizes.FONT_SIZE_15
            },
            checkBoxInActiveStyle: {
                borderColor: colors.BOX_DARK_BORDER,
                width: wp(5),
                height: wp(5),
            },
            checkBoxActiveStyle: {
                width: wp(5),
                height: wp(5),
                resizeMode: 'contain'
            },
            bottonBtnAddNewContactTxtStyle: {
                color: colors.PRIMARY,
                fontSize: FontSizes.FONT_SIZE_16,
                fontFamily: Fonts.FONT_POP_MEDIUM,
            },
            bottomAddNewContactBtnStyle: {
                alignSelf: 'center',
                marginVertical: wp(3)
            },
            emptyTextStyle: {
                ...GlobalStyle.subTitleStyle,
                fontFamily: Fonts.FONT_POP_SEMI_BOLD,
                fontSize: FontSizes.FONT_SIZE_18,
                color: colors.SECONDARY_TEXT
            },
            emptyContainer: {
                marginVertical: "65%"
            }
        })
    );
};
