import { DestinationsProps, stepersProps } from "../redux/slice/homeSlice/HomeSlice";
import Geolocation from 'react-native-geolocation-service';
import { ReasonsTypes } from "../screens/utils/CancelTaxiScreen";
import { AppStrings } from "./AppStrings";
import { TipContainerProps } from "../screens/utils/RateDriverScreen";
import { DocumentListProps } from "../components/CustomUploadDocumentsTemplate";
import { TranslationKeys } from "../localization/TranslationKeys";
import { UserDocumentTypes } from "../types/DataTypes";
import { Dimensions } from "react-native";
import { RFValue as RF } from 'react-native-responsive-fontsize';
import { ImagesPaths } from "./ImagesPaths";


export const DestinationData: DestinationsProps[] = [
    {
        id: '1',
        address: 'Mota Varachha, Surat, 394101, Gujarat, India',
        latitude: 21.240347,
        longitude: 72.886982
    },
    {
        id: '2',
        address: 'Mota Varachha, Surat, 394101, Gujarat, India',
        latitude: 21.240347,
        longitude: 72.886982
    },
    {
        id: '3',
        address: 'Mota Varachha, Surat, 394101, Gujarat, India',
        latitude: 21.240347,
        longitude: 72.886982
    },
    {
        id: '4',
        address: 'Mota Varachha, Surat, 394101, Gujarat, India',
        latitude: 21.240347, longitude: 72.886982
    },
];

export const StepersData: stepersProps[] = [
    {
        id: 1,
        title: (TranslationKeys.location),
        image: ImagesPaths.STEP1_LOCATION_ICON
    },
    {
        id: 2,
        title: (TranslationKeys.details),
        image: ImagesPaths.STEP2_DETAILS_ICON
    },
    {
        id: 3,
        title: (TranslationKeys.package),
        image: ImagesPaths.STEP3_PACKAGE_ICON
    },
    {
        id: 4,
        title: (TranslationKeys.vehicle),
        image: ImagesPaths.STEP4_VEHICLE_ICON
    },
    {
        id: 5,
        title: (TranslationKeys.review),
        image: ImagesPaths.STEP5_REVIEW_ICON
    },
];

export const Reasons: ReasonsTypes[] = [
    {
        id: 1,
        title: TranslationKeys.plan_changed,
        reason: AppStrings.cancellations_reason.plan_changed,
    },
    {
        id: 2,
        title: TranslationKeys.booked_another_cab,
        reason: AppStrings.cancellations_reason.booked_another_cab
    },
    {
        id: 3,
        title: TranslationKeys.driver_is_not_picking_phone,
        reason: AppStrings.cancellations_reason.driver_is_not_picking_phone
    },
    {
        id: 4,
        title: TranslationKeys.taking_too_long_time_to_find_cab,
        reason: AppStrings.cancellations_reason.taking_too_long_time_to_find_cab
    },
    {
        id: 5,
        title: TranslationKeys.waiting_time_is_too_long,
        reason: AppStrings.cancellations_reason.waiting_time_is_too_long
    },
    {
        id: 6,
        title: TranslationKeys.my_reason_is_not_listed,
        reason: AppStrings.cancellations_reason.my_reason_is_not_listed
    }
];

export const PreBookReasons: ReasonsTypes[] = [
    {
        id: 1,
        title: TranslationKeys.not_confident_about_ride,
        reason: AppStrings.pre_cancellations_reason.not_confident_about_ride,
    },
    {
        id: 2,
        title: TranslationKeys.no_need_ride,
        reason: AppStrings.pre_cancellations_reason.no_need_ride
    },
    {
        id: 3,
        title: TranslationKeys.different_ride,
        reason: AppStrings.pre_cancellations_reason.different_ride
    },
    {
        id: 4,
        title: TranslationKeys.no_diver_assigned,
        reason: AppStrings.pre_cancellations_reason.no_diver_assigned
    },
    {
        id: 5,
        title: TranslationKeys.my_reason_is_not_listed,
        reason: AppStrings.cancellations_reason.my_reason_is_not_listed
    }
];

