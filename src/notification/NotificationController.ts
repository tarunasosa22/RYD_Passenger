import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { store } from '../redux/Store';
import { getFcmToken } from '../redux/slice/authSlice/AuthSlice';
// import PushNotification from "react-native-push-notification";
// import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { NOTIFICATION_TYPE, PICK_UP_MODE, RIDE_STATUS } from '../utils/Constats';
import { navigationRef } from '../utils/NavigationServices';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

const NotificationController = () => {

    // handle Navigation On User Tap on Any mode notification
    const onNotificationTap = (remoteMessage: any) => {
        console.log("🚀 ~ file: NotificationController.ts:120 ~ onNotificationTap ~ remoteMessage:", remoteMessage)
        const userData = store.getState().AuthSlice.userDetail
        if (userData && remoteMessage) {
            // ** NAVIGATE TO SEARCHING SCREEN WHILE RIDE IS CREATED WITH PICKUP MODE NOW */
            if (remoteMessage?.data?.type === NOTIFICATION_TYPE.RIDE_CREATED) {
                if (remoteMessage?.data?.details?.pickup_mode === PICK_UP_MODE.NOW) {
                    setTimeout(() => {
                        if (navigationRef.current?.getCurrentRoute()?.name !== "SearchingRiderScreen") {
                            navigationRef.current?.reset({
                                index: 0,
                                routes: [
                                    {
                                        name: 'DrawerStack',
                                        params: {
                                            screen: 'SearchingRiderScreen',
                                            params: {
                                                id: remoteMessage?.data?.details?.id
                                            }
                                        }
                                    },
                                ]
                            })
                        }
                    }, 200);
                }
                // ** NAVIGATE TO PREBOOK SCREEN WHEN BOOKED RIDE WITH LATER PAYLOAD */
                else if (remoteMessage?.data?.details?.pickup_mode === PICK_UP_MODE.LATER) {
                    setTimeout(() => {
                        if (navigationRef.current?.getCurrentRoute()?.name !== "PreBookScreen") {
                            navigationRef.current?.reset({
                                index: 0,
                                routes: [
                                    {
                                        name: 'DrawerStack',
                                        params: {
                                            screen: 'PreBookScreen',
                                        }
                                    },
                                ]
                            })
                        }
                    }, 200);
                }
            }
            // ** NAVIGATE TO PREBOOK SCREEN WHEN BOOKED RIDE WITH LATER PAYLOAD */
            else if (remoteMessage?.data?.type === NOTIFICATION_TYPE.RIDE_REQUEST_ACCEPTED) {
                let parseData = JSON.parse(remoteMessage?.data?.details.replace(/'/g, '"'))
                setTimeout(() => {
                    if (navigationRef.current?.getCurrentRoute()?.name !== "YourRidesScreen") {
                        if (parseData?.pickup_mode === PICK_UP_MODE.LATER) {
                            navigationRef.current?.reset({
                                index: 0,
                                routes: [
                                    {
                                        name: 'DrawerStack',
                                        params: {
                                            screen: 'PreBookScreen',
                                            params: {
                                                notificationType: `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING}, ${RIDE_STATUS.DRIVER_ENDED}`
                                            }
                                        }
                                    },
                                ]
                            })
                        }
                        else {
                            navigationRef.current?.reset({
                                index: 0,
                                routes: [
                                    {
                                        name: 'DrawerStack',
                                        params: {
                                            screen: 'YourRidesScreen',
                                            params: {
                                                notificationType: `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING}, ${RIDE_STATUS.DRIVER_ENDED}`
                                            }
                                        }
                                    },
                                ]
                            })
                        }
                    }
                }, 200);
            }
            else if (remoteMessage?.data?.type === NOTIFICATION_TYPE.SCRATCH_CARD) {
                setTimeout(() => {
                    if (navigationRef.current?.getCurrentRoute()?.name !== "ScratchCouponScreen") {
                        navigationRef.current?.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'DrawerStack',
                                    params: {
                                        screen: 'ScratchCouponScreen',
                                        // params: {
                                        //     notificationType: `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING}`
                                        // }
                                    }
                                },
                            ]
                        })
                    }
                }, 200);
            }
            // ** NAVIGATE TO TRACK DRIVER SCREEN WHILE RIDE IS ONGOING */
            else if (remoteMessage?.data?.type === NOTIFICATION_TYPE.RIDE_ONGOING) {
                setTimeout(() => {
                    if (navigationRef.current?.getCurrentRoute()?.name !== "TrackDriverScreen") {
                        navigationRef.current?.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'DrawerStack',
                                    params: {
                                        screen: 'YourRidesScreen',
                                        params: {
                                            notificationType: `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING},${RIDE_STATUS.DRIVER_ENDED}`
                                        }
                                    }
                                },
                            ]
                        })
                    }
                }, 200);
            }
            // ** NAVIGATE TO RATE DRIVER SCREEN WHILE PAYMENT IS COMPLETED*/
            else if (remoteMessage?.data?.type === NOTIFICATION_TYPE.RIDE_CASH_COMPLETED || remoteMessage?.data?.type === NOTIFICATION_TYPE.RIDE_CARD_COMPLETED) {
                setTimeout(() => {
                    if (navigationRef.current?.getCurrentRoute()?.name !== "TrackDriverScreen") {
                        navigationRef.current?.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'DrawerStack',
                                    params: {
                                        screen: 'RateDriverScreen',
                                        params: {
                                            rideId: remoteMessage?.data?.details
                                        }
                                    }
                                },
                            ]
                        })
                    }
                }, 200);
            }
            // ** NAVIGATE TO CANCEL RIDE SCREEN WHILE RIDE IS CANCELLED */
            else if (remoteMessage?.data?.type === NOTIFICATION_TYPE.RIDE_CANCEL) {
                setTimeout(() => {
                    if (navigationRef.current?.getCurrentRoute()?.name !== "CancelTaxiScreen") {
                        navigationRef.current?.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'DrawerStack',
                                    params: {
                                        screen: 'YourRidesScreen',
                                        params: {
                                            notificationType: RIDE_STATUS.CANCELLED
                                        }
                                    }
                                },
                            ]
                        })
                    }
                }, 200);
            }
            // ** NAVIGATE TO CHAT SCREEN WHILE RIDE IS ONGOING */
            // else if (remoteMessage?.data?.type === NOTIFICATION_TYPE.CHAT_MESSAGE) {
            //     setTimeout(() => {
            //         if (navigationRef.current?.getCurrentRoute()?.name !== "TrackDriverScreen") {
            //             navigationRef.current?.reset({
            //                 index: 0,
            //                 routes: [
            //                     {
            //                         name: 'DrawerStack',
            //                         params: {
            //                             screen: 'YourRidesScreen',
            //                             params: {
            //                                 notificationType: `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING}`
            //                             }
            //                         }
            //                     },
            //                 ]
            //             })
            //         }
            //     }, 200);
            // }
            else if (remoteMessage?.data?.type == NOTIFICATION_TYPE.DISCOUNT_COUPON) {
                setTimeout(() => {
                    navigationRef.current?.reset({
                        index: 0,
                        routes: [
                            {
                                name: 'DrawerStack',
                                params: {
                                    screen: 'HomeScreen',
                                }
                            }
                        ]
                    })
                }, 200);
            }
            // ** CHAT NOTIFICATION NAVIGATION */
            else if (remoteMessage?.data?.type === NOTIFICATION_TYPE.CHAT_MESSAGE) {
                let modifiedJsonString = remoteMessage?.data?.details.replace(/'/g, '"');
                modifiedJsonString = modifiedJsonString.replace(`"profilePic": None`, `"profilePic": null`);
                modifiedJsonString = modifiedJsonString.replace(`"upiId": None`, `"upiId": null`);
                modifiedJsonString = modifiedJsonString.replace(`"senderText": None`, `"senderText": null`);
                modifiedJsonString = modifiedJsonString.replace(`"recieverText": None`, `"recieverText": null`);
                modifiedJsonString = modifiedJsonString.replace(`"text": None`, `"text": null`);
                modifiedJsonString = modifiedJsonString.replace(/\bTrue\b/g, "true");    // Replace True with true
                modifiedJsonString = modifiedJsonString.replace(/\bFalse\b/g, "false");
                // Step 2: Parse the JSON string into a JavaScript object
                const chatMessageData = JSON.parse(modifiedJsonString);
                if (navigationRef.current?.getCurrentRoute()?.name !== "ChatScreen") {
                    navigationRef.current?.reset({
                        index: 0, routes: [
                            {
                                name: 'DrawerStack',
                                params: {
                                    screen: 'YourRidesScreen',
                                    params: {
                                        notificationType: `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING},${RIDE_STATUS.DRIVER_ENDED}`
                                    }
                                }
                            },
                            {
                                name: 'ChatScreen',
                                params: {
                                    roomId: chatMessageData.rideBookingId,
                                    userDetails: {
                                        id: chatMessageData?.id,
                                        name: chatMessageData?.sender?.name,
                                        profilePic: chatMessageData?.sender?.profilePic,
                                        phoneNumber: chatMessageData?.sender?.phoneNumber
                                    }
                                }
                            },
                        ]
                    })
                }
            }
            // ** IMAGE NOTIFICATION AND NAVIGATE TO YOUR NOTIFICATION SCREEN */
            else {
                setTimeout(() => {
                    if (navigationRef.current?.getCurrentRoute()?.name !== "Notification") {
                        navigationRef.current?.reset({
                            index: 0, routes: [
                                {
                                    name: 'DrawerStack',
                                    params: {
                                        screen: 'Notification',
                                        params: {
                                            notificationType: undefined
                                        }
                                    }
                                },
                            ]
                        })
                    }
                }, 200);
            }
        }
    }

    // PushNotification.configure({
    //     permissions: {
    //         alert: true,
    //         badge: true,
    //         sound: true,
    //     },
    //     popInitialNotification: true,
    //     requestPermissions: false,
    //     onNotification: (notification) => {
    //         console.log("NOTIFICATION:", notification);
    //         notification.finish(PushNotificationIOS.FetchResult.NoData);
    //         if (notification?.userInteraction) {
    //             if (notification?.foreground) {
    //                 if (Platform.OS == 'ios') {
    //                     onNotificationTap(notification)
    //                 } else {
    //                     onNotificationTap(notification)
    //                 }
    //             }
    //         }
    //     }
    // });

    // useEffect(() => {
    //     messaging().onNotificationOpenedApp((remoteMessage) => {
    //         console.log("onNotificationOpenedApp = ", remoteMessage)
    //         onNotificationTap(remoteMessage)
    //     })
    //     messaging().getInitialNotification().then((remoteMessage) => {
    //         console.log("getInitialNotification = ", remoteMessage)
    //         onNotificationTap(remoteMessage)
    //     })
    //     messaging().onMessage(async (remoteMessage) => {
    //         console.log("onMessage = ", remoteMessage)
    //         // if (Platform.OS == 'ios') {
    //         //     PushNotificationIOS.addNotificationRequest({
    //         //         title: remoteMessage?.notification?.title,
    //         //         body: remoteMessage?.notification?.body,
    //         //         id: remoteMessage?.messageId?.toString() ?? "",
    //         //         userInfo: remoteMessage
    //         //     })
    //         // }
    //         if (Platform.OS === 'android') {
    //             // PushNotification.createChannel(
    //             //     {
    //             //         channelId: 'fcm_fallback_notification_channel', // (required)
    //             //         channelName: 'fcm_fallback_notification_channel', // (required)
    //             //     },
    //             //     () => { },
    //             // );
    //             console.log("Platform.Version---->", Platform.Version)
    //             // if (Platform.Version > 32) {
    //             //     PushNotification.cancelAllLocalNotifications();
    //             //     PushNotification.localNotification({
    //             //         channelId: 'general_notification_channel',
    //             //         message: remoteMessage?.notification?.body ?? '',
    //             //         title: remoteMessage?.notification?.title ?? '',
    //             //         bigPictureUrl: remoteMessage?.notification?.android?.imageUrl ?? undefined,
    //             //         userInfo: remoteMessage?.data
    //             //     });
    //             // }
    //         }
    //     })

    // }, [])

    useEffect(() => {
        requestUserPermission();

        // Set up foreground notification handler
        const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
            switch (type) {
                case EventType.DISMISSED:
                    console.log('User dismissed notification', detail.notification);
                    break;
                case EventType.PRESS:
                    console.log('User pressed notification', detail.notification);
                    // notificationAction(
                    //     detail?.notification?.data as {
                    //         notification_type?: string | undefined;
                    //         id?: string | undefined;
                    //     },
                    // );
                    onNotificationTap(detail)

                    break;
                case EventType.DELIVERED:
                    console.log('Notification delivered', detail.notification);
                    break;
            }
        });

        // Set up Firebase messaging foreground handler
        const unsubscribeMessage = messaging().onMessage(async remoteMessage => {
            if (Platform.OS === 'android') {
                // Display the notification using notifee when app is in foreground
                await notifee.displayNotification({
                    title: remoteMessage.notification?.title,
                    body: remoteMessage.notification?.body,
                    android: {
                        channelId: 'default',
                        pressAction: {
                            id: 'default',
                        },
                    },
                    data: remoteMessage.data,
                });
            }
        });

        const appOpenSubscribe = messaging().onNotificationOpenedApp(
            remoteMessage => {
                // notificationAction(
                //     remoteMessage.data as {
                //         notification_type?: string | undefined;
                //         id?: string | undefined;
                //     },
                // );
                onNotificationTap(remoteMessage)
                console.log(
                    'Notification caused app to open from background state:',
                    remoteMessage.notification,
                );
            },
        );

        return () => {
            unsubscribe();
            unsubscribeMessage();
            appOpenSubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function requestUserPermission() {
        try {
            // Request Android notification permissions
            if (Platform.OS === 'android') {
                const permissionStatus = await PermissionsAndroid.request(
                    'android.permission.POST_NOTIFICATIONS',
                );
                if (permissionStatus !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.warn('Notification permission denied');
                    return false;
                }

                // Create Android notification channels
                await notifee.createChannels([
                    {
                        id: 'default',
                        name: 'Default',
                        lights: true,
                        vibration: true,
                        importance: AndroidImportance.HIGH,
                    },
                    {
                        id: 'orders',
                        name: 'Orders',
                        lights: true,
                        vibration: true,
                        importance: AndroidImportance.HIGH,
                    },
                    {
                        id: 'transactions',
                        name: 'Transactions',
                        lights: true,
                        vibration: true,
                        importance: AndroidImportance.HIGH,
                    },
                ]);
            }

            // Register device for remote messages if not already registered
            if (!messaging().isDeviceRegisteredForRemoteMessages) {
                await messaging().registerDeviceForRemoteMessages();
            }

            // Request messaging permission
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('Push notifications authorized:', authStatus);
                // Get FCM token
                const token = await messaging().getToken();
                if (token) {
                    console.log('FCM Token:', token);
                    return true;
                }
            } else {
                console.warn('User declined push notifications');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    }

    // useEffect(() => {
    //     store.dispatch(getFcmToken())
    // }, []);

    return null
}
export default NotificationController;
