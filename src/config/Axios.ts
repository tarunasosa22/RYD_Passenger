import axios, { AxiosRequestHeaders } from 'axios';
import { store } from '../redux/Store';
import { ApiConstants } from './ApiConstants';
import { APP_URL } from './Host';
import { DeviceEventEmitter } from 'react-native';
import { setTokenExpire } from '../redux/slice/authSlice/AuthSlice';
import { navigationRef } from '../utils/NavigationServices';
import i18n from '../localization/i18n';

export const axiosClient = axios.create({
	baseURL: APP_URL,
});

const blacklistUrls = [
	ApiConstants.SENDOTP,
	ApiConstants.VERIFYOTP,
];

const abortUrls = [
	ApiConstants.FINDDRIVER,
];

const whiteListUrl = [
	ApiConstants.APPLY_DISCOUNT_COUPON,
	ApiConstants.SCRTACH_CARD_LIST_EDIT
]

axiosClient.interceptors.request.use(async (config) => {
	try {
		const token = store.getState().AuthSlice.tokenDetail?.authToken;
		const controller = new AbortController();
		config.signal = controller.signal;
		const langCode = store.getState().HomeSlice.globalLang

		DeviceEventEmitter.addListener('findDriverAbort', () => {
			const fullUrl = config.url;
			if (abortUrls.some(base => fullUrl?.startsWith(base))) {
				controller.abort()
			}
		})
		DeviceEventEmitter.addListener('sessionExpired', () => {
			// if (abortUrls.includes(config.url || '')) {
			controller.abort()
			// }
		})

		if (token && !blacklistUrls.includes(config.url || '')) {
			config.headers = {
				...config.headers,
				Accept: "application/json",
				Authorization: `Token ${token}`,
				"Accept-Language": i18n.language
			} as AxiosRequestHeaders
		}

		if (whiteListUrl.includes(config.url || "") && ["post", "patch", "put"].includes(config.method || "")) {
			config.headers = {
				...config.headers,
				"Content-Type": "application/json",
				Accept: "application/json",
				"Accept-Language": i18n.language
			} as AxiosRequestHeaders;
		} else {
			config.headers = {
				...config.headers,
				"Content-Type": "multipart/form-data",
				Accept: "application/json",
				"Accept-Language": i18n.language
			} as AxiosRequestHeaders;
		}

	} catch (e) {
		console.error({ e });
	}
	console.log('AAA config', config)
	return config;
});

axiosClient.interceptors.response.use(
	response => successHandler(response),
	error => errorHandler(error)
)

const errorHandler = (error: any) => {
	console.log('ERROR11-->', error, error && error.response && error.response.status === 401)
	if (error && error.response && error.response.status === 401 && !store.getState().AuthSlice.isTokenExpire) {
		if (navigationRef?.current?.getState().routes[0].name !== "AuthStack") {
			store.dispatch(setTokenExpire(true))
		}
		DeviceEventEmitter.emit("sessionExpired")

		return Promise.reject({ ...error });
	}
	return Promise.reject(error);
};

const successHandler = (response: any) => {
	return response;
};
