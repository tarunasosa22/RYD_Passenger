import React, { useRef, useState } from 'react';
import { Camera, CameraPosition, useCameraDevice, } from 'react-native-vision-camera';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAppSelector } from '../redux/Store';
import { Icons } from '../utils/IconsPaths';
import { ImageProps } from '../types/DataTypes';
import ReactNativeModal from 'react-native-modal';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import CustomActivityIndicator from './CustomActivityIndicator';


interface CustomCameraPickerComponent {
  onConfirmCaptureImage: (image: ImageProps) => void
  closeHandler?: () => void
  isProfile?: boolean
}

const CustomCameraPickerComponent = (props: CustomCameraPickerComponent) => {

  const [torchOn, setTorchOn] = useState<boolean>(false);
  const Styles = useStyles();
  const GlobalStyles = useGlobalStyles()
  const { colors } = useAppSelector(state => state.CommonSlice)
  const [switchCamera, setSwitchCamera] = useState<CameraPosition>('back')
  const camera = useRef<Camera>(null);
  const device = useCameraDevice(switchCamera);
  const [isCaptureImage, setisCaptureImage] = useState<boolean>(false)
  const [storeCapturedImage, setStoreCapturedImage] = useState<ImageProps>({})

  const handleCaptureImage = async () => {
    if (camera.current !== null) {
      const photo = await camera.current.takePhoto();
      if (props?.isProfile) {
        setTimeout(() => {
          setStoreCapturedImage({ uri: `file://'${photo?.path}` });
          setisCaptureImage(true);
        }, 200);
      } else {
        props?.onConfirmCaptureImage({ uri: `file://'${photo?.path}` })
      }
      console.log(photo.path);
    }
  }

  if (device == null) {
    return <CustomActivityIndicator color={'red'} />
  }
  return (
    <View style={Styles.container}>
      <TouchableOpacity style={[Styles.torchBtnView, { left: wp(6) }]} activeOpacity={1} onPress={() => {
        props?.closeHandler && props?.closeHandler()
      }}>
        <Image source={Icons.CLOSE_ICON}
          style={[Styles.torchIconStyle, Styles.closeIconStyle]}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={Styles.torchBtnView}
        activeOpacity={1}
        onPress={() => {
          setTorchOn(!torchOn)
        }}>
        <Image source={torchOn ? Icons.FLASH_LIGHT_ON : Icons.FLASH_LIGHT_OFF}
          style={Styles.torchIconStyle}
        />
      </TouchableOpacity>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFillObject}
        device={device}
        isActive={true}
        photo={true}
        orientation='portrait'
        torch={torchOn ? 'on' : 'off'}
      />
      <View style={Styles.bottomContainerStyle}>
        <View />
        <TouchableOpacity
          style={Styles.captureBtnStyle}
          onPress={() => {
            handleCaptureImage()
          }} />
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setSwitchCamera(switchCamera == "front" ? 'back' : 'front')
          }}>
          <Image source={Icons.SWITCH_CAMERA}
            style={Styles.switchCameraIcon}
          />
        </TouchableOpacity>
      </View>
      <ReactNativeModal isVisible={(isCaptureImage && !!storeCapturedImage?.uri)}>
        <View style={Styles.imagePreviewContainer}>
          <Image source={{ uri: storeCapturedImage?.uri }} style={Styles.capturedImageStyle} />
          <View style={Styles.confirmationImageContainer}>
            <TouchableOpacity
              onPress={() => {
                setStoreCapturedImage({});
                setisCaptureImage(false);
              }}>
              <Image source={Icons.CLOSE_ICON} style={GlobalStyles.commonIconStyle} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                props?.onConfirmCaptureImage(storeCapturedImage)
                setisCaptureImage(false);
              }}>
              <Image source={Icons.RIGHT_ARROW} style={[GlobalStyles.commonIconStyle, { width: wp(12), height: wp(12) }]} />
            </TouchableOpacity>
          </View>
        </View>
      </ReactNativeModal>
    </View>
  );
};

export default CustomCameraPickerComponent;

const useStyles = () => {

  const { colors } = useAppSelector((state) => state.CommonSlice);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.9)",
      justifyContent: 'center'
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
    switchCameraIcon: {
      width: wp(8),
      height: wp(8),
      resizeMode: 'contain',
      tintColor: colors.PRIMARY_BACKGROUND
    },
    captureBtnStyle: {
      backgroundColor: colors.PRIMARY,
      padding: wp(8),
      borderRadius: wp(10),
      borderWidth: wp(1),
      borderColor: colors.BOX_SECONDARY_BACKGROUND
    },
    bottomContainerStyle: {
      width: wp(100),
      justifyContent: 'space-between',
      flexDirection: 'row',
      position: 'absolute',
      bottom: wp(0),
      backgroundColor: colors.SHADOW_2,
      padding: wp(4),
      alignItems: 'center'
    },
    imagePreviewContainer: {
      backgroundColor: colors.SECONDARY_BACKGROUND,
      padding: wp(6),
      borderRadius: wp(3)
    },
    capturedImageStyle: {
      width: wp(70),
      height: wp(70),
      resizeMode: 'stretch',
      alignSelf: 'center',
      borderRadius: wp(3)
    },
    confirmationImageContainer: {
      justifyContent: 'space-around',
      flexDirection: 'row',
      marginTop: wp(5),
      alignItems: 'center'
    },
    closeIconStyle: {
      height: wp(8),
      width: wp(8),
      top: wp(1),
      left: wp(2)
    }
  })
}


