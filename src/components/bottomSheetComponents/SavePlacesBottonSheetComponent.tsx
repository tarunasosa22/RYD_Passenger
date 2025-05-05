import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { TouchableOpacity } from 'react-native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { Image } from 'react-native';
import { Icons } from '../../utils/IconsPaths';
import CustomIconButton from '../CustomIconButton';
import useCustomNavigation from '../../hooks/useCustomNavigation';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAppSelector } from '../../redux/Store';
import { FontSizes } from '../../styles/FontSizes';
import { Fonts } from '../../styles/Fonts';
import CustomTextInput from '../CustomTextInput';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';

interface SavePlacesBottonSheetComponentProps {
    onWherePress: () => void,
    onPress: (coords: RecentLocationsProps) => void,
    data: RecentLocationsProps[],
    onEndReached: () => void,
    title: string
};

interface RecentLocationsProps {
    id: number,
    address: string,
    latitude: number,
    longitude: number,
};

const SavePlacesBottonSheetComponent = (props: SavePlacesBottonSheetComponentProps) => {

    const Styles = useStyles();
    const navigation = useCustomNavigation("DrawerStack");
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { t } = useTranslation();


    const renderItem = ({ item, index }: { item: RecentLocationsProps, index: number }) => {

        return (
            <TouchableOpacity onPress={() => props.onPress(item)} style={Styles.listItemContainerStyle}>
                <Image source={Icons.LOCATION_MARKER_ICON} style={Styles.locationMarkerIconStyle} />
                <Text numberOfLines={1} style={Styles.recentLocationTxtStyle}>{item.address}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <>
            {/* <CustomTextInput
                placeholder={AppStrings.where_to}
                textInputLeftComponent={<CustomIconButton
                    onPress={props.onWherePress}
                    activeOpacity={1}
                    icon={Icons.SEARCH_PRIMARY_ICON}
                    iconStyle={Styles.searchIconStyle}
                />}
                style={Styles.whereToTxtStyle}
                placeholderTextColor={colors.SECONDARY_TEXT}
                textInputContainerStyle={Styles.searchContainer}
                onPressIn={() => console.log("called in")}
                onPressOut={() => {
                    console.log("called")
                }}
                editable={false}
            /> */}
            <TouchableOpacity activeOpacity={1} onPress={props.onWherePress}
                style={Styles.searchContainer}>
                <CustomIconButton
                    disabled={true}
                    icon={Icons.SEARCH_PRIMARY_ICON}
                    iconStyle={Styles.searchIconStyle}
                />
                <Text numberOfLines={1}
                    style={Styles.whereToTxtStyle}>{props.title}</Text>
            </TouchableOpacity>
            <BottomSheetFlatList
                data={props?.data}
                bounces={false}
                ItemSeparatorComponent={() => {
                    return (
                        <View style={Styles.separatorComponentStyle} />
                    )
                }}
                style={Styles.recentLocationListStyle}
                ListEmptyComponent={() => {
                    return (
                        <Text style={Styles.listEmptyTxtStyle}>{t(TranslationKeys.recent_locations_not_found)}</Text>
                    )
                }}
                onEndReachedThreshold={0.02}
                onEndReached={props?.onEndReached}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
            />
        </>
    );
};

export default SavePlacesBottonSheetComponent

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice)

    return StyleSheet.create({
        searchContainer: {
            borderWidth: wp(0.3),
            borderRadius: wp(3),
            borderColor: colors.BOX_BORDER,
            backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
            alignItems: 'center',
            flexDirection: 'row',
            paddingVertical: wp(2),
            paddingHorizontal: wp(3.5)
        },
        searchIconStyle: {
            tintColor: colors.SECONDARY_ICON,
            width: wp(5.5),
            height: wp(5.5),
            marginRight: wp(3),
            resizeMode: 'contain'
        },
        listEmptyTxtStyle: {
            marginVertical: "12%",
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_16,
            color: colors.PRIMARY_TEXT,
            textAlign: 'center',
        },
        whereToTxtStyle: {
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_12,
            color: colors.SECONDARY_TEXT,
            paddingVertical: wp(0),
            paddingTop: wp(1)
        },
        listItemContainerStyle: {
            flex: 1,
            backgroundColor: colors.TRANSPARENT,
            paddingVertical: wp(4),
            paddingHorizontal: wp(1),
            flexDirection: 'row',
            alignItems: 'center'
        },
        locationMarkerIconStyle: {
            width: wp(5.5),
            height: wp(5.5),
            resizeMode: 'contain',
            tintColor: colors.PRIMARY_ICON
        },
        recentLocationTxtStyle: {
            width: wp(80),
            marginHorizontal: wp(2),
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_13,
            color: colors.PRIMARY_TEXT,
            textAlign: 'left'
        },
        separatorComponentStyle: {
            flex: 1,
            backgroundColor: colors.SEPARATOR_LINE,
            height: wp(0.4),
        },
        recentLocationListStyle: {
            marginBottom: wp(5),
            marginTop: wp(2)
        },
    });
};