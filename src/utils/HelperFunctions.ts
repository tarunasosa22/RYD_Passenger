import { Alert, Linking, Platform, ToastAndroid } from "react-native";
import { Asset, CameraOptions, ImageLibraryOptions, launchCamera, launchImageLibrary } from "react-native-image-picker";
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geocoder from 'react-native-geocoder';
import { store, USER_LOGOUT } from "../redux/Store";
import jwt_decode from "jwt-decode";
import { createNavigationContainerRef } from "@react-navigation/native";
import { LOCATION_CURRENT_OPTION, LOCATION_WATCH_OPTION } from "./Constats";
import { AppAlert } from "./AppAlerts";
import { HoursSplitRegExp } from "./ScreenUtils";
import { TranslationKeys } from "../localization/TranslationKeys";
const Crypto = require("crypto-js");

const navigationRef = createNavigationContainerRef();

// interface TokenType {
//     token_type: string;
//     exp: number;
//     iat: number;
//     jti: string;
//     user_id: number;
// };

export const handleChooseImageFromGallery = (): Promise<Asset | undefined> => {
    const options: ImageLibraryOptions = {
        mediaType: 'photo',
        includeBase64: false,
    };
    return new Promise(((resolve, reject) => {
        launchImageLibrary(options, (response) => {
            if (response.didCancel) {
                reject('User cancelled image picker');
            } else if (response.errorCode) {
                reject(response.errorCode);
            } else {
                const source: Asset | undefined = response.assets && response.assets[0]
                resolve(source);
            }
        });
    }));
};

export const handleCapturePhotofromCamera = (): Promise<Asset | undefined> => {
    const PhotoOption: CameraOptions = {
        mediaType: 'photo',
        cameraType: 'back',
        includeBase64: true,
        presentationStyle: 'fullScreen',
        saveToPhotos: true
    }
    return new Promise(((resolve, reject) => {
        launchCamera(PhotoOption, (response) => {
            if (response.didCancel) {
                reject('User cancelled Camera picker');
            } else if (response.errorCode) {
                reject(response.errorCode);
            } else {
                const source: Asset | undefined = response.assets && response.assets[0]
                resolve(source);
            }
        });
    }));
};


export const requestCameraPermission = async (t: any) => {
    try {
        const granted = await PermissionsAndroid.requestMultiple([
            'android.permission.CAMERA',
        ])
        if (
            granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
            return true
        } else {
            AppAlert(t(TranslationKeys.camera), t(TranslationKeys.ask_camera_permission),
                async () => {
                    await Linking.openSettings()
                }, () => { })
            return false
        }
    } catch (err) {
        console.warn(err)
    }
}

export const requestLocationPermission = async () => {
    try {
        let granted
        if (Platform.OS == "ios") {
            granted = await Geolocation.requestAuthorization('whenInUse').then((value) => {
                return value
            }).catch((error) => {
                return false
            })

        } else {
            granted = await PermissionsAndroid.request(
                'android.permission.ACCESS_FINE_LOCATION',
            ).then((value) => {
                return value
            });
        }
        if (granted === 'granted') {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        return false;
    }
};

export const getAsyncStorageData = async (key: string) => {
    const data = await AsyncStorage.getItem(key);
    if (data) {
        const parse_data = JSON.parse(data);
        return parse_data;
    } else {
        return null;
    }
};

export const setAsyncStorageData = async (key: string, data: any) => {
    const stringify_data = JSON.stringify(data);
    await AsyncStorage.setItem(key, stringify_data);
};

export const geoCoderAddress = async (coordinate: { lat: number, lng: number }) => {
    let addressDetails = {}
    try {
        return await Geocoder.geocodePosition(coordinate).then((res: any) => {
            addressDetails = {
                address: res[0].formattedAddress,
                area: res[0].subLocality,
                city: res[0].locality,
                state: res[0].adminArea,
                pincode: res[0].postalCode,
                country: res[0].country
            }
            return addressDetails
        }).catch((err: string) => {
            console.log(err)
            return addressDetails
        })
    } catch (error) {
        console.log("🚀 ~ file: HomeScreen.tsx:271 ~ onPress={ ~ error:", error)
        return addressDetails
    }
};


export const getCurrentPosition = async (): Promise<Geolocation.GeoPosition> => {
    return new Promise(async (resolve, reject) => {
        await Geolocation.getCurrentPosition(
            position => {
                resolve(position)
            },
            error => {
                reject(error)
            },
            LOCATION_CURRENT_OPTION,
        );
    })
};

export const watchPositionCoords = async (): Promise<Geolocation.GeoPosition> => {
    return new Promise(async (resolve, reject) => {
        await Geolocation.watchPosition(res => {
            resolve(res)
        }, error => {
            reject(error)
        }, LOCATION_WATCH_OPTION)

    })
};

// IOS permission
export const hasPermissionIOS = async () => {
    const openSetting = () => {
        Linking.openSettings().catch(() => {
            Alert.alert('Unable to open settings');
        });
    };
    const status = await Geolocation.requestAuthorization('whenInUse');

    if (status === 'granted') {
        return true;
    }

    if (status === 'denied') {
        // Alert.alert(
        //     `Location permission denied so please turn on Location Services to allow "Passenger app" to determine your location.`,
        //     '',
        //     [
        //         { text: 'Go to Settings', onPress: openSetting },
        //         { text: "Cancel", onPress: () => { } },
        //     ],
        // );
    }

    if (status === 'disabled') {
        // Alert.alert(
        //     `Turn on Location Services to allow "Passenger app" to determine your location.`,
        //     '',
        //     [
        //         { text: 'Go to Settings', onPress: openSetting },
        //         { text: "Cancel", onPress: () => { } },
        //     ],
        // );
    }

    return false;
};

// location permmission
export const hasLocationPermission = async () => {
    if (Platform.OS === 'ios') {
        const hasPermission = await hasPermissionIOS();
        return hasPermission;
    }

    if (Platform.OS === 'android' && Platform.Version < 23) {
        return true;
    }

    const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (hasPermission) {
        return true;
    }

    const status = await PermissionsAndroid.request(
        'android.permission.ACCESS_FINE_LOCATION',
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
    }

    if (status === PermissionsAndroid.RESULTS.DENIED) {
        return false
        // ToastAndroid.show(
        //     'Location permission denied by user.',
        //     ToastAndroid.LONG,
        // );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return false
        // ToastAndroid.show(
        //     'Location permission revoked by user.',
        //     ToastAndroid.LONG,
        // );
    }

    return false;
};

// const parseJWTTokenExpiry = async (_token: string): Moment => {
//     let decodedToken: TokenType = await jwt_decode(_token)
//     const dssdf = jwt_decode(_token)
//     console.log({ decodedToken })
//     return moment.unix(decodedToken?.exp);
// };


export const contactToDriver = (phoneNumber: string) => {
    let dialContact;
    if (phoneNumber) {
        if (Platform.OS === 'android') {
            dialContact = `tel:${phoneNumber}`
        } else {
            dialContact = `telprompt:${phoneNumber}`
        }
        Linking.openURL(dialContact);
    }
};

export const decode = (t: any) => {
    let points = [];
    for (let step of t) {
        let encoded = step.polyline.points;
        let index = 0, len = encoded?.length;
        let lat = 0, lng = 0;
        while (index < len) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charAt(index++).charCodeAt(0) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);

            let dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++).charCodeAt(0) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            points.push({ latitude: (lat / 1E5), longitude: (lng / 1E5) });
        }
    }
    return points;
}

