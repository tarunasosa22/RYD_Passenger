import { NavigatorScreenParams, RouteProp } from "@react-navigation/native";
import { DestinationsProps } from "../redux/slice/homeSlice/HomeSlice";
import { DocumentListProps } from "../components/CustomUploadDocumentsTemplate";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";

export type RootStackParamList = {
    AuthStack: NavigatorScreenParams<AuthStackParamList>;
    DrawerStack: NavigatorScreenParams<DrawerStackParamList>
    OnBordingScreen: undefined;
    DestinationLocationScreen: { isDeliveryModule?: boolean };
    // DestinationLocationMapScreen: { location: DestinationsProps[] | [] };
    DestinationLocationMapScreen: { isDeliveryModule?: boolean };
    SavedPlaceScreen: { type: string, locations: DestinationsProps[] | [], isDeliveryModule?: boolean };
    BookingScreen: { isDeliveryModule?: boolean };
    EmergencyContactScreen: { status: string | undefined };
    TrackDriverScreen: { rideId: number };
    CancelTaxiScreen: { id: number };
    RateDriverScreen: { rideId: number, from: any };
    SearchingRiderScreen: { id: number | null | undefined | string, isDeliveryModule?: boolean, from?: string, isAppCloseOrOpen?:boolean };
    SosScreen: { status: string | undefined };
    ChatScreen: {
        roomId: number,
        userDetails: {
            id: number,
            name: string,
            profilePic: string,
            phoneNumber: string,
        }
    };
    SelectPaymentModeScreen: { rideId?: number | null };
    UploadDocumentScreen: { documentDetails: DocumentListProps | undefined, routeName?: string, isNotGoingUnderReview?: boolean };
    DocumentListScreen: { documentType: string, documentTitle: string },
    QrCodeScannerScreen: undefined,
    RideBillScreen: { rideId: number | null } | undefined;
    DeliveryContactScreen: undefined;
    DeliveyReviewScreen: undefined;
    TelrPaymentScreen: { merchantId: number } | undefined;
    EditProfileScreen: undefined;
};

export type AuthStackParamList = {
    SendOtpScreen: undefined,
    OtpVerificationScreen: { phoneNumber: string, country: string, confirmation?: FirebaseAuthTypes.ConfirmationResult };
    UserDetailsScreen: undefined;
    EmergencyContactScreen: undefined;
}

export type DrawerStackParamList = {
    HomeScreen: undefined;
    EditProfile: undefined;
    Notification: undefined;
    YourRidesScreen: { notificationType?: string };
    PreBookScreen: undefined;
    PrivacyPolicy: undefined;
    HelpCenter: undefined;
    EmergencyContact: undefined;
    LogOut: undefined;
    EmergencyContactScreen: undefined;
    DeleteAccountScreen: undefined;
    ReferAndEarnScreen: undefined;
    WithDrawalsScreen: undefined;
    ScratchCouponScreen: undefined;
    DeliveryHomeScreen: undefined
}

export type RootRouteProps<RouteName extends keyof RootStackParamList> = RouteProp<
    RootStackParamList,
    RouteName
>;
