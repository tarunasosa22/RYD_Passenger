import { Modal, Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import React, { memo } from 'react';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAppSelector } from '../redux/Store';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import CustomPrimaryButton from './CustomPrimaryButton';
import { Fonts } from '../styles/Fonts';
import { FontSizes } from '../styles/FontSizes';
import Lottie, { AnimationObject } from 'lottie-react-native';
import { Icons } from '../utils/IconsPaths';

interface CustomModelAlertProps {
    onPressYes?: () => void,
    onPressNo?: () => void,
    isOpen?: boolean
    title?: string
    subTitle?: string
    yesBtnVisible?: boolean
    yesBtnTitle?: string,
    noBtnTitle?: string,
    isIconVisible?: boolean,
    animationIconStyle?: StyleProp<ViewStyle>,
    animationSource?: string | AnimationObject | {
        uri: string;
    },
}

const CustomModelAlert = (props: CustomModelAlertProps) => {
    const styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    return (
        <Modal
            animationType="fade"
            transparent={props.isOpen}
            visible={true}
            onRequestClose={props.yesBtnVisible ? props.onPressNo : props.onPressYes}>
            <View style={styles.container}>
                <View style={styles.model}>
                    {props.isIconVisible && <Lottie source={props.animationSource} resizeMode='cover' autoPlay loop style={[props.animationIconStyle, { width: "50%", }]} />}
                    {props.title && <Text style={styles.title}>{props.title}</Text>}
                    <Text style={styles.subTitle}>{props.subTitle}</Text>
                    <View style={styles.btnContainer}>
                        <CustomPrimaryButton
                            onPress={props.onPressYes}
                            title={props.yesBtnTitle ?? "Ok"}
                            style={[styles.btnStyle, { backgroundColor: colors.PRIMARY }]}
                            txtStyle={{ alignSelf: 'center' }}
                        />
                        {props.yesBtnVisible ?
                            <>
                                <View style={{ marginHorizontal: wp(1) }} />
                                <CustomPrimaryButton
                                    onPress={props.onPressNo}
                                    title={props.noBtnTitle ?? "No"}
                                    style={[styles.btnStyle, { backgroundColor: colors.TRANSPARENT }]}
                                    txtStyle={{ alignSelf: 'center', color: colors.PRIMARY_TEXT }}
                                />
                            </> : null

                        }
                    </View>
                </View>
            </View>
        </Modal>
    )
}

export default memo(CustomModelAlert)

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);
    const GlobalStyle = useGlobalStyles();

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center'
        },
        model: {
            backgroundColor: colors.SECONDARY_BACKGROUND,
            borderRadius: wp(3),
            width: '85%',
            alignItems: 'center',
            paddingVertical: wp(3),
            paddingHorizontal: wp(3)
        },
        title: {
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_MEDIUM,
            fontSize: FontSizes.FONT_SIZE_14,
            marginVertical: wp(3),
            marginTop: wp(2)
        },
        subTitle: {
            color: colors.SECONDARY_TEXT,
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_14,
            textAlign: 'center',
            marginVertical: wp(3)
        },
        btnContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignSelf: 'center'
        },
        btnStyle: {
            paddingVertical: wp(2.5),
            width: '48%',
            borderRadius: wp(3.5),
            backgroundColor: colors.SECONDARY,
            marginVertical: wp(3),
            borderColor: colors.PRIMARY,
            borderWidth: wp(0.3)
        },
        btnTxt: {
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_REGULAR,
            fontSize: FontSizes.FONT_SIZE_15,
            textAlign: 'center'
        }
    })
}