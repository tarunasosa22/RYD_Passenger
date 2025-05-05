import React, { useState } from 'react';
import { Text, StyleSheet, View, FlatList, TouchableOpacity, Image, LayoutAnimation, ScrollView, Linking } from 'react-native';
import TopTabBar from '../../components/CustomTopBar';
import { useAppSelector } from '../../redux/Store';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import CustomHeader from '../../components/CustomHeader';
import CustomContainer from '../../components/CustomContainer';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import CustomTextInput from '../../components/CustomTextInput';
import { Icons } from '../../utils/IconsPaths';
import { RFValue } from 'react-native-responsive-fontsize';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { ImageSourcePropType } from 'react-native';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';
import { contactToDriver } from '../../utils/HelperFunctions';
import { useLanguage } from '../../context/LanguageContext';

interface ItemProps {
    id: number;
    title: string;
    questions_list: DropDownProps[],
};

interface DropDownProps {
    id: number;
    title: string;
    content: string;
    isOpen: boolean;
};

interface ContactUsListProps {
    id: number;
    icon: ImageSourcePropType;
    title: string;
    content: string;
    isOpen: boolean;
    link: () => any;
};


const FAQ_Category: ItemProps[] = [
    {
        id: 1,
        title: TranslationKeys.account,
        questions_list: [
            {
                id: 1,
                title: TranslationKeys.account_help_list_title1,
                content: TranslationKeys.account_help_list_content1,
                isOpen: false,
            },
            {
                id: 2,
                title: TranslationKeys.account_help_list_title2,
                content: TranslationKeys.account_help_list_content2,
                isOpen: false,
            }
        ],
    },
    {
        id: 2,
        title: TranslationKeys.safety,
        questions_list: [
            {
                id: 1,
                title: TranslationKeys.safety_help_list_title1,
                content: TranslationKeys.safety_help_list_content1,
                isOpen: false,
            },
            {
                id: 2,
                title: TranslationKeys.safety_help_list_title2,
                content: TranslationKeys.safety_help_list_content2,
                isOpen: false,
            },
            {
                id: 3,
                title: TranslationKeys.safety_help_list_title3,
                content: TranslationKeys.safety_help_list_content3,
                isOpen: false,
            }
        ],
    },
    {
        id: 3,
        title: TranslationKeys.services,
        questions_list: [
            {
                id: 1,
                title: TranslationKeys.services_help_list_title1,
                content: TranslationKeys.services_help_list_content1,
                isOpen: false,
            },
            {
                id: 2,
                title: TranslationKeys.services_help_list_title2,
                content: TranslationKeys.services_help_list_content2,
                isOpen: false,
            }
        ],
    }
];

const contactListArray: ContactUsListProps[] = [
    {
        id: 1,
        icon: Icons.CUSTOMER_SUPPORT,
        title: TranslationKeys.customer_service,
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        isOpen: false,
        link: () => {
            Linking.openURL('mailto:support@rydtaxi.app')
        }
    },
    {
        id: 2,
        icon: Icons.WHATSAPP,
        title: TranslationKeys.whatsapp,
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        isOpen: false,
        link: () => {
            Linking.openURL('https://wa.me/+919545530132')
        }
    },
    {
        id: 3,
        icon: Icons.WEBSITE,
        title: TranslationKeys.website,
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        isOpen: false,
        link: () => {
            Linking.openURL('http://www.rydtaxi.app/')
        }
    },
    {
        id: 6,
        icon: Icons.INSTAGRAM,
        title: TranslationKeys.instagram,
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        isOpen: false,
        link: () => {
            // Linking.openURL('https://www.instagram.com/nxtcabs?igsh=MTNwMDk3OHpnNnFwdg==')
        }
    },
    {
        id: 4,
        icon: Icons.FACEBOOK,
        title: TranslationKeys.facebook,
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        isOpen: false,
        link: () => {
            // Linking.openURL('https://nxtcabs.com/')
        }

    },
    {
        id: 5,
        icon: Icons.TWITTER,
        title: TranslationKeys.twitter,
        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        isOpen: false,
        link: () => {
            // Linking.openURL('https://nxtcabs.com/') 
        }
    },
];

