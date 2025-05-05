import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import { Alert } from "react-native";
import { ApiConstants } from "../../../config/ApiConstants";
import { axiosClient } from "../../../config/Axios";
import { parseErrorData } from "../../CommonSlice";
import { AppAlert } from "../../../utils/AppAlerts";
import { TranslationKeys } from "../../../localization/TranslationKeys";
import { t } from "i18next";

export interface MessageListProps {
    count: number,
    next: string | null,
    previous: string | null,
    results: MessageProps[]
}

interface initialStateTypes {
    isLoading: boolean,
    messageList: MessageListProps,
    chatLanguage: string,
    chatUserlanguage: string
}

export interface apiErrorTypes {
    data: string | string[],
};

interface MessageProps {
    id: number,
    sender: {
        id: number,
        name: string | undefined
        profilePic: string | undefined,
        userMainId: number
    },
    text: string,
    createdAt: Date
    room: string | null
    sendBy: string,
    recieverText: string,
    senderText: string,
}

interface paramsTypes {
    id?: number
    offset?: number,
}

const initialState: initialStateTypes = {
    isLoading: false,
    messageList: {
        count: 0,
        next: '',
        previous: '',
        results: []
    },
    chatLanguage: 'en',
    chatUserlanguage: 'en'
}


const CHAT = "CHAT";

export const messageListDetails = createAsyncThunk<MessageListProps, paramsTypes, { rejectValue: apiErrorTypes }>
    (CHAT + "/messageList", async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.MESSAGELIST + `${params?.id}/` + `?limit=10&offset=${params.offset}`)
            return response.data
        } catch (e: any) {
            if (e.code === "ERR_NETWORK") {
                Alert.alert(e.message)
            }
            return rejectWithValue(e?.response)
        }
    })

export const changeChatLanguage = createAsyncThunk<any, FormData, { rejectValue: apiErrorTypes }>
    (CHAT + "/changeChatLanguage", async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.patch(ApiConstants.UPDATE_CHAT_LANGUAGE, params)
            return response.data
        } catch (e: any) {
            if (e.code === "ERR_NETWORK") {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
                // Alert.alert(e.message)
            }
            return rejectWithValue(e?.response)
        }
    })

    export const changeUserChatLanguage = createAsyncThunk<any, FormData, { rejectValue: apiErrorTypes }>
    (CHAT + "/changeUserChatLanguage", async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.patch(ApiConstants.CHAT_LANGUAGE, params)
            return response.data
        } catch (e: any) {
            if (e.code === "ERR_NETWORK") {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
                // Alert.alert(e.message)
            }
            return rejectWithValue(e?.response)
        }
    })

const ChatSlice = createSlice({
    initialState,
    name: CHAT,
    reducers: {
        resetMessageList: (state) => {
            state.messageList = {
                count: 0,
                next: '',
                previous: '',
                results: []
            }
        }
    },
    extraReducers: (builder) => {
        /// message list
        builder.addCase(messageListDetails.pending, (state, action) => {
            state.isLoading = true
        })
        builder.addCase(messageListDetails.fulfilled, (state, action) => {
            state.isLoading = false
            let tempArray = action.meta.arg.offset == 0 ? action.payload : {
                ...action.payload,
                results: [...current(state.messageList?.results), ...action.payload?.results]
            }
            state.messageList = action.meta.arg.offset == 0 ? action.payload : tempArray
        })
        builder.addCase(messageListDetails.rejected, (state, action) => {
            state.isLoading = false
        })
        ///Change chat language
        builder.addCase(changeChatLanguage.pending, (state, action) => {
            state.isLoading = true
        })
        builder.addCase(changeChatLanguage.fulfilled, (state, action) => {
            state.isLoading = false
            state.chatLanguage = action?.payload?.languagePreference
        })
        builder.addCase(changeChatLanguage.rejected, (state, action) => {
            state.isLoading = false
        })
        builder.addCase(changeUserChatLanguage.pending, (state, action) => {
            state.isLoading = true
        })
        builder.addCase(changeUserChatLanguage.fulfilled, (state, action) => {
            state.isLoading = false
            state.chatUserlanguage = action?.payload?.languagePreference
        })
        builder.addCase(changeUserChatLanguage.rejected, (state, action) => {
            state.isLoading = false
        })
    },
})

export const { resetMessageList } = ChatSlice.actions
export default ChatSlice.reducer;