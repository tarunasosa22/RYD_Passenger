import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ApiConstants } from "../../../config/ApiConstants";
import { axiosClient } from "../../../config/Axios";
import { AppAlert } from "../../../utils/AppAlerts";
import { parseErrorData } from "../../CommonSlice";
import messaging from "@react-native-firebase/messaging";
import { PermissionsAndroid, Platform } from "react-native";
import { DocumentListProps } from "../../../components/CustomUploadDocumentsTemplate";
import { userIdentification } from "../../../utils/Constats";
import { store } from "../../Store";
import { TranslationKeys } from "../../../localization/TranslationKeys";
import { t } from "i18next";

interface tokenDetailTypes {
    authToken: string | undefined,
    userData: UserDataType,
    message: string,
};

interface DocumentProps {
    id: number,
    image: string,
    docType: string
}

export interface UserDataType {
    email: string | undefined
    id: number
    upiStatus: string
    name: string | undefined
    phoneNumber: string | undefined
    userLanguageCode: string | undefined
    chatLanguageCode: string | undefined
    profilePic: string | undefined
    isRideActive: boolean,
    isAppCloseOrRideCancel: boolean,
    createdAt: string,
    user: number,
    riderDocument: {
        aadhaarCard: DocumentProps[],
        passport: DocumentProps[],
        bankAccountImage: DocumentProps[],
        panCardImage: DocumentProps[]
    }
    aadhaarCardNumber: string,
    passportNumber: string,
    upiId: string | null,
    riderPancardNumber: string,
    accountNumber: string,
    bankName: string,
    ifscCode: string,
    nameOfBankOwner: string,
    addressOfBankOwner: string,
    referralCode: string,
    referredBy: string | null,
    gender: string,
    bankStatus: string
};

interface initialStateTypes {
    isLoading: boolean,
    isCodeLoading: boolean,
    isSendOtpError: boolean,
    commonCredentialsData: commonCredentialsDataProps | undefined,
    tokenDetail: tokenDetailTypes | undefined,
    userDetail: UserDataType | undefined,
    userCordinates: UserLocationProps | undefined,
    fcmToken: string | undefined,
    useIdentificationDocument: DocumentListProps[],
    cc: string
    code: string
    toastData: {
        isShowToast: boolean,
        message: any
    }
    isTokenExpire: boolean
};

export interface UserLocationProps {
    latitude: number,
    longitude: number,
};

export interface commonCredentialsDataProps {
    googleRouteApi: string,
    tollguruApiKey: string,
    isTollGuruActive: boolean,
    googleApiKey: string,
    keyId: string,
    keySecret: string,
    telrMobileApi: string,
    telrRemoteApi: string
}

const initialState: initialStateTypes = {
    isLoading: false,
    isCodeLoading: false,
    isSendOtpError: false,
    tokenDetail: undefined,
    commonCredentialsData: undefined,
    userDetail: undefined,
    userCordinates: {
        latitude: 0,
        longitude: 0
    },
    fcmToken: undefined,
    useIdentificationDocument: userIdentification,
    cc: "",
    code: "",
    toastData: {
        isShowToast: false,
        message: ""
    },
    isTokenExpire: false
};

interface codesListApi {
    error: boolean,
    msg: string,
    data: string[]
}

export interface apiErrorTypes {
    data: string | string[],
};

interface paramsTypes {
    rider_id?: number
    formData?: FormData,
    document_updated?: Boolean
};

const AUTH = "AUTH";

export const getFcmToken = createAsyncThunk(AUTH + '/getFcmToken', async (_, { rejectWithValue }) => {
    try {
        await messaging().registerDeviceForRemoteMessages()
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATION)
        }
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
            try {
                const fcm_token = await messaging().getToken()
                return fcm_token;
            } catch (e) {
                console.error('catch error::: ', { e: JSON.stringify(e) });
            }
        } else {
            await messaging().requestPermission();
        }
    } catch (error) {
        console.log("GET TOKEN ERROR ---", { error })
    }
});