export const disputedReasons: ReasonsTypes[] = [
    {
        id: 1,
        title: TranslationKeys.driver_took_longer_route,
        reason: AppStrings.disputed_reason.driver_took_longer_route,
    },
    {
        id: 2,
        title: TranslationKeys.driver_was_rude,
        reason: AppStrings.disputed_reason.driver_was_rude
    },
    {
        id: 3,
        title: TranslationKeys.driver_ask_extra_payment,
        reason: AppStrings.disputed_reason.driver_ask_extra_payment
    },
    {
        id: 4,
        title: TranslationKeys.driver_made_stop,
        reason: AppStrings.disputed_reason.driver_made_stop
    },
    {
        id: 5,
        title: TranslationKeys.driver_under_alcohol,
        reason: AppStrings.disputed_reason.driver_under_alcohol
    },
    {
        id: 6,
        title: TranslationKeys.driver_brought_people,
        reason: AppStrings.disputed_reason.driver_brought_people
    },
    {
        id: 7,
        title: TranslationKeys.please_specify_other,
        reason: AppStrings.disputed_reason.please_specify_other
    }
];

export const HomeBottomSheetType = {
    logOut: {
        snapPoint: ["27%"],
        type: 'logOut'
    },
    deleteAccount: {
        snapPoint: ["30%"],
        type: 'deleteAccount'
    },
    userName: {
        snapPoint: ["1%"],
        type: 'userName'
    },
    savedPlaces: {
        snapPoint: ["32%", "32%"],
        type: 'savedPlaces'
    },
    default: {
        snapPoint: ["1%"],
        type: ''
    },
};

export const RFValue = (value: number) => {
    const height = Dimensions.get('window').height;
    if (height > 900) {
        return RF(value * 0.8);
    } else {
        return RF(value);
    }
};

export const SOCKET_STATUS = {
    CLOSED: 3,
    CLOSING: 2,
    CONNECTING: 0,
    OPEN: 1,
};

export const NOTIFICATION_TYPE = {
    RIDE_CREATED: "RIDE_CREATED",
    RIDE_REQUEST_ACCEPTED: "RIDE_REQUEST_ACCEPTED",
    RIDE_ONGOING: "RIDE_ONGOING",
    RIDE_CASH_COMPLETED: "RIDE_CASH_COMPLETED",
    RIDE_CARD_COMPLETED: "RIDE_CARD_COMPLETED",
    RIDE_CANCEL: "RIDE_CANCEL",
    CHAT_MESSAGE: "CHAT_MESSAGE",
    DISCOUNT_COUPON: "DISCOUNT_COUPON",
    CUSTOM_NOTIFICATION: "CUSTOM_NOTIFICATION",
    SCRATCH_CARD: "SCRATCH_CARD"
};

export const RIDE_STATUS = {
    DRIVER_ALLOCATED: "DRIVER_ALLOCATED",
    ONGOING: "ONGOING",
    STARTRIDE: "STARTRIDE",
    CANCELLED: "CANCELLED",
    ENDRIDE: "ENDRIDE",
    COMPLETED: "COMPLETED",
    CREATED: "CREATED",
    PAYMENT_HOLD:"PAYMENT_HOLD",
    DRIVER_ENDED:"DRIVER_ENDED"
};

export const PAYMENT_METHOD = {
    CARD: "CARD",
    CASH: "CASH",
    UPI: 'UPI'
};

export const RIDE_TYPE = {
    YOURRIDES: "YOURRIDES",
    PREBOOKED: "PREBOOKED"
};

export const PAYMENT_STATUS = {
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
    INCOMPLETE: "INCOMPLETE",
    CREATED: "CREATED",
};

export const PICK_UP_MODE = {
    NOW: 'NOW',
    LATER: 'LATER'
};

export const LOCATION_CURRENT_OPTION: Geolocation.GeoOptions | undefined = {
    accuracy: {
        android: 'high',
        ios: 'best',
    },
    enableHighAccuracy: true,
    timeout: 15000,
    // maximumAge: 10000,
    distanceFilter: 0,
};

export const DOCUMENT_STATUS = {
    APPROVED: "APPROVED",
    REAPPLIED: "REAPPLIED",
    DECLINE: "DECLINE",
    UNDER_REVIEW: "UNDER_REVIEW",
};

