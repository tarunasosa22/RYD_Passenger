import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useGlobalStyles } from '../../hooks/useGlobalStyles'
import CustomActivityIndicator from '../../components/CustomActivityIndicator'
import { useAppDispatch, useAppSelector } from '../../redux/Store'
import CustomHeader from '../../components/CustomHeader'
import { TranslationKeys } from '../../localization/TranslationKeys'
import { useTranslation } from 'react-i18next'
import useCustomNavigation from '../../hooks/useCustomNavigation'
import { widthPercentageToDP as wp } from 'react-native-responsive-screen'
import CustomContainer from '../../components/CustomContainer'
import { ImagesPaths } from '../../utils/ImagesPaths'
import { FontSizes } from '../../styles/FontSizes'
import { Fonts } from '../../styles/Fonts'
import moment from 'moment'
import CustomBottomBtn from '../../components/CustomBottomBtn'
import { SOCKET_STATUS, UserDocobj, transferStatusState, upiVericiationStatus, verificationStatus } from '../../utils/Constats'
import CustomModelAlert from '../../components/CustomAlertModal';
import { useIsFocused } from '@react-navigation/native'
import { getWalletDetails } from '../../redux/slice/referralSlice/ReferralSlice'
import { WITH_DRAWALS } from '../../config/Host'
import { TransactionData, getWithdrawalData, resetTransactionData, setWithDrawalMoneyOption, withDrawalMoney } from '../../redux/slice/paymentSlice/PaymentSlice'
import { Icons } from '../../utils/IconsPaths'
import { setPrice } from '../../utils/HelperFunctions'
import ReactNativeModal from 'react-native-modal'
import i18n from '../../localization/i18n'
import { useLanguage } from '../../context/LanguageContext'
import 'moment/locale/ar';
import 'moment/locale/en-gb';
import 'moment/locale/hi';

interface SocketWithDrawalType {
    status: string,
    message: string,
    data: {
        referenceId: string,
        utr: string,
        acknowledged: number
    }
}

export const withdrawalOptionList = [
    {
        id: "upi",
        title: "UPI",
        icon: Icons.upi
    },
    {
        id: "banktransfer",
        title: "Bank Transfer",
        icon: Icons.bank_transfer
    }
]

