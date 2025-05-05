import React from 'react';
import {
    Image,
    ImageSourcePropType,
    ImageStyle,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppSelector } from '../redux/Store';
import { Fonts } from '../styles/Fonts';
import { FontSizes } from '../styles/FontSizes';
import { Icons } from '../utils/IconsPaths';
import { useLanguage } from '../context/LanguageContext';

interface CustomHeaderProps {
    headerStyle?: ViewStyle,
    headerRightComponent?: React.ReactNode,
    headerLeftStyle?: ViewStyle,
    headerRightStyle?: ViewStyle,
    icon?: ImageSourcePropType,
    title?: string,
    txtStyle?: TextStyle,
    iconStyle?: ImageStyle,
    customHeaderComponent?: React.ReactNode,
    safeAreacontainer?: ViewStyle
    edges?: any
};

const CustomHeader = (props: CustomHeaderProps & TouchableOpacityProps) => {

    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const { locale } = useLanguage()

    return (
        <SafeAreaView edges={props.edges ?? ["top"]} style={[Styles.container, props.safeAreacontainer]}>
            <View style={[Styles.header, props.headerStyle]}>
                <View style={[Styles.headerLeftComponentStyle, props.headerLeftStyle]}>
                    <TouchableOpacity {...props}>
                        <Image
                            source={props.icon ? props.icon : Icons.LEFT_ARROW_ICON}
                            style={[GlobalStyle.commonIconStyle, props.iconStyle, { transform: [{ rotate: locale ? '180deg' : '0deg' }] }]} />
                    </TouchableOpacity>
                    {props.title ?
                        <Text style={[Styles.headerTxtStyle, props.txtStyle]}>
                            {props.title}
                        </Text>
                        : null
                    }
                </View>
                {props.headerRightComponent ?
                    <View style={[Styles.headerRightComponentStyle, props.headerRightStyle]}>
                        {props.headerRightComponent}
                    </View>
                    : null
                }
            </View>
        </SafeAreaView>
    );
};

export default CustomHeader;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (StyleSheet.create({
        container: {
            backgroundColor: colors.PRIMARY_BACKGROUND,
        },
        header: {
            width: '100%',
            flexDirection: 'row',
            paddingVertical: wp(3),
            paddingHorizontal: wp(5),
            justifyContent: 'space-between',
            backgroundColor: colors.PRIMARY_BACKGROUND,
        },
        headerLeftComponentStyle: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
        },
        headerRightComponentStyle: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
        },
        headerTxtStyle: {
            marginHorizontal: wp(4),
            color: colors.PRIMARY_TEXT,
            fontSize: FontSizes.FONT_SIZE_15,
            fontFamily: Fonts.FONT_POP_MEDIUM,
        },
    })
    );
};
