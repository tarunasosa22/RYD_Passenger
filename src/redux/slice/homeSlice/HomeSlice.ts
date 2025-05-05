import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import { axiosClient } from "../../../config/Axios";
import { parseErrorData } from "../../CommonSlice";
import { AppAlert } from "../../../utils/AppAlerts";
import { ApiConstants } from "../../../config/ApiConstants";
import { ContactsProps } from "../../../components/CustomRadioButton";
import { DriverCarDetails, DriverDetails, RideLocationTypes, UserDetails } from "../rideSlice/RideSlice";
import { TranslationKeys } from "../../../localization/TranslationKeys";
import { t } from "i18next";
import moment from "moment";

export interface DestinationsProps {
    id?: string | undefined,
    address?: string | undefined,
    latitude: number,
    longitude: number,
    state?: string | undefined
};

export interface stepersProps {
    id: number,
    title: string,
    image: string,

}
interface RideCancelByType {
    id: number,
    reason: string,
    cancelBy: string,
    createdAt: string,
};

export interface RiderAppStateProps {
    id: number,
    isAppCloseOrRideCancel: boolean
}

export interface ChangeLocationProps {
    openPickUpLocation: boolean,
    resetDestinationDate: boolean,
    location: DestinationsProps | undefined
};

export interface RideDetailsTypes {
    payment_method: string;
    totalFare: any;
    id: number | null,
    rider: UserDetails | null,
    driver: DriverDetails | null,
    bookedFor: {
        phone: string,
        name: string,
        bookedFor: string
    },
    isRideInIndia: boolean,
    ridePayment: {
        paymentMethod: string,
        totalFare: number | null,
        customerId?: string,
        paymentStatus?: string,
        emperialKey?: string,
        paymentIntent?: string,
        paymentClientSecret?: string,
        baseFare?: number,
        platformFee?: string,
        ridePercentage?: string,
        stateTax?: string,
        tipAmount?: string | null,
        igst?: number | null | string,
        cgst?: number | null | string,
        sgst?: number | null | string,
        platformFeeGst?: number | null | string,
        tollAmount?: string,
        discount?: string,
        transactionId?: any
    },
    priceModel: {
        carType: string
    },
    driverCar: DriverCarDetails | null,
    rideLocation: {
        pickup: RideLocationTypes | null,
        destination: RideLocationTypes | null,
        stop: RideLocationTypes[] | []
    },
    bookedBy: string,
    estimatedTime: number | null,
    preBookedTime: string | null,
    createdAt: string,
    pickupMode: string,
    rideStatus: string,
    distance: number | null,
    rideCancelBy?: RideCancelByType | null,
    riderUnreadCount?: number,
    driverUnreadCount?: number,
    feedbackStatus: {
        riderGivenFeedback: boolean
    },
    carType: string,
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
        goodsWeight: number
    }
};

interface initialStateTypes {
    isLoading: boolean,
    isLoadingRecent: boolean,
    rateLoading: boolean,
    isRefundText: boolean,
    globalLang: string,
    createRideData: RideDetailsTypes | null,
    createDeliveryRideData: RideDetailsTypes | null,
    paymentMethod: string,
    location: LocationTypes[] | undefined,
    originLocation: LocationTypes | undefined,
    destinations: DestinationsProps[] | [],
    bookingDestinations: DestinationsProps[] | [],
    rideQuotationList: QuotationTypes,
    phoneContactList: ContactsProps[] | [],
    rideDetailsData: RideDetailsTypes | null,
    savePlaceListData: SavePlaceListProps,
    routeTrackList: [],
    recentPlaceListData: SavePlaceListProps | [],
    appliedCoupon: any,
    changePickUpLocation: ChangeLocationProps
    lastActiveTime: any
    lastActiveStep: number
    rideQuotationError: boolean,
    isComplateTimer: boolean,
};

export interface SavePlaceProps {
    address: string,
    id: number,
    latitude: number,
    longitude: number,
};

