import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard, ImageBackground } from 'react-native';
import { Bubble, GiftedChat, IMessage, InputToolbar, BubbleProps, MessageText, InputToolbarProps, ComposerProps, Send, SendProps, LoadEarlierProps, LoadEarlier, } from 'react-native-gifted-chat';
import { heightPercentageToDP, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import CustomHeader from '../../components/CustomHeader';
import CustomIconButton from '../../components/CustomIconButton';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';
import { useAppDispatch, useAppSelector } from '../../redux/Store';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import { Icons } from '../../utils/IconsPaths';
import { RootRouteProps } from '../../types/RootStackType';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { CHAT_WEB_SOCKET } from '../../config/Host';
import CustomActivityIndicator from '../../components/CustomActivityIndicator';
import { SOCKET_STATUS, languageList } from '../../utils/Constats';
import { changeChatLanguage, changeUserChatLanguage, messageListDetails, resetMessageList } from '../../redux/slice/chatSlice/ChatSlice';
import { setAdjustPan, setAdjustResize } from 'rn-android-keyboard-adjust';
import { contactToDriver } from '../../utils/HelperFunctions';
import { hasDynamicIsland } from 'react-native-device-info';
import CustomTextInput from '../../components/CustomTextInput';
import CustomContainer from '../../components/CustomContainer';
import RBSheet from 'react-native-raw-bottom-sheet';
import CustomCheckBox from '../../components/CustomCheckBox';
import { ImagesPaths } from '../../utils/ImagesPaths';
import { useLanguage } from '../../context/LanguageContext';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';

interface MessageProps {
    _id: number,
    text: string,
    createdAt: Date | number,
    user: {
        _id: number,
        name: string,
        avatar: string,
    },
};

interface ChatListDetailsTypes {
    id: number,
    offset: number
}

interface ChatSuggetionMessageProps {
    id: number,
    title: string
};

const ChatSuggetionMessage: ChatSuggetionMessageProps[] = [
    {
        id: 1,
        title: "I’ve arrived"
    },
    {
        id: 2,
        title: "OK, Got it!"
    },
    {
        id: 3,
        title: "I’m on my location"
    },
];

const ChatScreen = () => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const { colors } = useAppSelector((state) => state.CommonSlice);
    const { networkStatus } = useAppSelector(state => state.SettingSlice)
    const { tokenDetail, userDetail } = useAppSelector((state) => state.AuthSlice);
    const { isLoading, messageList, chatLanguage } = useAppSelector((state) => state.ChatSlice);
    const navigation = useCustomNavigation("ChatScreen");
    const route = useRoute<RootRouteProps<'ChatScreen'>>();
    const { roomId, userDetails } = route.params
    const [messages, setMessages] = useState<MessageProps[] | []>([]);
    const chatRef = useRef<GiftedChat<MessageProps> | null>(null)
    const [loading, setLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();
    const [offset, setOffSet] = useState<number>(0)
    const [footerLoading, setFooterLoading] = useState<boolean>(false)
    const [searchLanguage, setSearchLanguage] = useState<string>('')
    const bottomSheetRef = useRef<RBSheet>(null)
    const focus = useIsFocused()
    const [isRead, setisRead] = useState(true)
    const [isChangeLanguage, setisChangeLanguage] = useState<any[]>(ChatSuggetionMessage)
    const [language, setlanguage] = useState(userDetail?.chatLanguageCode ?? '')
    const { t } = useTranslation();
    const url = `${CHAT_WEB_SOCKET}${roomId}/`
    let ws: WebSocket

    useEffect(() => {
        connectionInit()
        setisRead(true)
        const params = {
            id: roomId,
            offset: offset
        }
        getMessageList(params)
        setAdjustResize();
        return () => {
            ws?.close()
            setOffSet(0)
            dispatch(resetMessageList())
            setAdjustPan()
            Keyboard.dismiss()
        }
    }, [])

    useEffect(() => {
        if (language) {
            changeLanguage(language)
        }
    }, [language])

    const changeLanguage = (languageCode: string) => {
        let tempList: any[] = []
        if (languageCode === "hi") {
            tempList = [
                {
                    id: 1,
                    title: "मैं पहूंच गया हूं"
                },
                {
                    id: 2,
                    title: "ठीक मिल गया!"
                },
                {
                    id: 3,
                    title: "मैं अपने स्थान पर हूं"
                },
            ]
            setisChangeLanguage([...tempList])
        } else if (languageCode === "en") {
            tempList = [
                {
                    id: 1,
                    title: "I’ve arrived"
                },
                {
                    id: 2,
                    title: "OK, Got it!"
                },
                {
                    id: 3,
                    title: "I’m on my location"
                },
            ]
            setisChangeLanguage([...tempList])
        }
        else {
            tempList = [
                {
                    id: 1,
                    title: "لقد وصلت"
                },
                {
                    id: 2,
                    title: "حسنًا، فهمت!"
                },
                {
                    id: 3,
                    title: "أنا في موقعي"
                },
            ]
            setisChangeLanguage([...tempList])
        }

    }


    const changeChatLanguageApiCall = (language: string) => {
        const data = new FormData()
        data.append("chat_language_preference", language)
        dispatch(changeUserChatLanguage(data)).unwrap().then(res => {
            changeLanguage(res.chatLanguagePreference)
            setlanguage(res.chatLanguagePreference)
        }).catch(e => { console.log({ e }) })
    }

    const getMessageList = (params: ChatListDetailsTypes) => {
        dispatch(messageListDetails(params)).unwrap().then((res) => {
            const messageList: MessageProps[] = []
            res?.results?.map(async (item, index) => {
                let message: MessageProps = {
                    _id: item.id,
                    createdAt: item.createdAt,
                    text: item.sender?.userMainId == userDetail?.user ? item?.senderText
                        : item.recieverText,
                    user: {
                        _id: item?.sender?.userMainId,
                        name: item?.sender?.name ?? "",
                        avatar: item?.sender?.profilePic ?? "",
                    },
                }
                messageList.push(message)
            })
            if (params.offset == 0) {
                setMessages(messageList)
                setLoading(false)
            } else {
                setMessages([...messages, ...messageList])
                setFooterLoading(false)
            }
            setOffSet(params.offset + 10)
        }).catch((error) => {
            console.log("🚀 ~ file: ChatScreen.tsx:178 ~ dispatch ~ error:", error)
        })
    }

    const connectionInit = () => {
        ws = new WebSocket(url, null, {
            headers: {
                Authorization: `Token ${tokenDetail?.authToken}`
            }
        })

        ws.onopen = () => {
            console.log("CONNECTION OPEN");
        }

        ws.addEventListener("error", (erorr) => {
            console.log("CONNECTION ERROR", erorr);
            if (ws?.readyState == SOCKET_STATUS.CLOSED && networkStatus) {
                setTimeout(() => {
                    connectionInit()
                }, 5000);
            }
            setLoading(false)
        })

        ws.addEventListener("open", () => {
            console.log("CONNECTION OPEN");
            setisRead(false)
            if (isRead) {
                ws?.send(JSON.stringify({ is_read: true }))
            }
        })

        ws.addEventListener("close", () => {
            console.log("CONNECTION CLOSE");
            if (focus) {
                focus && setTimeout(connectionInit, 2000);
            }
            ws?.send(JSON.stringify({ is_read: true }))
            setLoading(false)
        })

        ws.addEventListener('message', (message) => {
            console.log("MESSAGE", message.data);
            // ws?.send(JSON.stringify({ is_read: true }))
            const msgDetails = JSON.parse(message.data)
            const msg: MessageProps[] = [{
                _id: msgDetails.id,
                user: {
                    _id: msgDetails.sender?.userMainId,
                    name: msgDetails.sender?.name,
                    avatar: msgDetails.sender?.profilePic
                },
                //!- for sender and reciever text message for translate.
                text: msgDetails.sender?.userMainId == userDetail?.user ? (msgDetails?.senderText || msgDetails?.text)
                    : (msgDetails.recieverText || msgDetails?.text),
                createdAt: msgDetails.createdAt,
            }]
            if(msgDetails?.id){
                setisRead(false)
            if (isRead ) {
                // console.log("read--->",isRead, msgDetails)
                ws?.send(JSON.stringify({ is_read: true }))
            }
                setMessages(previousMessages => GiftedChat.append(previousMessages, msg))
            }
        })
    };

    const onSend = useCallback((messages: IMessage[] = []) => {
        console.log("SEND--->", messages[0]?.text)
        ws?.send(messages[0]?.text)
    }, []);

    const renderItem = ({ item, index }: { item: ChatSuggetionMessageProps, index: number }) => {
        return (
            <TouchableOpacity
                onPress={() => {
                    chatRef?.current?.onInputTextChanged((item.title))
                }}
                style={Styles.renderFooterContainerStyle}>
                <Text style={Styles.footerItemTxtStyle}>{item.title}</Text>
            </TouchableOpacity>
        );
    };

    const renderSend = (props: SendProps<IMessage>) => {
        return (
            <Send {...props}
                sendButtonProps={{
                    onPress: () => {
                        let texttt = ''
                        if (props.text?.startsWith('')) {
                            texttt = props.text.trim()
                            if (texttt !== '') {
                                props.onSend({
                                    text: texttt,
                                }, true)
                            }
                        }
                    }
                }}
                containerStyle={Styles.senBtnContainerStyle}>
                <Image source={Icons.SEND}
                    style={[GlobalStyle.commonIconStyle, Styles.sendIconStyle]} />
            </Send>
        );
    };

    const renderBubble = (props: BubbleProps<IMessage>) => {
        return (
            <Bubble
                {...props}
                containerStyle={{
                    left: [Styles.bubbleContainerStyle, { paddingHorizontal: wp(0.5) }],
                    right: [Styles.bubbleContainerStyle, { paddingHorizontal: wp(2) }],
                }}
                wrapperStyle={{
                    left: Styles.bubbleWrapperStyle,
                    right: Styles.bubbleWrapperStyle
                }}
                textStyle={{
                    left: Styles.bubbleTxtStyle,
                    right: [Styles.bubbleTxtStyle, Styles.bubbleTxtRightStyle],
                }}
                renderMessageText={(props) => {
                    return (
                        <View>
                            <MessageText {...props}
                                containerStyle={{
                                    left: [Styles.bubbleMessageContainerStyle, Styles.bubbleMessageContainerLeftStyle],
                                    right: [Styles.bubbleMessageContainerStyle, Styles.bubbleMessageContainerRightStyle]
                                }}
                            />
                            <View>
                                <View style={[Styles.bubbleContainerTriangleView,
                                props.position == "left" ?
                                    Styles.bubbleTriangleContainerLeftStyle
                                    :
                                    Styles.bubbleTriangleContainerRightStyle
                                ]} />
                            </View>
                        </View>
                    )
                }}
                renderTime={() => { return null }}
            />
        );
    };

    const renderChatFooter = () => {
        return (
            <View style={Styles.footerContainerStyle}>
                <FlatList
                    data={isChangeLanguage}
                    renderItem={renderItem}
                    showsHorizontalScrollIndicator={false}
                    horizontal
                    contentContainerStyle={Styles.footerListContentContainerStyle}
                />
            </View>
        );
    };

    const RenderLanguageItem = ({ item, index }: { item: { id: number, language: string, value: string }, index: number }) => {
        const memoizedRenderItem = useMemo(() => {
            return (
                <CustomCheckBox title={item.language}
                    rightIconVisible
                    value={language == item.value}
                    onPress={() => {
                        changeChatLanguageApiCall(item.value);
                        setSearchLanguage('')
                        bottomSheetRef.current?.close()
                    }} />
            );
        }, [searchLanguage]);

        return memoizedRenderItem;
    };


    const renderInputToolbar = (props: InputToolbarProps<IMessage>) => {
        return (
            <InputToolbar
                {...props}
                primaryStyle={Styles.inputToolBarPrimaryStyle}
                renderComposer={(data: ComposerProps) => {
                    return (
                        <TextInput
                            placeholder={t(TranslationKeys.type_a_message)}
                            placeholderTextColor={colors.SECONDARY_TEXT}
                            value={data.text}
                            onChangeText={data.onTextChanged}
                            style={Styles.textInputStyle} />
                    )
                }}
            />
        );
    };

    return (
        <View style={[GlobalStyle.container, { backgroundColor: colors.SECONDARY_BACKGROUND }]}>
            {(loading || isLoading) ? <CustomActivityIndicator /> : null}
            <CustomHeader
                headerStyle={{
                    backgroundColor: colors.SECONDARY_BACKGROUND
                }}
                onPress={() => {
                    navigation.goBack()
                }} title={userDetails?.name}
                headerRightComponent={
                    <>
                        <CustomIconButton icon={Icons.PHONE_ICON}
                            style={{ marginHorizontal: wp(5) }}
                            onPress={() => {
                                if (userDetails?.phoneNumber) {
                                    contactToDriver(userDetails?.phoneNumber)
                                }
                            }}
                            iconStyle={{
                                tintColor: colors.PRIMARY
                            }} />
                        <CustomIconButton
                            icon={Icons.POPUP_ICON}

                            onPress={() => {
                                bottomSheetRef?.current?.open()
                            }}
                            iconStyle={{
                                tintColor: colors.PRIMARY
                            }} />
                    </>
                }
            />
            <View style={Styles.itemSepratorStyle} />
            <ImageBackground source={ImagesPaths.CHAT_BACKGROUND} style={{ flex: 1 }} >
                <GiftedChat
                    ref={chatRef}
                    messages={messages}
                    onSend={messages => onSend(messages)}
                    renderBubble={renderBubble}
                    renderChatFooter={renderChatFooter}
                    renderSend={renderSend}
                    minInputToolbarHeight={wp(20)}
                    bottomOffset={Platform.OS == "ios" ? wp(8) : 0}
                    renderAvatar={() => null}
                    showAvatarForEveryMessage={true}
                    alwaysShowSend
                    renderInputToolbar={renderInputToolbar}
                    user={{
                        _id: Number(userDetail?.user),
                        name: userDetail?.name,
                        avatar: userDetail?.profilePic
                    }}
                    listViewProps={{
                        onEndReachedThreshold: 0.1,
                        onEndReached: () => {
                            if (messageList?.next && !footerLoading && roomId) {
                                let params = {
                                    id: roomId,
                                    offset: offset
                                }
                                // chat list api call
                                setFooterLoading(true)
                                getMessageList(params)
                            } else {
                                setFooterLoading(false)
                            }
                        },
                        contentContainerStyle: Styles.giftedChatContentContainerStyle,
                    }}
                    isLoadingEarlier={footerLoading}
                    loadEarlier={footerLoading}
                    renderLoadEarlier={(props: LoadEarlierProps) => {
                        return (
                            <LoadEarlier
                                {...props}
                                activityIndicatorColor={colors.PRIMARY_ICON}
                                wrapperStyle={{
                                    backgroundColor: colors.WHITE_ICON
                                }}
                            />
                        )
                    }}
                />
            </ImageBackground>
            <RBSheet
                ref={bottomSheetRef}
                animationType={'fade'}
                height={heightPercentageToDP(70)}
                closeOnPressBack
                closeOnPressMask
            >
                <CustomContainer style={{ paddingVertical: wp(5) }}>
                    <CustomTextInput
                        placeholder={"Choose your language"}
                        value={searchLanguage}
                        onChangeText={(text) => {
                            setSearchLanguage(text)
                        }}
                        textInputRightComponent={!!searchLanguage && <CustomIconButton icon={Icons.CLOSE_ICON} iconStyle={Styles.citySearchCloseIcon} onPress={() => setSearchLanguage('')} />}
                    />
                    <FlatList
                        data={languageList?.filter((item, index) => searchLanguage ? item.language?.includes(searchLanguage) : index !== 0)}
                        style={{ marginTop: wp(5) }}
                        showsVerticalScrollIndicator={false}
                        renderItem={(props) => <RenderLanguageItem {...props} />}
                        extraData={languageList}
                        keyExtractor={(item, index) => index?.toString()} />
                </CustomContainer>
            </RBSheet>
        </View>
    );
};

export default ChatScreen;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);
    const { locale } = useLanguage()

    return StyleSheet.create({
        footerItemTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_16,
            color: colors.BUTTON_TEXT,
        },
        renderFooterContainerStyle: {
            paddingVertical: wp(2),
            paddingHorizontal: wp(5),
            backgroundColor: colors.PRIMARY,
            borderRadius: wp(10),
            marginLeft: wp(2),
        },
        footerContainerStyle: {
            paddingVertical: wp(4)
        },
        footerListContentContainerStyle: {
            paddingRight: wp(2)
        },
        senBtnContainerStyle: {
            backgroundColor: colors.PRIMARY,
            height: wp(12),
            width: wp(12),
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: wp(12)
        },
        sendIconStyle: {
            tintColor: colors.WHITE_ICON,
            marginLeft: wp(1),
            width: wp(5),
            height: wp(5),
            resizeMode: 'contain',
            transform: [{ rotate: locale ? '180deg' : '0deg' }]
        },
        itemSepratorStyle: {
            height: wp(0.5),
            backgroundColor: colors.SEPARATOR_LINE,
            marginVertical: wp(0.5),
            marginHorizontal: wp(5)
        },
        bubbleContainerStyle: {
            marginBottom: wp(4),
        },
        bubbleWrapperStyle: {
            backgroundColor: colors.PRIMARYLIGHT
        },
        bubbleTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_16,
            color: colors.PRIMARY_TEXT,
            padding: wp(2)
        },
        bubbleTxtRightStyle: {
            color: colors.BUTTON_TEXT,
        },
        bubbleMessageContainerStyle: {
            borderTopLeftRadius: wp(3),
            borderTopRightRadius: wp(3),
        },
        bubbleMessageContainerLeftStyle: {
            backgroundColor: colors.PRIMARYLIGHT,
            borderBottomRightRadius: wp(3),
        },
        bubbleMessageContainerRightStyle: {
            backgroundColor: colors.PRIMARY,
            borderBottomLeftRadius: wp(3),
        },
        bubbleTriangleContainerLeftStyle: {
            borderBottomColor: colors.PRIMARYLIGHT,
            transform: [{ rotate: '180deg' }],
            top: wp(-0.3),
        },
        bubbleTriangleContainerRightStyle: {
            borderBottomColor: colors.PRIMARY,
            transform: [{ rotate: locale ? '90deg' : '270deg' }],
            alignSelf: "flex-end",
            top: wp(-0.3),
            // right: wp(0.1)
        },
        inputToolBarPrimaryStyle: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            padding: wp(4),
            alignItems: 'center',
        },
        textInputStyle: {
            backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
            flex: 1,
            padding: wp(2.5),
            marginHorizontal: wp(3),
            borderRadius: wp(2),
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_14,
            color: colors.SECONDARY_TEXT,
            textAlign: locale ? 'right' : 'left'
        },
        bubbleContainerTriangleView: {
            width: 0,
            height: 0,
            borderLeftWidth: wp(3),
            borderRightWidth: wp(0),
            borderBottomWidth: wp(3),
            borderStyle: 'solid',
            backgroundColor: 'transparent',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            position: "absolute",
        },
        giftedChatContentContainerStyle: {
            flexGrow: 1,
            justifyContent: "flex-end",
        },
        itemSeprator: {
            width: '100%',
            height: wp(0.5),
            backgroundColor: colors.SHEET_INDICATOR
        },
        languageDropdownContainer: {
            backgroundColor: 'white',
            position: 'absolute',
            width: wp(45.5),
            height: wp(73),
            top: hasDynamicIsland() ? wp(25) : wp(8),
            right: wp(-1),
            borderRadius: wp(3),
            paddingVertical: wp(3),
        },
        languageBtnTextStyle: {
            fontSize: FontSizes.FONT_SIZE_14,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            color: colors.PRIMARY_TEXT,
        },
        languageBtnItemContainer: {
            paddingVertical: wp(2),
            paddingHorizontal: wp(5),
        },
        floatingButtonTrigleContainer: {
            position: 'absolute',
            top: wp(-2),
            zIndex: -5,
            right: wp(5),
            height: heightPercentageToDP(3),
            width: heightPercentageToDP(3),
            backgroundColor: "white",
            borderRadius: heightPercentageToDP(0.5),
            transform: [
                { rotate: "45deg" },
            ],
        },
        citySearchCloseIcon: {
            width: wp(4),
            height: wp(4),
            resizeMode: 'stretch',
            alignSelf: 'flex-end'
        },
    });
};
