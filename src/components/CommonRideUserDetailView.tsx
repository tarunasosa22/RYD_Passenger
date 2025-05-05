import React, { useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppSelector } from '../redux/Store';
import { ImagesPaths } from '../utils/ImagesPaths';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { ImageStyle } from 'react-native';
import { Fonts } from '../styles/Fonts';
import { FontSizes } from '../styles/FontSizes';
import { DriverCarDetails, DriverDetails } from '../redux/slice/rideSlice/RideSlice';
import FastImage from 'react-native-fast-image';
import { TranslationKeys } from '../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';

export interface locationProps {
    id: string,
    location: string
};

export interface deliveryDetailsProps {
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
}

interface CommonRideUserDetailViewProps {
    userImageStyle?: ImageStyle,
    userData: {
        driver: DriverDetails | null,
        driverCar: DriverCarDetails | null,
        priceModel: { carType: string },
        rideCancelBy?: { id: number, reason: string, cancelBy: string, createdAt: string } | null,
        deliveryDetails?: deliveryDetailsProps
    },
    isPreBook?: boolean
};


const CommonRideUserDetailView = (props: CommonRideUserDetailViewProps) => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();
    const [imageError, setImageError] = useState<boolean>(false);
    const { t } = useTranslation();

    const cancelby = (props.userData?.rideCancelBy?.cancelBy == "Driver" || props.userData?.rideCancelBy?.cancelBy == "DRIVER") ? t(TranslationKeys.driver) : t(TranslationKeys.rider)

    return (
        <View style={GlobalStyle.rowContainer}>
            <FastImage
                onError={() => {
                    setImageError(true)
                }}
                source={(props.userData.driver?.profilePic && !imageError) ? { uri: props.userData?.driver?.profilePic } : ImagesPaths.EMPTY_IMAGE} style={[Styles.userImageStyle]} />
            <View style={Styles.detailsContainerStyle}>
                <Text numberOfLines={1} style={Styles.userNameTxtStyle} adjustsFontSizeToFit>{props.isPreBook ? t(TranslationKeys.driver_not_allocated_yet) : props.userData.driver?.name ?? t(TranslationKeys.driver_not_found)}</Text>
                <Text numberOfLines={1} style={Styles.carDetailsTxtStyle}>{props.userData?.priceModel?.carType} </Text>
                {/* <Text numberOfLines={1} style={Styles.crnTxtStyle}>{props.userData.driverCar?.registrationNumber}</Text> */}
            </View>
            {(props?.userData?.rideCancelBy && !props?.userData?.deliveryDetails) ?
                <View style={Styles.cancelContainerStyle}>
                    <Text numberOfLines={1} style={Styles.cancelTxtStyle}>{cancelby ?? null}</Text>
                </View>
                : null}

            {(props?.userData?.deliveryDetails) ? (
                <View style={{ alignItems: 'flex-end' }}>
                    {props?.userData?.rideCancelBy ?
                        <View style={[Styles.cancelContainerStyle, { alignSelf: 'flex-end' }]}>
                            <Text numberOfLines={1} style={Styles.cancelTxtStyle}>{cancelby ?? null}</Text>
                        </View> :
                        <View style={Styles.cancelContainerStyle}>
                            <Text style={Styles.commonTxtStyle}>{t(TranslationKeys.delivery_ride)}</Text>
                        </View>}
                    <Text style={Styles.requestTxtStyle}>{props?.userData?.deliveryDetails?.goodsType}</Text>
                    <Text style={Styles.requestTxtStyle}>{props?.userData?.deliveryDetails?.goodsWeight}{t(TranslationKeys.kg)} {props?.userData?.deliveryDetails?.goodsPackage}</Text>
                </View>
            ) : null}
        </View>
    );
};

export default CommonRideUserDetailView;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        userImageStyle: {
            width: wp(16.5),
            height: wp(16.5),
            resizeMode: 'cover',
            borderRadius: wp(15)
        },
        userNameTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_16,
            color: colors.PRIMARY_TEXT,
            textAlign: 'left'
        },
        carDetailsTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_14,
            color: colors.SECONDARY_TEXT,
            textAlign: 'left'
        },
        crnTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_10,
            color: colors.SECONDARY_TEXT
        },
        cancelContainerStyle: {
            padding: wp(1),
            paddingHorizontal: wp(2.5),
            marginLeft: wp(2),
            alignSelf: 'flex-start',
            backgroundColor: colors.LIGHT_PRIMARY_BACKGROUND,
            borderRadius: wp(2)
        },
        cancelTxtStyle: {
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_14,
            maxWidth: wp(24),
            textTransform: 'capitalize'
        },
        detailsContainerStyle: {
            flex: 1,
            marginLeft: wp(2)
        },
        requestTxtStyle: {
            color: colors.SECONDARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_13,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            maxWidth: wp(45),
        },
        commonSubTxtStyle: {
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_14,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            maxWidth: wp(26),
            textAlign: 'left'
        },
        subTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_14,
            color: colors.SECONDARY_TEXT,
            maxWidth: wp(73),
            textAlign: 'left'
        },
        commonTxtStyle: {
            fontFamily: Fonts.FONT_POP_REGULAR,
            color: colors.PRIMARY_TEXT,
            textAlign: 'left'
        },
    });
};