interface SavePlaceListProps {
    count: number,
    next?: string | null,
    previous?: string | null,
    results: SavePlaceProps[]
};

export interface latLongTypes {
    latitude: number,
    longitude: number
};

interface QuotationTypes {
    data: {
        distance: number | null,
        duration: number | null,
        pickupState: string,
        cgst: number | null
        sgst: number | null
        toll: number | null
        destinationState: string
        points: string
        address: {
            pickup: string,
            destination: string,
            stops: []
        }
    },
    result: QuotationListTypes[] | []
};

export interface QuotationListTypes {
    id: number,
    fare: number,
    carTypeImage: string,
    carType: string,
    toll: number,
    baseFare: number,
    cgst: number,
    sgst: number,
    igst: number,
    platformFee: number,
    ridePercentage: number
    isRideInIndia: boolean
};
export interface LocationTypes {
    id?: number | string
    address?: string,
    latitude?: number | string,
    longitude?: number | string,
    state?: string
};

const initialState: initialStateTypes = {
    rideQuotationError: false,
    isLoading: false,
    isLoadingRecent: false,
    rateLoading: false,
    isRefundText: false,
    globalLang: 'en',
    lastActiveTime: '',
    isComplateTimer:false,
    lastActiveStep: 0,
    paymentMethod: "Card",
    appliedCoupon: -1,
    location: undefined,
    originLocation: {
        id: undefined,
        address: undefined,
        latitude: undefined,
        longitude: undefined,
    },
    changePickUpLocation: {
        openPickUpLocation: false,
        resetDestinationDate: true,
        location: undefined
    },
    destinations: [],
    bookingDestinations: [],
    rideQuotationList: {
        data: {
            distance: null,
            duration: null
        },
        result: []
    },
    phoneContactList: [],
    savePlaceListData: {
        count: 0,
        next: null,
        previous: null,
        results: []
    },
    recentPlaceListData: {
        count: 0,
        next: null,
        previous: null,
        results: []
    },
    rideDetailsData: {
        id: null,
        rider: null,
        driver: null,
        bookedFor: {
            phone: '',
            name: '',
            bookedFor: ''
        },
        ridePayment: {
            paymentMethod: '',
            totalFare: null,
            customerId: '',
            paymentStatus: '',
            emperialKey: '',
            paymentIntent: '',
            paymentClientSecret: ''
        },
        priceModel: {
            carType: ''
        },
        driverCar: null,
        bookedBy: '',
        estimatedTime: null,
        preBookedTime: null,
        createdAt: '',
        pickupMode: '',
        rideStatus: '',
        distance: null,
        rideCancelBy: null,
        rideLocation: {
            pickup: null,
            destination: null,
            stop: []
        },
        feedbackStatus: {
            riderGivenFeedback: false
        },
        deliveryDetails: {}
    }
};
interface FindRideTypes {
    message: string
};
export interface apiErrorTypes {
    data: string | string[],
};
interface paramsTypes {
    originLocation?: latLongTypes,
    destinationLocation?: latLongTypes,
    stopes?: latLongTypes[],
    offset?: number,
    discount_code?: string,
    is_coupon_apply?: boolean,
    is_secured?: boolean
    is_time_and_distance_exists?: boolean
    distance?: number | null
    duration?: number | null
    pickup?: string
    destination?: string
    pickupState?: string,
    cgst: number | null
    sgst: number | null
    destinationState?: string
    toll?: number | null,
    points?: string,
    is_delivery_enable?: boolean
};

const HOME = "HOME";

