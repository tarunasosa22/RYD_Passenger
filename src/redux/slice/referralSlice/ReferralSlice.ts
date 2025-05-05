import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import { ApiConstants } from "../../../config/ApiConstants";
import { axiosClient } from "../../../config/Axios";
import { parseErrorData } from "../../CommonSlice";
import { AppAlert } from "../../../utils/AppAlerts";
import { TranslationKeys } from "../../../localization/TranslationKeys";
import { t } from "i18next";
export interface paramsTypes {
    id?: number | null | undefined,
    offset?: number,
    is_scratched?: boolean,
    ride_booking_id?: number,
    formData?: FormData
};

export interface scrachCardDetails {
    message: string,
    success: boolean
    data: {
        id: number,
        rideBooking: number,
        scratchAmount: number,
        isScratched: boolean,
    }
}

export interface sratchCardDetailsProps {
    totalScratchAmount: number,
    // results: {
    count: number,
    next?: string | null,
    previous?: string | null,
    results: scrachCardDetails[]
    // }
}

interface initialStateTypes {
    isLoading: boolean,
    walletDetails: walletDetailsProps | undefined,
    appliedCode: string,
    scratchCardDetailsList: scrachCardDetails[],
    scratchCardDetails: scrachCardDetails | undefined
};

export interface walletDetailsProps {
    id: number,
    user: {
        id: number,
        password: string,
        lastLogin: string | null,
        email: string,
        isStaff: boolean,
        createdAt: string,
        updatedAt: string,
        deletedAt: string | null,
        name: string,
        phoneNumber: string,
        isSuperuser: boolean,
        isDriver: boolean,
        isActive: boolean,
        isAdmin: boolean,
        isSubAdmin: boolean,
        dateJoined: string,
        languagePreference: string,
        referralCode: string,
        referredBy: string | null,
        groups: [],
        userPermissions: []
    },
    createdAt: string,
    updatedAt: string,
    isActive: boolean,
    deletedAt: string,
    balance: string
}

const initialState: initialStateTypes = {
    isLoading: false,
    walletDetails: undefined,
    appliedCode: '',
    scratchCardDetails: undefined,
    // scratchCardDetailsList: {
    //     totalScratchAmount: 0,
    //     // results:  {
    //         count: 0,
    //         next: null,
    //         previous: null,
    //         results: []
    //     // }
    // }
    scratchCardDetailsList: []
};

export interface apiErrorTypes {
    data: string | string[],
};



const REFERRAL = "REFERRAL";

export const getWalletDetails = createAsyncThunk<walletDetailsProps, null, { rejectValue: apiErrorTypes }>(REFERRAL + "/getWalletDetails",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.GET_WALLET_DETAILS)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });
export const getScrtachCardDetails = createAsyncThunk<scrachCardDetails, number, { rejectValue: apiErrorTypes }>(REFERRAL + "/getScrtachCardDetails",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.SCRTACH_CARD_DETAILS + `${params}/`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const getScrtachCardDetailsList = createAsyncThunk<any, null, { rejectValue: apiErrorTypes }>(REFERRAL + "/getSrtachCardDetailsList",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.SCRTACH_CARD_LIST)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const isScratachCard = createAsyncThunk<scrachCardDetails, paramsTypes, { rejectValue: apiErrorTypes }>(REFERRAL + "/isScratachCard",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.patch(ApiConstants.SCRTACH_CARD_LIST_EDIT + `${params.id}/`, params.formData)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });


export const ReferralSlice = createSlice({
    name: REFERRAL,
    initialState,
    reducers: {
        setRefferedCodeReducer: (state, action) => {
            state.appliedCode = action.payload
        },
        setScrtachCardDetails: (state, action) => {
            state.scratchCardDetails = action.payload
        },
        setScrtachCardDetailsList: (state, action) => {
            state.scratchCardDetailsList = action.payload
        },
        resetSctachCardDetailsList: (state, action) => {
            state.scratchCardDetailsList = []
            // {
            //     totalScratchAmount: 0,
            //     // results:  {
            //     count: 0,
            //     next: null,
            //     previous: null,
            //     results: []
            //     // }
            // }
        }
    },
    extraReducers(builder) {
        // getWalletDetails
        builder.addCase(getWalletDetails.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(getWalletDetails.fulfilled, (state, action) => {
            state.isLoading = false
            state.walletDetails = action.payload
        });
        builder.addCase(getWalletDetails.rejected, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(getScrtachCardDetails.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(getScrtachCardDetails.fulfilled, (state, action) => {
            state.isLoading = false
            // state.scratchCardDetails = action.payload
        });
        builder.addCase(getScrtachCardDetails.rejected, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(getScrtachCardDetailsList.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(getScrtachCardDetailsList.fulfilled, (state, action) => {
            state.isLoading = false
            // let tempArray = action.meta.arg.offset == 0 ? action.payload : {
            //     ...action.payload,
            //     results: [...current(state.scratchCardDetailsList?.results), ...action.payload?.results]
            // }
            // state.scratchCardDetailsList = action.meta.arg.offset == 0 ? action.payload : tempArray
            state.scratchCardDetailsList = action.payload
        });
        builder.addCase(getScrtachCardDetailsList.rejected, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(isScratachCard.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(isScratachCard.fulfilled, (state, action) => {
            state.isLoading = false
            state.scratchCardDetails = action.payload
        });
        builder.addCase(isScratachCard.rejected, (state, action) => {
            state.isLoading = false
        });
    },
});

export const { setRefferedCodeReducer, setScrtachCardDetails, setScrtachCardDetailsList, resetSctachCardDetailsList } = ReferralSlice.actions;
export default ReferralSlice.reducer;