const WithDrawalsScreen = () => {
    const GlobalStyles = useGlobalStyles()
    const { colors } = useAppSelector(state => state.CommonSlice)
    const { t } = useTranslation()
    const navigation = useCustomNavigation('DrawerStack')
    const Styles = useStyle()
    const focus = useIsFocused()
    const dispatch = useAppDispatch()
    const withdrwalRef = useRef<WebSocket>()
    const { userDetail, useIdentificationDocument } = useAppSelector(state => state.AuthSlice)
    const { isLoading, withDrawalList } = useAppSelector(state => state.PaymentSlice)
    const { tokenDetail } = useAppSelector(state => state.AuthSlice);
    const { networkStatus } = useAppSelector(state => state.SettingSlice)
    const [modelTitle, setModelTitle] = useState<string>("")
    const [transactionListOffset, setTransactionListOffset] = useState<number>(0);
    const [isVisible, setIsVisibleModel] = useState<{ message: string, visible: boolean }>({ message: '', visible: false })
    const [visibleBtn, setVisibleBtn] = useState(false)
    const [isVisibleWithDrawalModal, setIsVisibleWithDrawalModal] = useState<{ type: string, visible: boolean }>({ type: '', visible: false });
    const isSelectedWithdrawalModal = isVisibleWithDrawalModal?.type == t(TranslationKeys.withdraw);
    const [transferStatusMsg, setTransferStatusMsg] = useState("");
    const [transferStatusDetails, setTransferStatusDetails] = useState<TransactionData[] | []>([])
    const [amount, setAmount] = useState<string>("")
    const [isFooterLoading, setIsFooterLoading] = useState(false)
    const [isSelectWithdrawalOption, setIsSelectWithdrawalOption] = useState(false)
    const [isSelectWithdrwal, setisSelectWithdrwal] = useState<String>()
    const { langCode } = useLanguage()

    useEffect(() => {
        if (focus) {
            dispatch(getWalletDetails(null)).unwrap()
            connectionInit()
            getFormattedDate()
        }
        return () => {
            if (withdrwalRef.current) {
                withdrwalRef.current?.close()
            }
        }
    }, [focus])

    useEffect(() => {
        if (focus) {
            let params: { offset: number } = {
                offset: 0,
            }
            getTransactionListApi(params)
        }
    }, [focus])

    const getFormattedDate = () => {
        moment.locale(langCode);
    }

    useEffect(() => {
        if (focus && withDrawalList.results) {
            withDrawalList.results.map((item) => {
                switch (item.transferStatus) {
                    case transferStatusState.PENDING:
                        setAmount(item.amount)
                        setTransferStatusMsg(item.message)
                        break;
                    case transferStatusState.TRANSFER_REJECTED:
                        setAmount(item.amount)
                        setTransferStatusMsg(item.message)
                        break;
                    case transferStatusState.TRANSFER_REVERSED:
                        setAmount(item.amount)
                        setTransferStatusMsg(item.message)
                        break;
                    case transferStatusState.ERROR:
                        setAmount(item.amount)
                        setTransferStatusMsg(item.message)
                        break;
                    case transferStatusState.TRANSFER_FAILED:
                        setAmount(item.amount)
                        setTransferStatusMsg(item.message)
                        break;
                    case transferStatusState.SUCCESS:
                        setTransferStatusMsg("")
                        break;
                    case transferStatusState.TRANSFER_SUCCESS:
                        setTransferStatusMsg("")
                        break;
                }
            })
        }
    }, [withDrawalList.results])

    const handleSwitchLanguage = (id: string) => {
        setIsSelectWithdrawalOption(false)
        if (id == "upi") {
            setisSelectWithdrwal(id)
            dispatch(setWithDrawalMoneyOption(id))
            withdrawalStatusVerification(userDetail?.upiStatus, "upi")
        } else if (id == "banktransfer") {
            setisSelectWithdrwal(id)
            dispatch(setWithDrawalMoneyOption(id))
            withdrawalStatusVerification(userDetail?.bankStatus, "banktransfer")
        }
    }

    const renderLanguage = ({ item }: { item: any }) => {
        return (
            <TouchableWithoutFeedback onPress={() => handleSwitchLanguage(item.id)}>
                <View
                    style={[GlobalStyles.rowContainer,
                    Styles.languageItemContainer,
                    item?.id === isSelectWithdrwal
                        ? { backgroundColor: colors.SHADOW_1 }
                        : null,
                    ]}
                >
                    <View
                        style={[Styles.selectedLanguageContainer, item?.id === isSelectWithdrwal ? { backgroundColor: colors.SECONDARY } : null]}
                    />
                    <Image
                        source={
                            item?.icon
                        }
                        style={Styles.languageListContainer}
                    />
                    <Text style={[GlobalStyles.subTitleStyle, { marginLeft: "5%" }]}>{t(item?.title)}</Text>
                </View>
            </TouchableWithoutFeedback>
        )
    }


    const getTransactionListApi = (params: { offset: number }) => {

        dispatch(getWithdrawalData(params)).unwrap().then(res => {
            setIsFooterLoading(false)
            console.log("Response ==>", res)
            // setTransferStatusDetails(res?.results)
            setTransactionListOffset(params.offset + 10)
        }).catch((e) => {
            setIsFooterLoading(false)
        })
    }

    const url = `${WITH_DRAWALS}`

    const connectionInit = () => {
        withdrwalRef.current = new WebSocket(url, null, {
            headers: {
                Authorization: `Token ${tokenDetail?.authToken}`,
                "Accept-Language": i18n.language
            }
        })
        withdrwalRef.current.onopen = () => {
            console.log("CONNECTION OPEN");
        }
        withdrwalRef.current.addEventListener("error", (erorr) => {
            console.log("CONNECTION ERROR", erorr.message, erorr);
            // if (withdrwalRef?.current?.readyState == SOCKET_STATUS.CLOSED && networkStatus) {
            //     setTimeout(() => {
            //         connectionInit()
            //     }, 2000);
            // }
            // setLoading(false)
        })
        withdrwalRef.current.addEventListener("open", () => {
            console.log("CONNECTION OPEN");
        })
        withdrwalRef.current.addEventListener("close", () => {
            console.log("CONNECTION CLOSE");
            if (navigation.getId() == "WithDrawalsScreen") {
                setTimeout(() => {
                    connectionInit()
                }, 600);
            }
        })
        withdrwalRef.current.addEventListener("message", (message) => {
            console.log("MESSAGE_WITHDRAWALS", message.data)
            const msgDetails = JSON.parse(message.data)
            console.log("msg", msgDetails)
            let params: { offset: number } = {
                offset: 0,
            }
            if (msgDetails?.transfer_status == transferStatusState.SUCCESS) {
                setIsVisibleWithDrawalModal({ type: t(TranslationKeys.payment_success), visible: true })
                dispatch(getWalletDetails(null)).unwrap();
                setTransferStatusMsg("");
                getTransactionListApi(params);
            } else {
                setTransferStatusMsg(msgDetails?.message);
            }
            // dispatch(setWithDrawalMoney(msgDetails))
        })
    }

    const isOpenModel = (isVisible: boolean, title: string, message: string) => {
        setTimeout(() => {
            setIsVisibleModel({ message: message, visible: isVisible }),
                setModelTitle(title)
        }, 1000);
    }

    console.log('VISISBLE-->', isVisible)
    const withdrawalStatusVerification = (bankStatus: string | undefined, upiStatus: string | undefined) => {
        console.log("upiStatus--->", upiStatus, bankStatus, upiVericiationStatus.NOT_SUBMITTED === bankStatus)
        // setIsVisibleModel({ message: 'Your Upi Id is not submitted.', visible: true }),
        //     console.log('VISISBLE-->', isVisible)
        // setModelTitle("UPI Not Submitted")
        if (upiStatus === "banktransfer") {
            switch (bankStatus) {
                case verificationStatus.ACCOUNT_IS_VALID:
                    const data = new FormData()
                    data.append("amount", withDrawalList?.walletBalance)
                    data.append("withdraw_via", upiStatus)
                    dispatch(withDrawalMoney(data)).unwrap().then((res) => {
                        setIsVisibleWithDrawalModal({ type: t(TranslationKeys.payment_success), visible: true })
                        dispatch(resetTransactionData())
                    })
                    break;
                // case verificationStatus.INVALID_BANK_ACCOUNT:
                //     return isOpenModel(true, "Invalid Bank Account Number", 'Oops! Check your bank account number it seems wrong.')

                //     break;
                // case verificationStatus.INVALID_IFSC:
                //     return isOpenModel(true, "Invalid IFSC Code", 'Oops! Check your IFSC code it seems wrong.')

                //     break;
                // case verificationStatus.ACCOUNT_BLOCKED:
                //     return isOpenModel(true, "Bank Account blocked", 'Please update your bank details or contact your bank.')

                //     break;
                // case verificationStatus.NRE_ACCOUNT:
                //     return isOpenModel(true, "Invalid Bank Account", 'Your bank account is not an Indian please verify your account details.')

                //     break;
                case verificationStatus.NOT_SUBMITTED:
                    return isOpenModel(true, `${(userDetail?.accountNumber == "" || !userDetail?.accountNumber) ? 'Add' : 'Update'} Bank Details`, `Please ${(userDetail?.accountNumber == "" || !userDetail?.accountNumber) ? 'add' : 'update'} your bank details for withdrawal process It is mendatory.`)

                    break;
                // case verificationStatus.FAILED_AT_BANK:
                //     return isOpenModel(true, "Failed Bank Verification", 'Your bank account verification is failed, please check it.')
            }
        }
        else if (upiStatus === "upi") {
            switch (bankStatus) {
                case upiVericiationStatus.VALID:
                    const data = new FormData()
                    data.append("amount", withDrawalList?.walletBalance)
                    data.append("withdraw_via", upiStatus)
                    dispatch(withDrawalMoney(data)).unwrap().then((res) => {
                        setIsVisibleWithDrawalModal({ type: t(TranslationKeys.payment_success), visible: true })
                        dispatch(resetTransactionData())
                        setisSelectWithdrwal("")
                    })
                    break;
                case upiVericiationStatus.NOT_SUBMITTED:
                    return isOpenModel(true, `${(userDetail?.upiId == "" || !userDetail?.upiId) ? 'Add' : 'Update'} UPI Id`, `Please ${(userDetail?.upiId == "" || !userDetail?.upiId) ? 'add' : 'update'} your upi id`)

                    break;
                // case upiVericiationStatus.EXPIRED:
                //     return isOpenModel(true, "UPI Expired", 'Your Upi Id is expired.')

                //     break;
                // case upiVericiationStatus.INVALID:
                //     return isOpenModel(true, "UPI Invalid", 'Your Upi Id is expiredYour Upi Id is invalid.')

                //     break;
                // case upiVericiationStatus.NPCI_NAME_INCORRECT:
                //     return isOpenModel(true, "Failed Bank Verification", 'Your bank account verification is failed, please check it.')
                //     break;
            }
        }
    }

    const ItemSeparatorComponent = () => (
        <View style={Styles.itemSeperator} />
    );

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        return (
            <>
                <View style={[GlobalStyles.rowContainer,]}>
                    <View style={{
                        marginRight: wp(5),
                        padding: wp(2),
                        borderRadius: wp(5),
                        backgroundColor: (item?.amount?.includes("-") || item?.amountFrom === "FROM_WITHDRAW") ? colors.ERROR_PRIMARY_BACKGROUND : colors.PRIMARY
                    }}>
                        <Image source={ImagesPaths.MONEY_IMAGE} style={[{
                            width: wp(6),
                            height: wp(6),
                            resizeMode: "contain",
                            tintColor: colors.PRIMARY_TEXT,
                            alignSelf: 'center',
                        }]} />
                    </View>

                    {/* <Text style={[Styles.statusText, { alignSelf: 'center', marginRight: wp(5), backgroundColor: (item?.amount?.includes("-") || item?.amountFrom === "FROM_WITHDRAW") ? colors.ERROR_PRIMARY_BACKGROUND : colors.PRIMARY }]}>{setPrice(t, 0, true)}</Text> */}
                    <View style={{ flex: 1 }}>
                        <Text numberOfLines={2} style={[GlobalStyles.subTitleStyle, { maxWidth: wp(80), fontFamily: Fonts.FONT_POP_MEDIUM }]}>{item.info}</Text>
                        <Text style={Styles.totalRewardText}>{moment(item.createdAt).format('LLL')}</Text>
                    </View>
                    <Text style={[GlobalStyles.subTitleStyle, { textAlign: 'left', maxWidth: wp(30), color: (item?.amount?.includes("-") || item?.amountFrom === "FROM_WITHDRAW") ? colors.ERROR_TEXT : colors.GREEN_PAYMENT, fontFamily: Fonts.FONT_POP_MEDIUM }]}>{item?.amount}</Text>
                </View>
                {transferStatusMsg && index == 0 && (
                    // <View style={{ margin: wp(2) }}>
                    <Text style={Styles.errorText}>{transferStatusMsg} for your last amount is {setPrice(t, amount)}</Text>
                    // </View>
                )}
            </>
        );
    }

    return (
        <View style={GlobalStyles.container}>
            {(isLoading && !isFooterLoading) ? <CustomActivityIndicator /> : null}
            <CustomHeader title={t(TranslationKeys.wallet)} onPress={() => {
                if (navigation?.getId() == "DrawerStack") {
                    navigation.openDrawer()
                } else {
                    navigation.goBack()
                }
            }} />
            <CustomContainer>
                <View style={[GlobalStyles.rowContainer, Styles.walletContainerStyle]}>
                    <Image source={ImagesPaths.MONEY_IMAGE} style={Styles.moneyImageStyle} />
                    <View style={{ paddingHorizontal: wp(3) }}>
                        <Text style={Styles.totalRewardText}>{t(TranslationKeys.total_income)}</Text>
                        <Text style={[GlobalStyles.mainTitleStyle, { maxWidth: wp(50) }]}>{setPrice(t, withDrawalList?.walletBalance, false, false)}</Text>
                    </View>
                </View>


                <View style={Styles.transactionListContainer}>
                    <FlatList
                        data={withDrawalList.results}
                        keyExtractor={(item, index) => item.id.toString()}
                        renderItem={renderItem}
                        // bounces={false}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={ItemSeparatorComponent}
                        onEndReachedThreshold={0.2}
                        ListEmptyComponent={
                            <View style={Styles.emptyContainerStyle}>
                                <Text style={Styles.emptyTxtStyle}>{t(TranslationKeys.transaction_data_not_found)}</Text>
                            </View>
                        }
                        ListFooterComponent={() => {
                            return (
                                isFooterLoading &&
                                <ActivityIndicator style={{ margin: wp(5) }} color={colors.PRIMARY} />
                            );
                        }}
                        onEndReached={() => {
                            if (!isLoading) {
                                let params = {
                                    offset: transactionListOffset,
                                };
                                if (withDrawalList?.next) {
                                    setIsFooterLoading(true)
                                    getTransactionListApi(params);
                                }
                            }
                        }}
                    />
                </View>
            </CustomContainer>
            {isVisible.visible &&
                <CustomModelAlert
                    title={modelTitle}
                    subTitle={isVisible?.message}
                    isOpen={isVisible.visible}
                    yesBtnTitle={visibleBtn ? "Update Bank Details" : "Ok"}
                    yesBtnVisible={visibleBtn}
                    onPressYes={() => {
                        const bankDoc = useIdentificationDocument?.find(item => item?.documentType == UserDocobj.bankAccountImage)
                        if (bankDoc) {
                            if (isSelectWithdrwal == "banktransfer" && userDetail?.bankStatus === verificationStatus.ACCOUNT_IS_VALID) {
                                setIsVisibleModel({ message: "", visible: false })
                            }
                            else if (isSelectWithdrwal == "upi" && userDetail?.upiStatus === upiVericiationStatus.VALID) {
                                setIsVisibleModel({ message: "", visible: false })
                            }
                            else {
                                setIsVisibleModel({ message: "", visible: false })
                                navigation.navigate('UploadDocumentScreen', { documentDetails: bankDoc, routeName: "Edit_Profile", isNotGoingUnderReview: true })
                            }
                        }
                    }}
                    noBtnTitle={visibleBtn ? "Ok" : ""}
                    onPressNo={() => {
                        setIsVisibleModel({ message: "", visible: false })
                    }}
                />
            }
            {
                isVisibleWithDrawalModal.visible &&
                <CustomModelAlert
                    title={isSelectedWithdrawalModal ? t(TranslationKeys.withdrawal_completed) : t(TranslationKeys.payment_success)}
                    subTitle={isSelectedWithdrawalModal ? t(TranslationKeys.withdrawal_successfully_completed_msg) : t(TranslationKeys.payment_statement)}
                    isOpen={isVisibleWithDrawalModal.visible}
                    isIconVisible={true}
                    animationSource={isSelectedWithdrawalModal ? Icons.WITH_DRAWAL_ANIMATION : Icons.PAYMENT_SUCCESS}
                    yesBtnTitle='Ok'
                    onPressYes={() => {
                        if (!isSelectedWithdrawalModal) {
                            let params: { offset: number } = {
                                offset: 0,
                            }
                            getTransactionListApi(params)
                        }
                        setIsVisibleWithDrawalModal({ type: '', visible: false })
                    }}
                />
            }
            {/* <CustomBottomBtn
                title={t(TranslationKeys.withdraw_now)}
                disabled={withDrawalList.walletBalance <= 0}
                style={{ backgroundColor: (withDrawalList.walletBalance == 0 ? colors.DISABLE_BUTTON : colors.PRIMARY) }}
                onPress={() => {
                    setIsSelectWithdrawalOption(true)
                }}
            /> */}

            <ReactNativeModal
                isVisible={isSelectWithdrawalOption}
                animationIn={'slideInLeft'}
                animationOut={'slideOutRight'}
                onBackdropPress={() => setIsSelectWithdrawalOption(false)}
                onBackButtonPress={() => setIsSelectWithdrawalOption(false)}
            >
                <View style={Styles.languageModalContainer}>
                    <Text style={Styles.chooseLanguageText}>{t(TranslationKeys.choose_your_withdrawal_options)}</Text>
                    <Text style={Styles.languageModalSubtitle}>{t(TranslationKeys.choose_withdrawal_text)}</Text>
                    <FlatList data={withdrawalOptionList} renderItem={renderLanguage} />
                </View>
            </ReactNativeModal>
        </View>
    )
}