export const getRideQuotationList = createAsyncThunk<QuotationTypes, FormData, { rejectValue: apiErrorTypes }>(HOME + "/rideQuotationList",
    async (params, { rejectWithValue }) => {
        try {

            // if (params.stopes && params.discount_code) {
            //     console.log('RES--->', 'if')
            //     response = await axiosClient.get(ApiConstants.QUOTATIONAPI + `?pickup_locations=${JSON.stringify(params.originLocation)}&destination_locations=${JSON.stringify(params.destinationLocation)}&stops=${JSON.stringify(params.stopes)}&is_coupon_apply=${params.is_coupon_apply}&discount_code=${params.discount_code}&is_secured=${params.is_secured}&is_time_and_distance_exists=${params.is_time_and_distance_exists}&distance=${JSON.stringify(params.distance)}&duration=${params.duration}&pickup=${params.pickup}&destination=${params.destination}&pickupState=${JSON.stringify(params.pickupState)}&servicePercentage=${params.servicePercentage}&destinationState=${JSON.stringify(params.destinationState)}&toll=${params.toll}`)
            // }
            // else if (params.discount_code) {
            //     console.log('RES--->', 'else-if')
            //     response = await axiosClient.get(ApiConstants.QUOTATIONAPI + `?pickup_locations=${JSON.stringify(params.originLocation)}&destination_locations=${JSON.stringify(params.destinationLocation)}&is_coupon_apply=${JSON.stringify(params.is_coupon_apply)}&discount_code=${params.discount_code}&is_secured=${params.is_secured}&is_time_and_distance_exists=${params.is_time_and_distance_exists}&distance=${JSON.stringify(params.distance)}&duration=${params.duration}&pickup=${params.pickup}&destination=${params.destination}&pickupState=${JSON.stringify(params.pickupState)}&servicePercentage=${params.servicePercentage}&destinationState=${JSON.stringify(params.destinationState)}&toll=${params.toll}`)
            // }
            // else if (params.stopes) {
            //     console.log('RES--->', 'else-else-if', params)
            //     if (!params.is_secured) {
            //         if (params.is_time_and_distance_exists) {
            //             response = await axiosClient.get(ApiConstants.QUOTATIONAPI + `?pickup_locations=${JSON.stringify(params.originLocation)}&destination_locations=${JSON.stringify(params.destinationLocation)}&stops=${params.stopes}&is_time_and_distance_exists=${params.is_time_and_distance_exists}&distance=${JSON.stringify(params.distance)}&duration=${params.duration}&pickup=${params.pickup}&destination=${params.destination}&pickupState=${JSON.stringify(params.pickupState)}&servicePercentage=${params.servicePercentage}&destinationState=${JSON.stringify(params.destinationState)}&toll=${params.toll}`)
            //         } else {
            //             response = await axiosClient.get(ApiConstants.QUOTATIONAPI + `?pickup_locations=${JSON.stringify(params.originLocation)}&destination_locations=${JSON.stringify(params.destinationLocation)}&stops=${JSON.stringify(params.stopes)}`)
            //         }
            //     } else {
            //         if (params.is_time_and_distance_exists) {
            //             response = await axiosClient.get(ApiConstants.QUOTATIONAPI + `?pickup_locations=${JSON.stringify(params.originLocation)}&destination_locations=${JSON.stringify(params.destinationLocation)}&is_secured=${params.is_secured}&stops=${params.stopes}&is_time_and_distance_exists=${params.is_time_and_distance_exists}&distance=${JSON.stringify(params.distance)}&duration=${params.duration}&pickup=${params.pickup}&destination=${params.destination}&pickupState=${JSON.stringify(params.pickupState)}&servicePercentage=${params.servicePercentage}&destinationState=${JSON.stringify(params.destinationState)}&toll=${params.toll}`)
            //         } else {
            //             response = await axiosClient.get(ApiConstants.QUOTATIONAPI + `?pickup_locations=${JSON.stringify(params.originLocation)}&destination_locations=${JSON.stringify(params.destinationLocation)}&is_secured=${params.is_secured}&stops=${JSON.stringify(params.stopes)}`)
            //         }
            //     }
            // }
            // else {
            //     if (!params.is_secured) {
            //         if (params.is_time_and_distance_exists) {
            //             response = await axiosClient.get(ApiConstants.QUOTATIONAPI + `?pickup_locations=${JSON.stringify(params.originLocation)}&destination_locations=${JSON.stringify(params.destinationLocation)}&is_time_and_distance_exists=${params.is_time_and_distance_exists}&distance=${JSON.stringify(params.distance)}&duration=${params.duration}&pickup=${params.pickup}&destination=${params.destination}&pickupState=${JSON.stringify(params.pickupState)}&servicePercentage=${params.servicePercentage}&destinationState=${JSON.stringify(params.destinationState)}&toll=${params.toll}`)
            //         } else {
            //             response = await axiosClient.get(ApiConstants.QUOTATIONAPI + `?pickup_locations=${JSON.stringify(params.originLocation)}&destination_locations=${JSON.stringify(params.destinationLocation)}`)
            //         }
            //     } else {
            //         if (params.is_time_and_distance_exists) {
            //             response = await axiosClient.get(ApiConstants.QUOTATIONAPI + `?pickup_locations=${JSON.stringify(params.originLocation)}&destination_locations=${JSON.stringify(params.destinationLocation)}&is_secured=${params.is_secured}&is_time_and_distance_exists=${params.is_time_and_distance_exists}&distance=${JSON.stringify(params.distance)}&duration=${params.duration}&pickup=${params.pickup}&destination=${params.destination}&pickupState=${JSON.stringify(params.pickupState)}&servicePercentage=${params.servicePercentage}&destinationState=${JSON.stringify(params.destinationState)}&toll=${params.toll}`)
            //         } else {
            //             response = await axiosClient.get(ApiConstants.QUOTATIONAPI + `?pickup_locations=${JSON.stringify(params.originLocation)}&destination_locations=${JSON.stringify(params.destinationLocation)}&is_secured=${params.is_secured}`)

            //         }
            //     }
            // }
            const response = await axiosClient.post(ApiConstants.QUOTATIONAPI, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const createRide = createAsyncThunk<RideDetailsTypes, FormData, { rejectValue: apiErrorTypes }>(HOME + "/createRide",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.CREATERIDE, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const createDeliveryRide = createAsyncThunk<RideDetailsTypes, FormData, { rejectValue: apiErrorTypes }>(HOME + "/createDeliveryRide",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.CREATE_DELIVERY_RIDE, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const rideDetails = createAsyncThunk<RideDetailsTypes, number, { rejectValue: apiErrorTypes }>(HOME + "/rideDetails",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.RIDEDETAILS + `${params}/`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const findDriver = createAsyncThunk<FindRideTypes, number, { rejectValue: apiErrorTypes }>(HOME + "/findDriver",
    async (params, { rejectWithValue, signal }) => {
        try {
            const response = await axiosClient.get(ApiConstants.FINDDRIVER + `${params}/`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                if (e.code !== "ERR_CANCELED") {
                    const error = parseErrorData(e.response)
                    if (e?.response?.status !== 404 && error === "Not found.") {
                        AppAlert(t(TranslationKeys.error), error)
                    }
                }
            }
            return rejectWithValue(e?.response)
        }
    });

    export const riderAppState = createAsyncThunk<RiderAppStateProps, FormData, { rejectValue: apiErrorTypes }>(HOME + "/riderAppState",
    async (params, { rejectWithValue, signal }) => {
        try {
            const response = await axiosClient.patch(ApiConstants.RIDER_APP_STATE , params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                if (e.code !== "ERR_CANCELED") {
                    const error = parseErrorData(e.response)
                    if (e?.response?.status !== 404 && error === "Not found.") {
                        AppAlert(t(TranslationKeys.error), error)
                    }
                }
            }
            return rejectWithValue(e?.response)
        }
    });

export const addSavePlace = createAsyncThunk<SavePlaceProps, FormData, { rejectValue: apiErrorTypes }>(HOME + "/addSavePlace",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.ADDSAVEPLACE, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const savePlacesList = createAsyncThunk<SavePlaceListProps, paramsTypes, { rejectValue: apiErrorTypes }>(HOME + "/savePlacesList",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.ADDSAVEPLACE + `?limit=10&offset=${params.offset}`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const removeSavePlace = createAsyncThunk<null, number, { rejectValue: apiErrorTypes }>(HOME + "/removeSavePlace",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.delete(ApiConstants.REMOVESAVEPLACE + `${params}/`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const recentPlaceList = createAsyncThunk<SavePlaceListProps, paramsTypes, { rejectValue: apiErrorTypes }>(HOME + "/recentPlaceList",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.RECENTPLACESLIST + `?limit=10&offset=${params.offset}&is_delivery_enabled=${params.is_delivery_enable}`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const recentPlaceListHome = createAsyncThunk<SavePlaceListProps, paramsTypes, { rejectValue: apiErrorTypes }>(HOME + "/recentPlaceHomeList",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.RECENTPLACESLIST + `?limit=10&offset=${params.offset}&is_delivery_enabled=${params.is_delivery_enable}`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const HomeSlice = createSlice({
    name: HOME,
    initialState,
    reducers: {
        pickUpLocationReducer: (state, action) => {
            const location = [...current(state.destinations)]
            location[0] = action.payload
            state.destinations = location
        },
        onChangePickUpLocation: (state, action) => {
            state.changePickUpLocation = action.payload
        },
        resetDestinations: (state) => {
            state.destinations = []
        },
        setPaymentMethod: (state, action) => {
            state.paymentMethod = action.payload
        },
        setDestinations: (state, action) => {
            let location = []
            if (state?.destinations.length !== 0) {
                location = [...state.destinations, action.payload]
            } else {
                location.push(action.payload)
            }
            state.destinations = location
        },
        setFilteredDestinations: (state, action) => {
            state.destinations = action.payload
        },
        setBookingDestinations: (state, action) => {
            state.bookingDestinations = action.payload
        },
        setLastActiveTime: (state, action) => {
            state.lastActiveTime = action.payload
        },
        setIsComplateTimer: (state, action) => {
            state.isComplateTimer = action.payload
        },
        setIsRefundText: (state, action) => {
            state.isRefundText = action.payload
        },
        setLastActibeStep: (state, action) => {
            state.lastActiveStep = action.payload
        },
        resetRideQuotationList: (state) => {
            state.rideQuotationList = {
                data: {
                    distance: null,
                    duration: null
                },
                result: []
            }
        },
        resetRideDetails: (state) => {
            state.rideDetailsData = null
        },
        filterSavePlacesReducer: (state, action) => {
            state.savePlaceListData = action.payload
        },
        setRoutesTrackList: (state, action) => {
            state.routeTrackList = action.payload
        },
        resetSavedLocation: (state) => {
            state.savePlaceListData = {
                count: 0,
                next: null,
                previous: null,
                results: []
            }
        },
        resetLastActiveTime: (state) => {
            state.lastActiveTime = ""
        },
        resetRoutesTrackList: (state, action) => {
            state.routeTrackList = []
        },
        setGlobalLang: (state, action) => {
            state.globalLang = action.payload
        },
        resetRecentList: (state, action) => {
            state.recentPlaceListData = []
        },
        setAppliedCoupon: (state, action) => {
            state.appliedCoupon = action.payload
        },
        setCreateRideData: (state, action) => {
            state.createRideData = action.payload
        },
        setCreateDeliveryRideData: (state, action) => {
            state.createDeliveryRideData = action.payload
        }
    },
    extraReducers(builder) {
        // createRide
        builder.addCase(createRide.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(createRide.fulfilled, (state, action) => {
            state.isLoading = false
            state.createRideData = action.payload
            state.createDeliveryRideData = null
        });
        builder.addCase(createRide.rejected, (state, action) => {
            state.isLoading = false
        });
        // rideDetails
        builder.addCase(rideDetails.pending, (state) => {
            state.isLoading = true
            state.rateLoading = true
        });
        builder.addCase(rideDetails.fulfilled, (state, action) => {
            state.isLoading = false
            state.rateLoading = false
            state.rideDetailsData = action.payload
        });
        builder.addCase(rideDetails.rejected, (state, action) => {
            state.isLoading = false
            state.rateLoading = false
        });
        // getRideQuotationList 
        builder.addCase(getRideQuotationList.pending, (state) => {
            state.isLoading = true
            state.rideQuotationError = false
        });
        builder.addCase(getRideQuotationList.fulfilled, (state, action) => {
            state.isLoading = false
            state.rideQuotationList = action.payload
        });
        builder.addCase(getRideQuotationList.rejected, (state, action) => {
            state.isLoading = false
            state.rideQuotationError = true
        });
        // find Driver 
        builder.addCase(findDriver.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(findDriver.fulfilled, (state, action) => {
            state.isLoading = false
            state.lastActiveTime = moment().toString()
        });
        builder.addCase(findDriver.rejected, (state, action) => {
            state.isLoading = false
        });
        //Add save place
        builder.addCase(addSavePlace.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(addSavePlace.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(addSavePlace.rejected, (state, action) => {
            state.isLoading = false
        });
        //save places list
        builder.addCase(savePlacesList.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(savePlacesList.fulfilled, (state, action) => {
            state.isLoading = false
            let tempArray = action.meta.arg.offset == 0 ? action.payload : {
                ...action.payload,
                results: [...current(state.savePlaceListData?.results), ...action.payload?.results]
            }
            state.savePlaceListData = action.meta.arg.offset == 0 ? action.payload : tempArray
        });
        builder.addCase(savePlacesList.rejected, (state, action) => {
            state.isLoading = false
        });
        //remove Save Place 
        builder.addCase(removeSavePlace.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(removeSavePlace.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(removeSavePlace.rejected, (state, action) => {
            state.isLoading = false
        });
        //Recent Place List 
        builder.addCase(recentPlaceList.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(recentPlaceList.fulfilled, (state, action) => {
            state.isLoading = false
            let tempArray = action.meta.arg.offset == 0 ? action.payload : {
                ...action.payload,
                results: [...current(state.recentPlaceListData?.results), ...action.payload?.results]
            }
            state.recentPlaceListData = action.meta.arg.offset == 0 ? action.payload : tempArray
        });
        builder.addCase(recentPlaceList.rejected, (state, action) => {
            state.isLoading = false
        });


        builder.addCase(recentPlaceListHome.pending, (state) => {
            state.isLoadingRecent = true
        });
        builder.addCase(recentPlaceListHome.fulfilled, (state, action) => {
            state.isLoadingRecent = false
            let tempArray = action.meta.arg.offset == 0 ? action.payload : {
                ...action.payload,
                results: [...current(state.recentPlaceListData?.results), ...action.payload?.results]
            }
            state.recentPlaceListData = action.meta.arg.offset == 0 ? action.payload : tempArray
        });
        builder.addCase(recentPlaceListHome.rejected, (state, action) => {
            state.isLoadingRecent = false
        });

        builder.addCase(createDeliveryRide.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(createDeliveryRide.fulfilled, (state, action) => {
            state.isLoading = false
            state.createRideData = null
            state.createDeliveryRideData = action.payload
        });
        builder.addCase(createDeliveryRide.rejected, (state, action) => {
            state.isLoading = false
        });

        //Rider App state
        builder.addCase(riderAppState.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(riderAppState.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(riderAppState.rejected, (state, action) => {
            state.isLoading = false
        });
    },
});

export const {setIsRefundText, resetRecentList,setIsComplateTimer, setCreateRideData,setCreateDeliveryRideData,setAppliedCoupon, setPaymentMethod, setDestinations, setRoutesTrackList, setGlobalLang, resetLastActiveTime, resetRoutesTrackList, setLastActiveTime, setLastActibeStep, setFilteredDestinations, resetDestinations, setBookingDestinations, resetRideQuotationList, resetRideDetails, pickUpLocationReducer, onChangePickUpLocation, filterSavePlacesReducer, resetSavedLocation } = HomeSlice.actions;
export default HomeSlice.reducer;
