import React, { useEffect, useState } from 'react';
import { Camera, CodeScanner, useCameraDevice, useCameraPermission, } from 'react-native-vision-camera';
import { ActivityIndicator, Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Lottie from 'lottie-react-native';
import { Icons } from '../../utils/IconsPaths';
import { useAppSelector } from '../../redux/Store';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { AppAlert } from '../../utils/AppAlerts';
import { useGlobalStyles } from '../../hooks/useGlobalStyles';


interface QRScannerProps {
    codeScanner: CodeScanner
}

const QrCodeScannerScreen = (props: QRScannerProps) => {

    const device = useCameraDevice('back')
    const [loading, setLoading] = useState<boolean>(true)
    const [torchOn, setTorchOn] = useState<boolean>(false);
    const Styles = useStyles();
    const { colors } = useAppSelector(state => state.CommonSlice)
    const { hasPermission, requestPermission } = useCameraPermission()

    useEffect(() => {
        getPer()
    }, [])

    const getPer = async () => {
        try {
            if (!hasPermission) {
                requestPermission().then(res => {
                    if (!res) {
                        setLoading(true)
                        AppAlert('Camera Permission Requiered', "Please allow camera permission from setting", () => { Linking.openSettings() })
                    } else {
                        setLoading(false)
                    }
                })
            }
            // await Camera.getAvailableCameraDevices()
            // const newCameraPermission = await Camera.requestCameraPermission()
            // const cameraPermission = await Camera.getCameraPermissionStatus()
            // if (cameraPermission !== 'authorized') {
            //     if (newCameraPermission == 'authorized') {
            //         setLoading(false)
            //     }
            // } else {
            //     setLoading(false)
            // }
        } catch (error) {
            console.log("🚀 ~ file: App.tsx:63 ~ getPer ~ error:", error)

        }
    }

    if (loading || device == null) {
        return <ActivityIndicator color={'red'} />
    }
    return (
        <View style={Styles.container}>
            <View
                style={Styles.qrCodeScanningView}>
                <Lottie source={require('../../assets/lottie/animation_lk85lbu1.json')} resizeMode='cover' autoPlay loop style={{
                    flex: 1,
                }} />
            </View>
            <TouchableOpacity style={Styles.torchBtnView} activeOpacity={1} onPress={() => {
                setTorchOn(!torchOn)
            }}>
                <Image source={torchOn ? Icons.FLASH_LIGHT_ON : Icons.FLASH_LIGHT_OFF}
                    style={Styles.torchIconStyle}
                />
            </TouchableOpacity>
            <MaskedView
                style={Styles.maskedView}
                maskElement={
                    <>
                        <View style={Styles.maskWrapper}>
                            <View style={Styles.scannerView} />
                        </View>
                    </>
                }>

                <Camera
                    style={StyleSheet.absoluteFillObject}
                    device={device}
                    isActive={true}
                    codeScanner={props.codeScanner}
                    torch={torchOn ? 'on' : 'off'}
                />
            </MaskedView>
        </View>
    );
};

export default QrCodeScannerScreen;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: 'center'
        },
        qrCodeScanningView: {
            width: wp(55),
            height: wp(55),
            borderRadius: wp(2),
            position: 'absolute',
            borderWidth: wp(1),
            borderColor: colors.PRIMARY_BACKGROUND,
            alignSelf: "center",
            zIndex: 5,
            overflow: 'hidden'
        },
        maskedView: {
            flex: 1,
            flexDirection: 'row',
            height: '100%'
        },
        maskWrapper: {
            backgroundColor: 'rgba(0,0,0,0.9)',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        torchBtnView: {
            position: 'absolute',
            zIndex: 5,
            top: wp(9),
            right: wp(6)
        },
        torchIconStyle: {
            width: wp(12),
            height: wp(12),
            resizeMode: 'contain',
            tintColor: colors.PRIMARY_BACKGROUND
        },
        scannerView: {
            width: wp(55),
            height: wp(55),
            backgroundColor: 'black',
            borderRadius: wp(2),
        }
    })
}


