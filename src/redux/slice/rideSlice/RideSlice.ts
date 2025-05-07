import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import { ApiConstants } from "../../../config/ApiConstants";
import { axiosClient } from "../../../config/Axios";
import { parseErrorData } from "../../CommonSlice";
import { AppAlert } from "../../../utils/AppAlerts";
import { DeletedUserProps, RideDetailsTypes } from "../homeSlice/HomeSlice";
import { TranslationKeys } from "../../../localization/TranslationKeys";
import { t } from "i18next";
import { RIDE_STATUS } from "../../../utils/Constats";

interface GoodsInfoProps {
    goodsType: string[] | [],
    packageType: string[] | [],
    maxWeight: string,
    notes: string
}

export interface DeliveryDetails {
    id: number,
    senderFullName: string,
    senderPhoneNumber: string,
    senderPickupAddress: string,
    receiverFullName: string,
    receiverPhoneNumber: string,
    receiverDeliveryAddress: string,
    goodsType: string,
    goodsPackage: string,
    goodsWeight: number,
    selectedCar: any
}

export interface GoodsTypeProps {
    id: number,
    label: string,
    value: string
}

interface initialStateTypes {
    isLoading: boolean,
    feedbackLoading: boolean,
    billData: {
        rideDetails: {
            billUrl: string,
            platformFeeInvoice: string,
            taxInvoice: string
        }
    },
    isApiCount: number,
    rideBookingData: RideBookingListProps,
    riderActiveRideDetails: RideBookingListDetailsTypes | undefined,
    showActiveRideModal: ActiveRideModalProps,
    rideDetails: RideDetailsTypes | undefined,
    tipBtnOn: boolean,
    driverDetails: DriverDetailsTypes | undefined,
    rideStatus: string | undefined,
    nearByDriverListData: NearByDriverDataProps[] | [],
    discountCouponList: discountCoupans[],
    rideOtp: number | undefined,
    rideBookingDataList: RideBookingListProps[] | [],
    goodsInfo: GoodsInfoProps,
    phoneValidate: any
    goodsType: GoodsTypeProps[] | [],
    packageType: GoodsTypeProps[] | [],
    deliveryDetails: DeliveryDetails | undefined,
    riderCreatedRideData: RideBookingListDetailsTypes | undefined
    isNavigationIndex: boolean,
    isTipAmount: number,
    isTipConianerVisible: boolean,
    customTip: any
};

export interface DriverDetailsTypes {
    distance: number | null,
    driver: number | null,
    isArrived: true,
    isStartTracking: false,
    latitude: 21.2381279,
    longitude: 72.8874923,
    points: string,

};

interface NearByDriverDataProps {
    driver: number,
    latitude: number,
    longitude: number,
};

interface CouponDataProps {
    id: number;
    createdBy: {
        id: number;
        permissions: string[];
        lastLogin: string;
        email: string;
        isStaff: boolean;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        name: string;
        phoneNumber: string;
        isSuperuser: boolean;
        isDriver: boolean;
        isActive: boolean;
        isAdmin: boolean;
        isSubAdmin: boolean;
        dateJoined: string;
        languagePreference: string;
        groups: any[];
        userPermissions: any[];
    };
    isValidCoupon: boolean;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    deletedAt: string | null;
    discountFile: string;
    offerName: string;
    discountPercentage: string;
    discountCode: string;
    minRideAmount: string;
    maxDiscountAmount: string;
    fromDate: string;
    toDate: string;
    maxApplyTime: number;
    notifyUsersViaPushNotifications: boolean;
    totalCouponUser: number;
}

export interface discountCoupans {
    id: number,
    coupon: CouponDataProps,
    isApplied: boolean,
    user: number
}

export interface ActiveRideModalProps {
    isFirstTime: boolean,
    visibleModal: boolean
};

export interface RideBookingListProps {
    count: number,
    next?: string | null,
    previous?: string | null,
    results: RideBookingListDetailsTypes[]
};

export interface UserDetails {
    id: number,
    name: string,
    profilePic: string
};

export interface DriverDetails {
    id: number,
    name: string,
    profilePic: string,
    phoneNumber: string,
    upiId: string,
    isVerified?: boolean
};

export interface DriverCarDetails {
    id: number | null,
    name: string,
    seats: string,
    registrationNumber: string
};

export interface RideLocationTypes {
    address: string,
    latitude: number,
    longitude: number
};

interface makePaymentProps {
    payment: {
        paymentMethod: string,
        tipAmount: string,
        totalFare: string
    },
    transaction: {
        amount: string,
        id: 26,
        merchantTransactionId: string,
        merchantUserId: string,
        mobileNumber: string,
        payment: number,
        user: number,
    },
    razorpayResponse: {
        // paymentSessionId: string,
        orderId: string
    }
}