export default WithDrawalsScreen

const useStyle = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)

    return StyleSheet.create({
        mainContainerStyle: {
            padding: wp(5),
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3),
            marginVertical: wp(3)
        },
        moneyImageStyle: {
            width: wp(15),
            height: wp(15),
            resizeMode: 'contain'
        },
        moneyImageStyle2: {
            width: wp(6),
            height: wp(6),
            resizeMode: 'contain',
            tintColor: 'black'
        },
        totalRewardText: {
            color: colors.SECONDARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_REGULAR,
            textAlign: 'left'
        },
        walletContainerStyle: {
            padding: wp(5),
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3),
            marginTop: wp(5),
            marginBottom: wp(3),
        },
        transactionListContainer: {
            flex: 1,
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3),
            padding: wp(5),
        },
        itemSeperator: {
            width: "100%",
            height: wp(0.2),
            alignSelf: "center",
            marginVertical: wp(4),
            backgroundColor: colors.SEPARATOR_LINE,
        },
        emptyContainerStyle: {
            marginVertical: wp(45),
            alignItems: "center",
            justifyContent: 'center'
        },
        emptyTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_15,
            color: colors.PRIMARY_TEXT
        },
        statusText: {
            color: colors.PRIMARY_TEXT,
            // textTransform: 'capitalize',
            fontSize: FontSizes.FONT_SIZE_20,
            alignSelf: 'flex-start',
            paddingHorizontal: wp(3),
            paddingVertical: wp(1),
            borderRadius: wp(5),
            marginVertical: wp(1.5),
            overflow: 'hidden'
        },
        errorText: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_12,
            color: colors.ERROR_TEXT,
            textAlign: 'left'
        },
        languageModalContainer: {
            padding: wp(5),
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3)
        },
        chooseLanguageText: {
            fontSize: FontSizes.FONT_SIZE_17,
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_SEMI_BOLD,
            marginVertical: wp(2)
        },
        languageModalSubtitle: {
            fontSize: FontSizes.FONT_SIZE_13,
            color: colors.SECONDARY_TEXT,
            fontFamily: Fonts.FONT_POP_REGULAR,
            marginBottom: wp(3)
        },
        languageItemContainer: {
            borderRadius: wp(2),
            marginVertical: "2%",
            padding: "3.5%",
        },
        selectedLanguageContainer: {
            height: "95%",
            width: "2%",
            borderBottomRightRadius: wp(5),
            borderTopRightRadius: wp(5),
            marginLeft: "-4%",
        },
        languageListContainer: {
            marginHorizontal: wp(1.5),
            tintColor: undefined,
            width: wp(8),
            height: wp(8)
        },
    })
}