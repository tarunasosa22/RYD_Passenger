import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import { ApiConstants } from "../../../config/ApiConstants";
import { axiosClient } from "../../../config/Axios";
import { parseErrorData } from "../../CommonSlice";
import { contactProps } from "../../../screens/home/EmergencyContactScreen";
import { AppAlert } from "../../../utils/AppAlerts";
import { TranslationKeys } from "../../../localization/TranslationKeys";
import { t } from "i18next";

interface initialStateTypes {
    isLoading: boolean,
    contactList: contactListProps,
    rideId: number | undefined,
};

interface contactListProps {
    count: number,
    next: string | null,
    previous: string | null,
    results: contactProps[]
};

const initialState: initialStateTypes = {
    isLoading: false,
    contactList: {
        count: 0,
        next: null,
        previous: null,
        results: []
    },
    rideId: undefined
};

export interface apiErrorTypes {
    data: string | string[],
};

interface paramsTypes {
    offset?: number,
    contact?: string,
    relationship?: string,
};

const CONTACT = "CONTACT";

export const getContactList = createAsyncThunk<contactListProps, paramsTypes, { rejectValue: apiErrorTypes }>(CONTACT + "/getContactList",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.CONTACTLIST + `?limit=10&offset=${params.offset}`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const createEmergenceyContact = createAsyncThunk<contactProps, paramsTypes, { rejectValue: apiErrorTypes }>(CONTACT + "/createEmergenceyContact",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.CREATEEMERGENCYCONTACT, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const deleteEmergencyContact = createAsyncThunk<contactProps, number, { rejectValue: apiErrorTypes }>(CONTACT + "/deleteEmergencyContact",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.delete(ApiConstants.CONTACTLIST + `${params}/`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const sendSosMessage = createAsyncThunk<{ message: "Messages sent successfully." }, FormData, { rejectValue: apiErrorTypes }>(CONTACT + "/sendSosMessage",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.SENDSOSMESSAGE, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const ContactSlice = createSlice({
    name: CONTACT,
    initialState,
    reducers: {
        filterEmergencyContactReducer: (state, action) => {
            state.contactList = action.payload
        },
        addSosRideIdReducer: (state, action) => {
            state.rideId = action.payload
        }
    },
    extraReducers(builder) {
        // Contact List 
        builder.addCase(getContactList.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(getContactList.fulfilled, (state, action) => {
            let tempArray = action.meta.arg.offset == 0 ? action.payload : {
                ...action.payload,
                results: [...current(state.contactList?.results), ...action.payload?.results]
            }
            state.contactList = action.meta.arg.offset == 0 ? action.payload : tempArray
            state.isLoading = false
        });
        builder.addCase(getContactList.rejected, (state, action) => {
            state.isLoading = false
        });
        //create emergency contact
        builder.addCase(createEmergenceyContact.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(createEmergenceyContact.fulfilled, (state) => {
            state.isLoading = false
        });
        builder.addCase(createEmergenceyContact.rejected, (state) => {
            state.isLoading = false
        });
        //delete Emergency contact
        builder.addCase(deleteEmergencyContact.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(deleteEmergencyContact.fulfilled, (state) => {
            state.isLoading = false
        });
        builder.addCase(deleteEmergencyContact.rejected, (state) => {
            state.isLoading = false
        });
        // Send sos Message 
        builder.addCase(sendSosMessage.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(sendSosMessage.fulfilled, (state) => {
            state.isLoading = false
        });
        builder.addCase(sendSosMessage.rejected, (state) => {
            state.isLoading = false
        });
    },
});

export const { filterEmergencyContactReducer, addSosRideIdReducer } = ContactSlice.actions;
export default ContactSlice.reducer;
