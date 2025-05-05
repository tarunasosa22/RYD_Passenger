
import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import { axiosClient } from "../../../config/Axios";
import { parseErrorData } from "../../CommonSlice";
import { AppAlert } from "../../../utils/AppAlerts";
import { ApiConstants } from "../../../config/ApiConstants";
import { TranslationKeys } from "../../../localization/TranslationKeys";
import { t } from "i18next";

interface paramsTypes {
    id?: number
    offset?: number,
}

interface InitialStateType {
    isLoading: boolean,
    withDrawalList: transactionListApi,
    withdrawalOption: string,
    isPaymentBeforeAfter: paymentBeforeAfterProps
}
export interface apiErrorTypes {
    data: string,
    status: number
};

export interface TransactionData {
    id: number,
    balance: string,
    createdAt: string,
    updatedAt: string,
    isActive: true,
    deletedAt: string,
    info: string,
    amount: string,
    user: number,
    wallet: number,
    transferStatus: string,
    message: string,
    amountFrom: string
}

interface transactionListApi {
    walletBalance: number,
    count: number,
    next?: string | null,
    previous?: string | null,
    results: TransactionData[]
}

interface paymentBeforeAfterProps {
    id: number | string,
    credentialName: string,
    credentailsDetails: string,
    takePaymentBeforeRide: boolean
}

const initialState: InitialStateType = {
    isLoading: false,
    withdrawalOption: '',
    withDrawalList: {
        count: 0,
        next: null,
        results: [],
        walletBalance: 0,
        previous: null,
    },
    isPaymentBeforeAfter: {
        id: "",
        credentailsDetails: "",
        credentialName: "",
        takePaymentBeforeRide: false
    }
}

const PAYMENT = "PAYMENT"

export const withDrawalMoney = createAsyncThunk<any, FormData, { rejectValue: apiErrorTypes }>(PAYMENT + "/withDrwalMoney",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.WITHDRAW_MONEY, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    })

    export const endRideCardPayment = createAsyncThunk<any, number|null, { rejectValue: apiErrorTypes }>(PAYMENT + "/endRideCardPayment",
    async (param, { rejectWithValue }) => {
        try {
            const response = await axiosClient.patch(ApiConstants.ENDRIDE_CARD_PAYMENT + `${param}/`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    })

export const getWithdrawalData = createAsyncThunk<transactionListApi, { offset: number }, { rejectValue: apiErrorTypes }>
    (PAYMENT + "/getWithdrawalData", async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.WITHDRAW_WALLET_HISTORY + `?limit=10&offset=${params?.offset}`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

    export const paymentBeforeAfter = createAsyncThunk<paymentBeforeAfterProps, { paymentType: string }, { rejectValue: apiErrorTypes }>
    (PAYMENT + "/paymentBeforeAfter", async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.PAYMENT_BEFORE_AFTER + `?credential_name=${params.paymentType}`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const PaymentSlice = createSlice({
    name: PAYMENT,
    initialState: initialState,
    reducers: {
        // setWithDrawalMoney: (state, action) => {
        //     state.withDrawaltDetails = action.payload
        // },
        resetTransactionData: (state) => {
            state.withDrawalList = {
                count: 0,
                next: null,
                results: [],
                walletBalance: 0,
                previous: null,
            }
        },
        setWithDrawalMoneyOption: (state, action) => {
            state.withdrawalOption = action.payload
        },
    },
    extraReducers(builder) {
        //with-drawal money
        builder.addCase(withDrawalMoney.pending, (state) => {
            state.isLoading = true
        })
        builder.addCase(withDrawalMoney.fulfilled, (state, action) => {
            state.isLoading = false

        })
        builder.addCase(withDrawalMoney.rejected, (state, action) => {
            state.isLoading = false
        })

        //Wallet History
        builder.addCase(getWithdrawalData.pending, (state, action) => {
            state.isLoading = true
        })
        builder.addCase(getWithdrawalData.fulfilled, (state, action) => {
            state.isLoading = false
            state.withDrawalList = action.meta.arg.offset == 0 ? action.payload : {
                ...action.payload,
                results: [...current(state.withDrawalList?.results), ...action.payload?.results]
            }
        })
        builder.addCase(getWithdrawalData.rejected, (state, action) => {
            state.isLoading = false
        });

        //payment before after ride
        builder.addCase(paymentBeforeAfter.pending, (state, action) => {
            state.isLoading = true
        })
        builder.addCase(paymentBeforeAfter.fulfilled, (state, action) => {
            state.isLoading = false
            state.isPaymentBeforeAfter = action.payload
        })
        builder.addCase(paymentBeforeAfter.rejected, (state, action) => {
            state.isLoading = false
        });

        //end ride card payment
        builder.addCase(endRideCardPayment.pending, (state, action) => {
            state.isLoading = true
        })
        builder.addCase(endRideCardPayment.fulfilled, (state, action) => {
            state.isLoading = false
        })
        builder.addCase(endRideCardPayment.rejected, (state, action) => {
            state.isLoading = false
        });

    }
})

export const { resetTransactionData, setWithDrawalMoneyOption } = PaymentSlice.actions
export default PaymentSlice.reducer