export const LOCATION_WATCH_OPTION: Geolocation.GeoWatchOptions | undefined = {
    accuracy: {
        android: 'high',
        ios: 'best',
    },
    enableHighAccuracy: true,
    distanceFilter: 0,
    interval: 25000,
    // fastestInterval: 2000,
};

export const DriverTipData: TipContainerProps[] = [
    {
        id: 5,
        tip: TranslationKeys.rs5
    },
    {
        id: 10,
        tip: TranslationKeys.rs10
    },
    {
        id: 20,
        tip: TranslationKeys.rs20
    },
    {
        id: 50,
        tip: TranslationKeys.rs50
    },
];

export const UserDocobj: UserDocumentTypes = {
    profilePicture: "Profile Picture",
    bankAccountImage: "Bank Account Details",
    aadharCard: "Aadhaar Card",
    panCard: "Pan Card",
    passport: "Passport"
};

export const userIdentification: DocumentListProps[] = [
    {
        id: 1,
        documentType: UserDocobj.bankAccountImage,
        documentTitle: TranslationKeys.bank_account_details,
        description: [
            {
                id: 1,
                title: TranslationKeys.upload_bank_document_code_img,
            },
            {
                id: 2,
                title: TranslationKeys.upload_pdf_jpeg_png,
            }
        ],
        attachDocumentTitle: TranslationKeys.attach_bank_account_detail,
        rounteName: "UploadDocumentScreen",
        documentListtype: "bankAccountImage",
        limit: 1,
        images: [],
        type: "bankAccountImage"
    },
    {
        id: 2,
        documentType: UserDocobj.aadharCard,
        documentTitle: TranslationKeys.government_id,
        description: [
            {
                id: 1,
                title: TranslationKeys.Image_must_be_clear_and_visible,
            },
            {
                id: 2,
                title: TranslationKeys.upload_pdf_jpeg_png,
            }
        ],
        attachDocumentTitle: TranslationKeys.attach_aadhaar_card_images,
        rounteName: "UploadDocumentScreen",
        documentListtype: "aadhaarCard",
        limit: 2,
        images: [],
        type: "aadhaarCard"
    },
    {
        id: 3,
        documentType: UserDocobj.passport,
        documentTitle: TranslationKeys.passport,
        description: [
            {
                id: 1,
                title: TranslationKeys.Image_must_be_clear_and_visible,
            },
            {
                id: 2,
                title: TranslationKeys.upload_pdf_jpeg_png,
            }
        ],
        attachDocumentTitle: TranslationKeys.attach_passport_images,
        rounteName: "UploadDocumentScreen",
        documentListtype: "passport",
        limit: 2,
        images: [],
        type: "passport"
    },

]

export const verificationStatus = {
    NOT_SUBMITTED: "NOT_SUBMITTED",
    ACCOUNT_IS_VALID: "ACCOUNT_IS_VALID",
    INVALID_BANK_ACCOUNT: "INVALID_BANK_ACCOUNT",
    INVALID_IFSC: "INVALID_IFSC",
    ACCOUNT_BLOCKED: "ACCOUNT_BLOCKED",
    NRE_ACCOUNT: "NRE_ACCOUNT",
    FAILED_AT_BANK: "FAILED_AT_BANK"
};

export const upiVericiationStatus = {
    NOT_SUBMITTED: "NOT_SUBMITTED",
    VALID: "VALID",
    INVALID: "INVALID",
    EXPIRED: "EXPIRED",
    NPCI_NAME_INCORRECT: "NPCI_NAME_INCORRECT"
}

export const transferStatusState = {
    TRANSFER_INITIATED: "TRANSFER_INITIATED",
    TRANSFER_SUCCESS: "TRANSFER_SUCCESS",
    TRANSFER_FAILED: "TRANSFER_FAILED",
    TRANSFER_REVERSED: "TRANSFER_REVERSED",
    TRANSFER_ACKNOWLEDGED: "TRANSFER_ACKNOWLEDGED",
    TRANSFER_REJECTED: "TRANSFER_REJECTED",
    SUCCESS: "SUCCESS",
    PENDING: "PENDING",
    ERROR: "ERROR",
};