export interface RideBookingListDetailsTypes {
    bookedBy: string,
    bookedFor: {
        phone: string,
        name: string,
        bookedFor: string
    },
    points: string,
    createdAt: string,
    rideBookingOtp: string,
    distance: number | null,
    driver: DriverDetails | null,
    driverCar: DriverCarDetails | null,
    id: number,
    estimatedTime: number,
    priceModel: {
        carType: string
    },
    preBookedTime: string | null,
    pickupMode: string,
    rideLocation: {
        pickup: RideLocationTypes,
        destination: RideLocationTypes,
        stop: RideLocationTypes[] | []
    },
    rideCancelBy: { id: number, reason: string, cancelBy: string, createdAt: string, isDisputed: boolean } | null,
    ridePayment: {
        paymentMethod: string
        totalFare: number
    },
    rideStatus: string,
    rider: UserDetails | null,
    deletedUser: DeletedUserProps[],
    deliveryDetails: {
        id: number,
        senderFullName: string,
        senderPhoneNumber: string,
        senderPickupAddress: string,
        receiverFullName: string,
        receiverPhoneNumber: string,
        receiverDeliveryAddress: string,
        goodsType: string,
        goodsPackage: string,
        goodsWeight: string
    },
    isSearchingStart: boolean
};

interface FeedbackTypes {
    id: number | null,
    feedbackBy: string,
    rideBooking: {
        driver: {
            id: number,
            name: string,
            profilePic: string
        },
        driverCar: {
            id: number,
            name: string,
            registrationNumber: string,
            seats: string
        }
    },
    reason: string | null,
    rating: number
};

interface CancelRideProps {
    id: number,
    reason: string,
    cancelBy: string,
    createdAt: string,
    rideBooking: number,
    transactionId?: any,
    totalFare?: any
};

const initialState: initialStateTypes = {
    isLoading: false,
    feedbackLoading: false,
    isApiCount: 0,
    showActiveRideModal: {
        isFirstTime: true,
        visibleModal: false
    },
    rideBookingData: {
        count: 0,
        next: null,
        previous: null,
        results: []
    },
    riderActiveRideDetails: undefined,
    tipBtnOn: false,
    rideDetails: undefined,
    rideStatus: undefined,
    nearByDriverListData: [],
    discountCouponList: [],
    rideOtp: undefined,
    rideBookingDataList: [],
    phoneValidate: undefined,
    goodsInfo: {
        goodsType: [],
        packageType: [],
        maxWeight: '',
        notes: ''
    },
    goodsType: [],
    packageType: [],
    deliveryDetails: undefined,
    riderCreatedRideData: undefined,
    isNavigationIndex: false,
    isTipAmount: 0,
    isTipConianerVisible: false,
    customTip: ''
};

export interface apiErrorTypes {
    data: string | string[],
};

interface paramsTypes {
    offset?: number,
    pickup_mode?: string,
    ride_booking?: number,
    rating?: number,
    reason?: string,
    status?: string,
    formData?: FormData,
    rideId?: any,
    pre_ride?: boolean,
    active_ride?: boolean
};

const RIDE = "HOME";