export const decryptData = (data: string) => {
    try {
        const bytes = Crypto.AES.decrypt(
            data,
            Crypto.enc.Utf8.parse("Xp2s5v8y/B?E(H+M"),
            {
                mode: Crypto.mode.ECB,
            }
        );
        return JSON.parse(bytes.toString(Crypto.enc.Utf8));
    } catch (error) {
        return null;
    }
};

export const setPrice = (t: any, price?: any, noPrice?: boolean, isFixed?: boolean, noCurrency?: boolean) => {
    return noPrice ? t(TranslationKeys.rupee_symbol).toUpperCase() : noCurrency ? `${price === null ? "0.00" : price ? isFixed ? Number(price).toFixed(0) : Number(price).toFixed(2) : 0}` : `${t(TranslationKeys.rupee_symbol).toUpperCase()} ${price === null ? "0.00" : price ? isFixed ? Number(price).toFixed(0) : Number(price).toFixed(2) : 0}`
}

export const minuteToHoursTransform = (minutes: number, t: any) => {
    let hours;
    if (minutes > 60) {
        hours = (minutes / 60).toFixed(2) + t(TranslationKeys.hour);
    } else {
        hours = minutes?.toFixed(2) + t(TranslationKeys.minute);
    }
    const [totalTime, timeInMinOrHr] = hours.split(HoursSplitRegExp)
    hours = {
        totalTime: totalTime,
        timeInMinOrHr: timeInMinOrHr
    }
    return hours;
}


const haversineDistance = (point1: any, point2: any): number => {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const R = 6371e3; // Earth radius in meters
    const lat1 = toRadians(point1.latitude);
    const lat2 = toRadians(point2.latitude);
    const dLat = lat2 - lat1;
    const dLon = toRadians(point2.longitude - point1.longitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};

export const findNearestIndex = (currentPosition: any, routeCoordinates: any) => {
    let nearestIndex = 0;
    let minDistance = Infinity;

    routeCoordinates.forEach((routePoint: any, index: number) => {
        const distance = haversineDistance(currentPosition, routePoint);
        if (distance < minDistance) {
            minDistance = distance;
            nearestIndex = index;
        }
    });
    const prevPoint = routeCoordinates[nearestIndex - 1] || routeCoordinates[nearestIndex];
    const nextPoint = routeCoordinates[nearestIndex + 1] || routeCoordinates[nearestIndex];

    return { prevPoint, nextPoint };
};

export const isUserOutOfRoute = (
    currentPosition: any,
    routeCoordinates: any[],
    threshold: number = 10 // Threshold in meters
): boolean => {
    let minDistance = Infinity;

    // Find the nearest point on the route
    routeCoordinates.forEach(routePoint => {
        const distance = haversineDistance(currentPosition, routePoint);
        if (distance < minDistance) {
            minDistance = distance;
        }
    });

    // Compare the minimum distance with the threshold
    return minDistance > threshold;
};