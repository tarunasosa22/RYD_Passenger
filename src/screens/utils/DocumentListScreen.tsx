import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types/RootStackType';
import CustomHeader from '../../components/CustomHeader';
import { FlatList } from 'react-native';
import CommonDocumentUploadButton from '../../components/CommonDocumentUploadButton';
import CustomContainer from '../../components/CustomContainer';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { Icons } from '../../utils/IconsPaths';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { DocumentListProps } from '../../components/CustomUploadDocumentsTemplate';
import CommonErrorText from '../../components/CommonErrorText';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import CustomBottomBtn from '../../components/CustomBottomBtn';
import { riderDetails } from '../../redux/slice/authSlice/AuthSlice';
import { useTranslation } from 'react-i18next';
import { TranslationKeys } from '../../localization/TranslationKeys';

export interface DescriptionProps {
    id: number;
    title: string;
};

const DocumentListScreen = () => {
    const Globalstyle = useGlobalStyles();
    const Styles = useStyles();
    const dispatch = useAppDispatch();
    type NestedScreenRouteProp = RouteProp<RootStackParamList, 'DocumentListScreen'>;
    const route = useRoute<NestedScreenRouteProp>();
    const { documentType , documentTitle } = route.params
    const { colors } = useAppSelector(state => state.CommonSlice)
    const navigation = useCustomNavigation('DocumentListScreen');
    const { useIdentificationDocument, userDetail } = useAppSelector(state => state.AuthSlice);
    const imageFound = (userDetail?.riderDocument?.aadhaarCard?.length != 0 || userDetail?.riderDocument?.passport?.length != 0);
    const {t} = useTranslation();

    useEffect(() => {
        if (userDetail?.id) {
            dispatch(riderDetails(userDetail?.id)).unwrap()
        }
    }, [])

    const renderItem = ({ item }: { item: DocumentListProps }) => {
        return (
            <>
                <CommonDocumentUploadButton
                    title={t(item.documentTitle)}
                    onPress={() => {
                        navigation.navigate('UploadDocumentScreen', { documentDetails: item, routeName: "Edit_Profile" })
                    }}
                    source={item?.images[item.type] && item?.images[item.type]?.length !== 0 && !item?.reason ? Icons.CHECKBOX : null}
                    iconStyle={item?.images[item.type] && item?.images[item.type]?.length !== 0 && !item.reason ? Styles.iconStyle : {}}

                />
                {item.reason ? <CommonErrorText title={item.reason} /> : null}
            </>
        );
    };

    return (
        <View style={Globalstyle.container}>
            <CustomHeader
                title={documentTitle}
                onPress={() => navigation.goBack()}
                headerRightComponent={
                    (documentType !== "Update Document Details" && documentType !== "Upload Document")
                    &&
                    <TouchableOpacity
                        onPress={() => {
                            if (!userDetail?.name) {
                                navigation.goBack()
                            } else {
                                navigation.reset({
                                    index: 0,
                                    routes: [{
                                        name: 'DrawerStack'
                                    }]
                                })
                            }
                        }}>
                        <Text style={Styles.skipBtntext}>{t(TranslationKeys.skip)}</Text>
                    </TouchableOpacity>}
            />
            <CustomContainer>
                <FlatList
                    data={useIdentificationDocument?.slice(0, 3)}
                    keyExtractor={(index) => index.toString()}
                    renderItem={renderItem}
                    ItemSeparatorComponent={(item) => {
                        return (
                            <>
                                {item.leadingItem.id == 2 ?
                                    <View style={Styles.sepratorContainerStyle}>
                                        <View style={Styles.sepratorLineStyle} />
                                        <Text style={Styles.orTxtStyle}>{t(TranslationKeys.or)}</Text>
                                    </View>
                                    : null}
                            </>
                        )
                    }
                    }
                />
            </CustomContainer>
            {documentType == "Upload Document" ?
                <CustomBottomBtn title={t(TranslationKeys.next)}
                    onPress={() => {
                        navigation.goBack();
                    }}
                    disabled={imageFound ? false : true}
                    style={{ backgroundColor: imageFound ? colors.PRIMARY : colors.DISABLE_BUTTON }}
                /> : null
            }
        </View>
    );
};

export default DocumentListScreen;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return StyleSheet.create({
        iconStyle: {
            width: wp(5.5),
            height: wp(5.5),
            resizeMode: 'contain',
            borderRadius: wp(7),
            tintColor: undefined
        },
        skipBtntext: {
            color: colors.PRIMARY,
            fontSize: FontSizes.FONT_SIZE_15,
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
        },
        sepratorContainerStyle: {
            paddingVertical: wp(2),
            justifyContent: "center",
            alignItems: 'center',
        },
        sepratorLineStyle: {
            width: "100%",
            backgroundColor: colors.SEPARATOR_LINE,
            height: wp(0.5),
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