export const sendOtp = createAsyncThunk<string, FormData, { rejectValue: apiErrorTypes }>(AUTH + "/sendOtp",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.SENDOTP, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                if (error === "The phone number entered is not valid.") {
                } else {
                    AppAlert(t(TranslationKeys.error), error)
                }
            }
            return rejectWithValue(e?.response)
        }
    });

export const verifyOtp = createAsyncThunk<tokenDetailTypes, FormData, { rejectValue: apiErrorTypes }>(AUTH + "/verifyOtp",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.VERIFYOTP, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const riderDetails = createAsyncThunk<UserDataType, number, { rejectValue: apiErrorTypes }>(AUTH + "/riderDetails",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.RIDERDETAILS + `${params}/`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const updateRiderDetials = createAsyncThunk<UserDataType, paramsTypes, { rejectValue: apiErrorTypes }>(AUTH + "/updateRiderDetials",
    async (params, { rejectWithValue }) => {
        try {
            let response
            if (params.document_updated) {
                response = await axiosClient.patch(ApiConstants.RIDERDETAILS + `${params.rider_id}/?document_updated=${params.document_updated}`, params.formData)
            } else {
                response = await axiosClient.patch(ApiConstants.RIDERDETAILS + `${params.rider_id}/`, params.formData)
            }
            return response.data
        } catch (e: any) {
            console.log("axiosClient--->", e)
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const userLogOut = createAsyncThunk<string, FormData, { rejectValue: apiErrorTypes }>(AUTH + "/userLogOut",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post(ApiConstants.USERLOGOUT, params)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const deleteAccount = createAsyncThunk<{ message: string }, null, { rejectValue: apiErrorTypes }>(AUTH + "/deleteAccount",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.delete(ApiConstants.DELETE_ACCOUNT)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const deleteDocument = createAsyncThunk<null, number, { rejectValue: apiErrorTypes }>(AUTH + "/deleteDocument",
    async (params, { rejectWithValue }) => {
        try {
            const response = await axiosClient.delete(ApiConstants.DELETEDOCUMENT + `${params}/`)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const getCodesListApi = createAsyncThunk<string, null, { rejectValue: apiErrorTypes }>(AUTH + "/getCodesListApi",
    async (_, { rejectWithValue }) => {
        try {
            const countryResponse = await fetch('https://countriesnow.space/api/v0.1/countries/codes');
            const countryData = await countryResponse.json();

            // Step 2: Filter the country based on dial code
            const country = countryData.data.find(c => c.dial_code === '+' + store.getState().AuthSlice.cc);
            console.log('country', country)

            return country?.code
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const commonCredentialsApi = createAsyncThunk<commonCredentialsDataProps, null, { rejectValue: apiErrorTypes }>(AUTH + "/commonCredentialsApi",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get(ApiConstants.COMMON_CREDENTIALS)
            return response.data
        } catch (e: any) {
            if (e.code !== "ERR_NETWORK" && e.response.status !== 401) {
                const error = parseErrorData(e.response)
                AppAlert(t(TranslationKeys.error), error)
            }
            return rejectWithValue(e?.response)
        }
    });

export const AuthSlice = createSlice({
    name: AUTH,
    initialState,
    reducers: {
        setUserName: (state, actions) => {
            state.userDetail = actions.payload
        },
        setUserCordinates: (state, actions) => {
            state.userCordinates = actions.payload
        },
        setCountryCode: (state, action) => {
            state.cc = action.payload
        },
        setToastData: (state, action) => {
            state.toastData = action.payload
        },
        setTokenExpire: (state, action) => {
            state.isTokenExpire = action.payload
        },
        uploadUserDocument: (state, action) => {
            const index = state?.useIdentificationDocument?.findIndex(obj => obj.id === action.payload?.id);
            if (index !== -1) {
                state.useIdentificationDocument[index] = action.payload;
            }
            else {
                state?.useIdentificationDocument?.push(action.payload)
            }
        },
        getDocumentFromServer: (state, action) => {
            state?.useIdentificationDocument?.forEach(document => {
                if (document.type && action.payload[document.type]) {

                    document.images = action.payload ?? undefined;
                }
            });
        },
        updateUserDocument: (state, action) => {
            state.useIdentificationDocument?.find(item => {
                if (item.type == action?.payload?.type) {
                    item.images == action.payload.images
                }
            });
        }
    },
    extraReducers(builder) {
        // sendOtp
        builder.addCase(sendOtp.pending, (state) => {
            state.isLoading = true
            state.isSendOtpError = false
        });
        builder.addCase(sendOtp.fulfilled, (state, action) => {
            state.isLoading = false
            state.isSendOtpError = false
        });
        builder.addCase(sendOtp.rejected, (state, action) => {
            state.isLoading = false
            state.isSendOtpError = true
        });

        // verifyOtp
        builder.addCase(verifyOtp.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(verifyOtp.fulfilled, (state, action) => {
            state.isLoading = false
            state.tokenDetail = action.payload
            // state.userDetail = action.payload.userData
        });
        builder.addCase(verifyOtp.rejected, (state, action) => {
            state.isLoading = false
        });


        builder.addCase(getCodesListApi.pending, (state, action) => {
            state.isCodeLoading = true
        });
        builder.addCase(getCodesListApi.fulfilled, (state, action) => {
            state.isCodeLoading = false
            state.code = action.payload
        });
        builder.addCase(getCodesListApi.rejected, (state, action) => {
            state.isCodeLoading = false
        });

        // riderDetails
        builder.addCase(riderDetails.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(riderDetails.fulfilled, (state, action) => {
            state.isLoading = false
            // state.tokenDetail = action.payload
            state.userDetail = action.payload
        });
        builder.addCase(riderDetails.rejected, (state, action) => {
            state.isLoading = false
        });

        // updateRiderDetials
        builder.addCase(updateRiderDetials.pending, (state) => {
            state.isLoading = true
        });
        builder.addCase(updateRiderDetials.fulfilled, (state, action) => {
            state.isLoading = false
            state.userDetail = action.payload
        });
        builder.addCase(updateRiderDetials.rejected, (state, action) => {
            state.isLoading = false
        });
        // getFcmToken
        builder.addCase(getFcmToken.pending, (state, action) => {
        });
        builder.addCase(getFcmToken.fulfilled, (state, action) => {
            state.fcmToken = action.payload
        });
        builder.addCase(getFcmToken.rejected, (state, action) => {
        });
        // delete user document
        builder.addCase(deleteDocument.pending, (state, action) => {
            state.isLoading = true
        });
        builder.addCase(deleteDocument.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(deleteDocument.rejected, (state, action) => {
            state.isLoading = false
        });
        // deleteAccount
        builder.addCase(deleteAccount.pending, (state, action) => {
            state.isLoading = true
        });
        builder.addCase(deleteAccount.fulfilled, (state, action) => {
            state.isLoading = false
        });
        builder.addCase(deleteAccount.rejected, (state, action) => {
            state.isLoading = false
        });

        //Common credentials api
        builder.addCase(commonCredentialsApi.pending, (state, action) => {
            state.isLoading = true
        });
        builder.addCase(commonCredentialsApi.fulfilled, (state, action) => {
            state.isLoading = false
            state.commonCredentialsData = action.payload
        });
        builder.addCase(commonCredentialsApi.rejected, (state, action) => {
            state.isLoading = false
        });
    },
});

export const { setUserName, setUserCordinates, setCountryCode, setToastData, setTokenExpire, uploadUserDocument, getDocumentFromServer, updateUserDocument } = AuthSlice.actions;
export default AuthSlice.reducer;
