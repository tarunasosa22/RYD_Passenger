import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import { axiosClient } from "../../../config/Axios";
import { parseErrorData } from "../../CommonSlice";
import { AppAlert } from "../../../utils/AppAlerts";
import { ApiConstants } from "../../../config/ApiConstants";
import { RideDetailsTypes } from "../homeSlice/HomeSlice";
import { TranslationKeys } from "../../../localization/TranslationKeys";
import { t } from "i18next";


interface NotificationListProps {
    count: number,
    next?: string | null,
    previous?: string | null
    results: NotificationDataProps[],
}

interface initialStateTypes {
    isLoading: boolean,
    notificationListData: NotificationListProps,
};

const initialState: initialStateTypes = {
    isLoading: false,
    notificationListData: {
        count: 0,
        next: null,
        previous: null,
        results: [],
    }
};

export interface NotificationProps {
    id: number,
    title: string,
    type: string,
    description: string,
    body: {
        imageUrl: string,
        type: string,
        details: RideDetailsTypes
    },
    sentAt: string,
    isRead: boolean,

}

export interface NotificationDataProps {
    date: string,
    details: NotificationProps[]
}

export interface apiErrorTypes {
    data: string | string[],
};
interface paramsTypes {
    offset?: number,
    device_id?: string
};


const NOTIFICATION = "NOTIFICATION";

export const notificationList = createAsyncThunk<NotificationListProps, paramsTypes, { rejectValue: apiErrorTypes }>(NOTIFICATION + "/notificationList",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.NOTIFICATIONLIST + `?offset=${params.offset}&device_id=${params.device_id}&limit=10`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const markAllNotification = createAsyncThunk<{ message: string }, null, { rejectValue: apiErrorTypes }>(NOTIFICATION + "/markAllNotification",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.put(ApiConstants.MARKALLNOTIFICATION)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });


export const NotificationSlice = createSlice({
    name: NOTIFICATION,
    initialState,
    reducers: {
        resetNotificationListData: (state) => {
            state.notificationListData = {
                count: 0,
                next: null,
                previous: null,
                results: []
            }
        },
    },
    extraReducers(builder) {
        // Notification List
        builder.addCase(notificationList.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(notificationList.fulfilled, (state, action) => {
            state.isLoading = false
            let tempArray
            if (action.meta.arg.offset == 0) {
                tempArray = action.payload
            } else {
                const oldData = current(state.notificationListData?.results)
                const newData = action.payload.results
                const arrayLen = oldData?.length - 1;
                const sameDateFound = oldData[arrayLen]?.date === newData[0]?.date;

                if (sameDateFound) {
                    // let notificationItemDetails = oldData?.[arrayLen];
                    // notificationItemDetails = {
                    //     ...notificationItemDetails,
                    //     details: [
                    //         ...newData[0].details,
                    //         ...notificationItemDetails.details
                    //     ]
                    let notificationItemDetails = {
                        ...oldData?.[arrayLen],
                        details: [
                            ...oldData?.[arrayLen].details,
                            ...newData[0].details,
                        ]
                    };

                    const filterPayloadData = newData?.filter((item, index) => index !== 0);
                    const filterOldData = oldData.filter((item, index) => index !== arrayLen);

                    const combineNotificationData = [
                        ...filterOldData,
                        notificationItemDetails,
                        ...filterPayloadData,
                    ];

                    tempArray = {
                        ...action.payload,
                        results: combineNotificationData
                    };

                } else {
                    tempArray = {
                        ...action.payload,
                        results: [...oldData, ...action.payload?.results]
                    }
                }
            }
            state.notificationListData = action.meta.arg.offset == 0 ? action.payload : tempArray
        });
        builder.addCase(notificationList.rejected, (state, action) => {
            state.isLoading = false
        });
        //MARK ALL NOTIFICATION
        builder.addCase(markAllNotification.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(markAllNotification.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(markAllNotification.rejected, (state, action) => {
            state.isLoading = false
        });
    },
});

export const { resetNotificationListData } = NotificationSlice.actions;
export default NotificationSlice.reducer;