export const languageList = [
    { id: 1, language: 'Afrikaans', value: 'af' },
    { id: 2, language: 'Albanian', value: 'sq' },
    { id: 3, language: 'Amharic', value: 'am' },
    { id: 4, language: 'Arabic', value: 'ar' },
    { id: 5, language: 'Armenian', value: 'hy' },
    { id: 6, language: 'Assamese', value: 'as' },
    { id: 7, language: 'Aymara', value: 'ay' },
    { id: 8, language: 'Azerbaijani', value: 'az' },
    { id: 9, language: 'Bambara', value: 'bm' },
    { id: 10, language: 'Basque', value: 'eu' },
    { id: 11, language: 'Belarusian', value: 'be' },
    { id: 12, language: 'Bengali', value: 'bn' },
    { id: 13, language: 'Bhojpuri', value: 'bho' },
    { id: 14, language: 'Bosnian', value: 'bs' },
    { id: 15, language: 'Bulgarian', value: 'bg' },
    { id: 16, language: 'Catalan', value: 'ca' },
    { id: 17, language: 'Cebuano', value: 'ceb' },
    { id: 18, language: 'Chichewa', value: 'ny' },
    { id: 19, language: 'Chinese (Simplified)', value: 'zh-CN' },
    { id: 20, language: 'Chinese (Traditional)', value: 'zh-TW' },
    { id: 21, language: 'Corsican', value: 'co' },
    { id: 22, language: 'Croatian', value: 'hr' },
    { id: 23, language: 'Czech', value: 'cs' },
    { id: 24, language: 'Danish', value: 'da' },
    { id: 25, language: 'Dhivehi', value: 'dv' },
    { id: 26, language: 'Dogri', value: 'doi' },
    { id: 27, language: 'Dutch', value: 'nl' },
    { id: 28, language: 'English', value: 'en' },
    { id: 29, language: 'Esperanto', value: 'eo' },
    { id: 30, language: 'Estonian', value: 'et' },
    { id: 31, language: 'Ewe', value: 'ee' },
    { id: 32, language: 'Filipino', value: 'tl' },
    { id: 33, language: 'Finnish', value: 'fi' },
    { id: 34, language: 'French', value: 'fr' },
    { id: 35, language: 'Frisian', value: 'fy' },
    { id: 36, language: 'Galician', value: 'gl' },
    { id: 37, language: 'Georgian', value: 'ka' },
    { id: 38, language: 'German', value: 'de' },
    { id: 39, language: 'Greek', value: 'el' },
    { id: 40, language: 'Guarani', value: 'gn' },
    { id: 41, language: 'Gujarati', value: 'gu' },
    { id: 42, language: 'Haitian Creole', value: 'ht' },
    { id: 43, language: 'Hausa', value: 'ha' },
    { id: 44, language: 'Hawaiian', value: 'haw' },
    { id: 45, language: 'Hebrew', value: 'iw' },
    { id: 46, language: 'Hindi', value: 'hi' },
    { id: 47, language: 'Hmong', value: 'hmn' },
    { id: 48, language: 'Hungarian', value: 'hu' },
    { id: 49, language: 'Icelandic', value: 'is' },
    { id: 50, language: 'Igbo', value: 'ig' },
    { id: 51, language: 'Ilocano', value: 'ilo' },
    { id: 52, language: 'Indonesian', value: 'id' },
    { id: 53, language: 'Irish', value: 'ga' },
    { id: 54, language: 'Italian', value: 'it' },
    { id: 55, language: 'Japanese', value: 'ja' },
    { id: 56, language: 'Javanese', value: 'jw' },
    { id: 57, language: 'Kannada', value: 'kn' },
    { id: 58, language: 'Kazakh', value: 'kk' },
    { id: 59, language: 'Khmer', value: 'km' },
    { id: 60, language: 'Kinyarwanda', value: 'rw' },
    { id: 61, language: 'Konkani', value: 'gom' },
    { id: 62, language: 'Korean', value: 'ko' },
    { id: 63, language: 'Krio', value: 'kri' },
    { id: 64, language: 'Kurdish (Kurmanji)', value: 'ku' },
    { id: 65, language: 'Kurdish (Sorani)', value: 'ckb' },
    { id: 66, language: 'Kyrgyz', value: 'ky' },
    { id: 67, language: 'Lao', value: 'lo' },
    { id: 68, language: 'Latin', value: 'la' },
    { id: 69, language: 'Latvian', value: 'lv' },
    { id: 70, language: 'Lingala', value: 'ln' },
    { id: 71, language: 'Lithuanian', value: 'lt' },
    { id: 72, language: 'Luganda', value: 'lg' },
    { id: 73, language: 'Luxembourgish', value: 'lb' },
    { id: 74, language: 'Macedonian', value: 'mk' },
    { id: 75, language: 'Maithili', value: 'mai' },
    { id: 76, language: 'Malagasy', value: 'mg' },
    { id: 77, language: 'Malay', value: 'ms' },
    { id: 78, language: 'Malayalam', value: 'ml' },
    { id: 79, language: 'Maltese', value: 'mt' },
    { id: 80, language: 'Maori', value: 'mi' },
    { id: 81, language: 'Marathi', value: 'mr' },
    { id: 82, language: 'Meiteilon (Manipuri)', value: 'mni-Mtei' },
    { id: 83, language: 'Mizo', value: 'lus' },
    { id: 84, language: 'Mongolian', value: 'mn' },
    { id: 85, language: 'Myanmar', value: 'my' },
    { id: 86, language: 'Nepali', value: 'ne' },
    { id: 87, language: 'Norwegian', value: 'no' },
    { id: 88, language: 'Odia (Oriya)', value: 'or' },
    { id: 89, language: 'Oromo', value: 'om' },
    { id: 90, language: 'Pashto', value: 'ps' },
    { id: 91, language: 'Persian', value: 'fa' },
    { id: 92, language: 'Polish', value: 'pl' },
    { id: 93, language: 'Portuguese', value: 'pt' },
    { id: 94, language: 'Punjabi', value: 'pa' },
    { id: 95, language: 'Quechua', value: 'qu' },
    { id: 96, language: 'Romanian', value: 'ro' },
    { id: 97, language: 'Russian', value: 'ru' },
    { id: 98, language: 'Samoan', value: 'sm' },
    { id: 99, language: 'Sanskrit', value: 'sa' },
    { id: 100, language: 'Scots Gaelic', value: 'gd' },
    { id: 101, language: 'Sepedi', value: 'nso' },
    { id: 102, language: 'Serbian', value: 'sr' },
    { id: 103, language: 'Sesotho', value: 'st' },
    { id: 104, language: 'Shona', value: 'sn' },
    { id: 105, language: 'Sindhi', value: 'sd' },
    { id: 106, language: 'Sinhala', value: 'si' },
    { id: 107, language: 'Slovak', value: 'sk' },
    { id: 108, language: 'Slovenian', value: 'sl' },
    { id: 109, language: 'Somali', value: 'so' },
    { id: 110, language: 'Spanish', value: 'es' },
    { id: 111, language: 'Sundanese', value: 'su' },
    { id: 112, language: 'Swahili', value: 'sw' },
    { id: 113, language: 'Swedish', value: 'sv' },
    { id: 114, language: 'Tajik', value: 'tg' },
    { id: 115, language: 'Tamil', value: 'ta' },
    { id: 116, language: 'Tatar', value: 'tt' },
    { id: 117, language: 'Telugu', value: 'te' },
    { id: 118, language: 'Thai', value: 'th' },
    { id: 119, language: 'Tigrinya', value: 'ti' },
    { id: 120, language: 'Tsonga', value: 'ts' },
    { id: 121, language: 'Turkish', value: 'tr' },
    { id: 122, language: 'Turkmen', value: 'tk' },
    { id: 123, language: 'Twi', value: 'ak' },
    { id: 124, language: 'Ukrainian', value: 'uk' },
    { id: 125, language: 'Urdu', value: 'ur' },
    { id: 126, language: 'Uyghur', value: 'ug' },
    { id: 127, language: 'Uzbek', value: 'uz' },
    { id: 128, language: 'Vietnamese', value: 'vi' },
    { id: 129, language: 'Welsh', value: 'cy' },
    { id: 130, language: 'Xhosa', value: 'xh' },
    { id: 131, language: 'Yiddish', value: 'yi' },
    { id: 132, language: 'Yoruba', value: 'yo' },
    { id: 133, language: 'Zulu', value: 'zu' },
];