const HelpCenter = () => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const [tabIndex, setTabIndex] = useState<number>(0);
    const [isSelect, setIsSelect] = useState<number>(1);
    const [isOpen, setIsOpen] = useState<DropDownProps | null>();
    const [filteredArray, setFilteredArray] = useState<DropDownProps[]>(FAQ_Category[0].questions_list);
    const [isOpenContact, setisOpenContact] = useState<ContactUsListProps | null>();
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const navigation = useCustomNavigation('DrawerStack')
    const { t } = useTranslation();

    const tabs = [
        { title: t(TranslationKeys.faq) },
        { title: t(TranslationKeys.contact_us) },
    ];
    const handleTabPress = (index: number) => {
        setTabIndex(index)
        setIsOpen(null)
        setisOpenContact(null)
    };

    const handleOpenFAQlist = (item: DropDownProps) => {
        if (isOpen?.id != item.id) {
            setIsOpen(item)
        }
        else {
            setIsOpen(null)
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    const handleCategoryFilter = (item: ItemProps) => {
        setIsSelect(item.id)
        setIsOpen(null)
        setFilteredArray(item.questions_list)
    };

    const handleOpenContactList = (item: ContactUsListProps) => {
        if (isOpenContact?.id != item.id) {
            setisOpenContact(item)
        }
        else {
            setisOpenContact(null)
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    const renderItem = ({ item }: { item: ItemProps }) => (
        <TouchableOpacity onPress={() => handleCategoryFilter(item)} activeOpacity={0.8}>
            <View style={[Styles.faq_categoryContianer, isSelect === item.id ? { backgroundColor: colors.PRIMARY } : null]}>
                <Text style={[Styles.faq_categoryContainer_Text, isSelect === item.id ? { color: colors.PRIMARY_BACKGROUND } : null]}>{t(item.title)}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderQuestionItems = ({ item, index }: { item: DropDownProps, index: number }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => handleOpenFAQlist(item)}>
            <View style={[Styles.dropDownContainer, { marginTop: index === 0 ? wp(0) : wp(2) }]}>
                <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between' }]}>
                    <Text style={Styles.questionText}>{t(item.title)}</Text>
                    <Image source={isOpen?.id === item.id ? Icons.UPARROW : Icons.DROPDOWN} style={Styles.dropdownIcon} />
                </View>
                {isOpen?.id === item.id ?
                    <View style={Styles.contentSepratorLine}>
                        <Text style={Styles.subtitle}>{t(item.content)}</Text>
                    </View>
                    : null}
            </View>
        </ TouchableOpacity>
    );

    const renderContactUsItems = ({ item }: { item: ContactUsListProps }) => (
        <TouchableOpacity onPress={() => {
            item?.link()
        }} activeOpacity={0.8}>
            <View style={[Styles.dropDownContainer, { marginVertical: wp(1.5) }]}>
                <View style={[GlobalStyle.rowContainer, { justifyContent: 'space-between' }]}>
                    <Image source={item.icon} style={[GlobalStyle.commonIconStyle, { marginRight: wp(3), tintColor: undefined }]} />
                    <Text style={Styles.questionText}>{t(item.title)}</Text>
                    <Image source={isOpenContact?.id === item.id ? Icons.UPARROW : Icons.RIGHT_ARROW_ICON} style={Styles.dropdownIcon} />
                </View>
                {/* {isOpenContact?.id === item.id ?
                    <View style={styles.contentSepratorLine}>
                        <Text style={styles.subtitle}>{item.content}</Text>
                    </View>
                    : null} */}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={GlobalStyle.container}>
            <CustomHeader title={t(TranslationKeys.help_center)} onPress={() => {
                if (navigation?.getId() == "DrawerStack") {
                    navigation.openDrawer()
                } else {
                    navigation.goBack()
                }
            }} />
            <View style={Styles.customContainer}>
                <TopTabBar tabs={tabs} activeTab={tabIndex} onTabPress={handleTabPress} />
            </View>
            {tabIndex === 0 ?
                <ScrollView showsVerticalScrollIndicator={false}>
                    <FlatList
                        data={FAQ_Category}
                        horizontal
                        renderItem={renderItem}
                        showsHorizontalScrollIndicator={false}
                        // contentContainerStyle={{ paddingBottom: isOpen ? wp(4) : wp(2) }}
                        ListHeaderComponent={<View style={{ marginLeft: wp(3.5) }}></View>}
                    />
                    <View style={[Styles.customContainer, { marginVertical: wp(2) }]} />
                    <FlatList
                        data={filteredArray}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ paddingHorizontal: wp(5), paddingBottom: hp(2) }}
                        style={{ marginBottom: wp(1) }}
                        renderItem={renderQuestionItems}
                    />
                </ScrollView>
                :
                <CustomContainer>
                    <FlatList data={contactListArray} contentContainerStyle={{ marginVertical: wp(6) }} renderItem={renderContactUsItems} />
                </CustomContainer>
            }
        </View >
    );
};

export default HelpCenter;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);
    const { locale } = useLanguage()

    return StyleSheet.create({
        mainContainer: {
            minHeight: 0
        },
        customContainer: {
            paddingHorizontal: wp(5),
        },
        faq_categoryContianer: {
            paddingHorizontal: wp(4),
            height: wp(12),
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderColor: colors.SHADOW_1,
            borderWidth: 1,
            borderRadius: wp(2),
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: wp(6),
            marginHorizontal: wp(1.5),
        },
        faq_categoryContainer_Text: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_16,
            fontFamily: Fonts.FONT_POP_REGULAR,
        },
        textInputContainerStyle: {
            marginVertical: wp(5),
        },
        dropDownContainer: {
            justifyContent: 'space-between',
            padding: wp(4),
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderColor: colors.SHADOW_1, borderWidth: 1,
            borderRadius: wp(2)
        },
        contentSepratorLine: {
            borderTopColor: colors.SHADOW_1,
            borderTopWidth: 1,
            marginTop: wp(2),
            paddingVertical: wp(2),
        },
        subtitle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: RFValue(10),
            color: colors.SECONDARY_TEXT,
            textAlign: 'left'
        },
        dropdownIcon: {
            width: wp(4),
            height: wp(4),
            resizeMode: 'contain',
            tintColor: colors.SECONDARY_ICON,
            transform: [{ rotate: locale ? '180deg' : '0deg' }],
        },
        questionText: {
            fontSize: FontSizes.FONT_SIZE_12,
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            marginRight: wp(2),
            flex: 1,
            textAlign: 'left'
        },
    });
};
