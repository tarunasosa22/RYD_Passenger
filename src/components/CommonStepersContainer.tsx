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
import { StepersData } from '../utils/Constats';
import { ImagesPaths } from '../utils/ImagesPaths';
import { useTranslation } from 'react-i18next';

interface CustomHeaderProps {
    headerStyle?: ViewStyle,
    safeAreacontainer?: ViewStyle
    step: number
};

const CommonStepersContainer = (props: CustomHeaderProps & TouchableOpacityProps) => {
    const Styles = useStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const step = props.step
    const {t} = useTranslation()

    return (
        <SafeAreaView edges={["top"]} style={[Styles.container, props.safeAreacontainer]}>
            <View style={[Styles.header, props.headerStyle]}>
                {StepersData.map((item, index) => {
                    return (
                        <View style={{ width: '20%', alignItems: 'center', }}>
                            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                                {index != 0 && <View style={{ backgroundColor: index < step ? colors.PRIMARY : colors.DOTTED_BORDER, height: wp(1), width: index == StepersData.length - 1 ? '70%' : '35%' }} />}
                                <View style={{ backgroundColor: index < step ? colors.PRIMARY : 'transparent', borderColor: index < step ? colors.PRIMARY : colors.BOX_BORDER, paddingHorizontal: wp(0.5), borderWidth: 2, borderRadius: wp(5), paddingVertical: wp(2) }}>
                                    <Image source={index < step ? ImagesPaths.STEPS_CHECK_ICON : item.image} style={{ width: wp(4.5), height: wp(4.5), tintColor: index < step ? colors.WHITE_ICON : colors.SECONDARY_DOTTED_BORDER }} />
                                </View>
                                {index !== StepersData.length - 1 && <View style={{ backgroundColor: index < step ? colors.PRIMARY : colors.DOTTED_BORDER, height: wp(1), width: index == 0 ? '70%' : '35%' }} />}
                            </View>
                            <Text style={{
                                fontSize: FontSizes.FONT_SIZE_10,
                                fontFamily: Fonts.FONT_POP_MEDIUM,
                                color: index < step ? colors.PRIMARY : colors.SECONDARY_TEXT,
                                alignSelf: index == StepersData.length - 1 ? 'flex-end' : index == 0 ? 'flex-start' : 'center'

                            }}>{t(item.title)}</Text>
                        </View>
                    )
                })}
            </View>
        </SafeAreaView>
    )
}

export default CommonStepersContainer

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (StyleSheet.create({
        container: {
            backgroundColor: colors.SECONDARY_BACKGROUND
        },
        header: {
            width: '100%',
            flexDirection: 'row',
            paddingVertical: wp(3),
            paddingHorizontal: wp(3),
            justifyContent: 'space-between',
            backgroundColor: colors.PRIMARY_BACKGROUND,
        },

    })
    );
};