import { useEffect } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { store } from '../redux/Store';
import { getFcmToken } from '../redux/slice/authSlice/AuthSlice';
// import PushNotification from "react-native-push-notification";
// import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { NOTIFICATION_TYPE, PICK_UP_MODE, RIDE_STATUS } from '../utils/Constats';
import { navigationRef } from '../utils/NavigationServices';
import notifee, { AndroidImportance } from '@notifee/react-native';

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
                setTimeout(() => {
                    if (navigationRef.current?.getCurrentRoute()?.name !== "YourRidesScreen") {
                        navigationRef.current?.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'DrawerStack',
                                    params: {
                                        screen: 'YourRidesScreen',
                                        params: {
                                            notificationType: `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING}`
                                        }
                                    }
                                },
                            ]
                        })
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
                                            notificationType: `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING}`
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
                                        notificationType: `${RIDE_STATUS.DRIVER_ALLOCATED},${RIDE_STATUS.ONGOING}`
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

    useEffect(() => {
        // Create notification channel for Android
        async function createChannel() {
            if (Platform.OS === 'android') {
                await notifee.createChannel({
                    id: 'default',
                    name: 'Default Channel',
                    importance: AndroidImportance.HIGH,
                });
            }
        }
        createChannel();

        messaging().onNotificationOpenedApp((remoteMessage) => {
            console.log("onNotificationOpenedApp = ", remoteMessage)
            onNotificationTap(remoteMessage)
        })

        messaging().getInitialNotification().then((remoteMessage) => {
            console.log("getInitialNotification = ", remoteMessage)
            onNotificationTap(remoteMessage)
        })

        messaging().onMessage(async (remoteMessage) => {
            console.log("onMessage = ", remoteMessage)

            // Display notification using Notifee
            await notifee.displayNotification({
                title: remoteMessage?.notification?.title,
                body: remoteMessage?.notification?.body,
                android: {
                    channelId: 'default',
                    importance: AndroidImportance.HIGH,
                    // Set large icon if available
                    largeIcon: remoteMessage?.notification?.android?.imageUrl,
                    // Preserve the notification data for handling tap events
                    pressAction: {
                        id: 'default',
                    },
                    data: remoteMessage?.data,
                },
                ios: {
                    // Customize iOS notification if needed
                    categoryId: 'default',
                    data: remoteMessage?.data,
                },
            });
        });

        // Handle notification press events
        return notifee.onForegroundEvent(({ type, detail }) => {
            if (type === 1) { // TYPE.PRESS
                onNotificationTap({ data: detail.notification?.android?.data || detail.notification?.ios?.data });
            }
        });
    }, []);

    useEffect(() => {
        store.dispatch(getFcmToken())
    }, []);

    return null
}
export default NotificationController;