export const rideBookingList = createAsyncThunk<RideBookingListProps, paramsTypes, { rejectValue: apiErrorTypes }>(RIDE + "/rideBookingList",
    async (params, { rejectWithValue }) => {
        try {
            const url = ApiConstants.RIDERBOOKLATER + `?status=${params.status}&limit=10&offset=${params.offset}`
            let response
            if (params.pickup_mode) {
                response = await axiosClient.get(url + `&pickup_mode=${params.pickup_mode}`)
            }
            else if (params.active_ride !== undefined) {
                response = await axiosClient.get(url + `&active_ride=${params.active_ride}`)
            }
            else if (params.pre_ride !== undefined) {
                response = await axiosClient.get(url + `&pre_ride=${params.pre_ride}`)
            }
            else {
                response = await axiosClient.get(url)
            }
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const cancelRide = createAsyncThunk<CancelRideProps, paramsTypes, { rejectValue: apiErrorTypes }>(RIDE + "/cancelRide",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.CENCELRIDE, params.formData)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const feedbackApi = createAsyncThunk<FeedbackTypes, FormData, { rejectValue: apiErrorTypes }>(RIDE + "/feedbackApi",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.FEEDBACKAPI, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const riderActiveRide = createAsyncThunk<RideBookingListDetailsTypes, null, { rejectValue: apiErrorTypes }>(RIDE + "/riderActiveRide",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.RIDERACTIVERIDE)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const startRideDriverLocation = createAsyncThunk<NearByDriverDataProps[], string, { rejectValue: apiErrorTypes }>(RIDE + "/startRideDriverLocation",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.STARTRIDEDRIVERLOCATION + `?pickup_locations=${params}`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const setApiCounter = createAsyncThunk<any, any, { rejectValue: apiErrorTypes }>(RIDE + "/apiCounter",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.API_COUNTER, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const deleteRideBooking = createAsyncThunk<null, number, { rejectValue: apiErrorTypes }>(RIDE + "/deleteRideBooking",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.delete(ApiConstants.DELETERIDEBOOKING + `${params}/`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const enableSecureMode = createAsyncThunk<any, FormData, { rejectValue: apiErrorTypes }>(RIDE + "/enableSecureMode",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.patch(ApiConstants.ENABLE_SECURE_MODE, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                // const error = parseErrorData(e.response)
                // AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const makeRidePayment = createAsyncThunk<makePaymentProps, paramsTypes, { rejectValue: apiErrorTypes }>(RIDE + "/makeRidePayment",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.patch(ApiConstants.MAKE_PAYMENT + `${params.rideId}/`, params.formData)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const getDiscountListApi = createAsyncThunk<discountCoupans[], null, { rejectValue: apiErrorTypes }>(RIDE + "/getDiscountListApi",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.GET_DISCOUNT_COUPON)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const applyDiscountCoupons = createAsyncThunk<any, object, { rejectValue: apiErrorTypes }>(RIDE + "/applyDiscountCoupons",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.patch(ApiConstants.APPLY_DISCOUNT_COUPON, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const rideBillPdf = createAsyncThunk<any, { id: number, type: string }, { rejectValue: apiErrorTypes }>(RIDE + "/rideBillPdf",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.RIDE_BILL_PDF + `?ride_id=${params.id}&pdf_type=${params.type}`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const goodsInfoApi = createAsyncThunk<any, null, { rejectValue: apiErrorTypes }>(RIDE + "/goodsInfoApi",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.GOODS_INFO)
            return response.data[0] ?? {}
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const phone_validation_api = createAsyncThunk<any, FormData, { rejectValue: apiErrorTypes }>(RIDE + "/phoneValidationApi",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.PHONE_VALIDATION, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                // AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const RideSlice = createSlice({
    name: RIDE,
    initialState,
    reducers: {
        resetRideBookingData: (state) => {
            state.rideBookingData = {
                count: 0,
                next: null,
                previous: null,
                results: []
            }
        },
        setRideBookingData: (state, action) => {
            state.rideBookingDataList = action.payload
        },
        showActiveRideModalReducer: (state, action) => {
            state.showActiveRideModal = action.payload
        },
        setRideDetailsData: (state, action) => {
            state.rideDetails = action.payload
        },
        resetRideDetailsData: (state) => {
            state.rideDetails = undefined
        },
        setTipBtnOn: (state, action) => {
            state.tipBtnOn = action.payload
        },
        setDriverDetails: (state, action) => {
            state.driverDetails = action.payload
        },
        setRideStatusReducer: (state, action) => {
            state.rideStatus = action.payload
        },
        setRideOtpReducer: (state, action) => {
            state.rideOtp = action.payload
        },
        setnavigationDirection: (state, action) => {
            state.isNavigationIndex = action.payload
        },
        setTipAmount: (state, action) => {
            state.isTipAmount = action.payload
        },
        resetRideOtpReducer: (state) => {
            state.rideOtp = undefined
        },
        resetDataOfNearByDriver: (state) => {
            state.nearByDriverListData = []
        },
        restActiveRideDetailsData: (state) => {
            state.riderActiveRideDetails = undefined
        },
        restApiCounter: (state) => {
            state.isApiCount = 0
        },
        setGoodsType: (state, action) => {
            state.goodsType = action.payload
        },
        setPackageType: (state, action) => {
            state.packageType = action.payload
        },
        setDeliveryDetails: (state, action) => {
            state.deliveryDetails = action.payload
        },
        resetDeliveryDetails: (state, action) => {
            state.deliveryDetails = undefined
        },
        setTipConatinerVisible: (state, action) => {
            state.isTipConianerVisible = action.payload
        },
        setCustomTip: (state, action) => {
            state.customTip = action.payload
        }
    },
    extraReducers(builder) {
        //rideBookingList List
        builder.addCase(rideBookingList.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(rideBookingList.fulfilled, (state, action) => {
            state.isLoading = false
            let tempArray = action.meta.arg.offset == 0 ? action.payload : {
                ...action.payload,
                results: [...current(state.rideBookingData?.results), ...action.payload?.results]
            }
            state.rideBookingData = action.meta.arg.offset == 0 ? action.payload : tempArray
        });
        builder.addCase(rideBookingList.rejected, (state, action) => {
            state.isLoading = false
        });
        //cancelRide
        builder.addCase(cancelRide.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(cancelRide.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(cancelRide.rejected, (state, action) => {
            state.isLoading = false
        });
        //feedbackApi
        builder.addCase(feedbackApi.pending, (state) => {
            state.isLoading = true
            state.feedbackLoading = true
        });
        builder.addCase(feedbackApi.fulfilled, (state, action) => {
            state.isLoading = false
            state.feedbackLoading = false
        });
        builder.addCase(feedbackApi.rejected, (state, action) => {
            state.isLoading = false
            state.feedbackLoading = false
        });

        builder.addCase(setApiCounter.pending, (state) => {
            state.isLoading = false
        });
        builder.addCase(setApiCounter.fulfilled, (state, action) => {
            state.isLoading = false
            state.isApiCount += 1
        });
        builder.addCase(setApiCounter.rejected, (state) => {
            state.isLoading = false
        });


        //riderActiveRide
        builder.addCase(riderActiveRide.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(riderActiveRide.fulfilled, (state, action) => {
            state.isLoading = false
            let isCreatedRide = action.payload;
            if (isCreatedRide.rideStatus == RIDE_STATUS.CREATED || isCreatedRide.rideStatus == RIDE_STATUS.PAYMENT_HOLD) {
                state.riderCreatedRideData = action.payload
            } else {
                state.riderActiveRideDetails = action.payload
            }
        });
        builder.addCase(riderActiveRide.rejected, (state, action) => {
            state.isLoading = false
        });
        //deleteRideBooking
        builder.addCase(deleteRideBooking.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(deleteRideBooking.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(deleteRideBooking.rejected, (state, action) => {
            state.isLoading = false
        });
        // near by driver details
        builder.addCase(startRideDriverLocation.pending, (state) => {
        });
        builder.addCase(startRideDriverLocation.fulfilled, (state, action) => {
            state.nearByDriverListData = action.payload
        });
        builder.addCase(startRideDriverLocation.rejected, (state, action) => {
        });
        // Make Payment Api
        builder.addCase(makeRidePayment.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(makeRidePayment.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(makeRidePayment.rejected, (state, action) => {
            state.isLoading = false
        });
        //ENABLE SECURE MODE 
        builder.addCase(enableSecureMode.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(enableSecureMode.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(enableSecureMode.rejected, (state, action) => {
            state.isLoading = false
        });
        //LIST OF DISCOUNT COUPANS 
        builder.addCase(getDiscountListApi.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(getDiscountListApi.fulfilled, (state, action) => {
            state.isLoading = false
            state.discountCouponList = action.payload
        });
        builder.addCase(getDiscountListApi.rejected, (state, action) => {
            state.isLoading = false
        });
        //APPLY DISCOUNT COUPANS 
        builder.addCase(applyDiscountCoupons.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(applyDiscountCoupons.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(applyDiscountCoupons.rejected, (state, action) => {
            state.isLoading = false
        });
        //Ride Bill
        builder.addCase(rideBillPdf.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(rideBillPdf.fulfilled, (state, action) => {
            state.isLoading = false
            state.billData = action.payload

        });
        builder.addCase(rideBillPdf.rejected, (state, action) => {
            state.isLoading = false
        });

        //Goods Type Info
        builder.addCase(goodsInfoApi.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(goodsInfoApi.fulfilled, (state, action) => {
            state.isLoading = false
            state.goodsInfo = action.payload
        });
        builder.addCase(goodsInfoApi.rejected, (state, action) => {
            state.isLoading = false
        });

        //phone_validation_api
        builder.addCase(phone_validation_api.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(phone_validation_api.fulfilled, (state, action) => {
            state.isLoading = false
            state.phoneValidate = action.payload
        });
        builder.addCase(phone_validation_api.rejected, (state, action) => {
            state.isLoading = false
        });

    },
});

export const { setCustomTip, setTipConatinerVisible, setTipAmount, setnavigationDirection, resetDeliveryDetails, setDeliveryDetails, setPackageType, setGoodsType, resetRideBookingData, restApiCounter, setTipBtnOn, resetRideDetailsData, setDriverDetails, setRideBookingData, showActiveRideModalReducer, setRideDetailsData, setRideStatusReducer, resetDataOfNearByDriver, restActiveRideDetailsData, setRideOtpReducer, resetRideOtpReducer } = RideSlice.actions;
export default RideSlice.reducer;
