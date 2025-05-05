import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import FastImage from 'react-native-fast-image'
import { widthPercentageToDP as wp } from 'react-native-responsive-screen'
import { useAppSelector } from '../redux/Store'
import { Icons } from '../utils/IconsPaths'

interface CommonPreviewImageProps {
    image: string
    onPress: () => void
}

const CommonPreviewImage = (props: CommonPreviewImageProps) => {
    const Styles = useStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    return (
        <View style={Styles.container}>
            <TouchableOpacity style={Styles.closeIconContainer}
                onPress={props.onPress}>
                <Image source={Icons.CLOSE_ICON} style={Styles.closeIcon} />
            </TouchableOpacity>
            <FastImage source={{ uri: props.image }} style={{ width: wp(100), height: '60%' }} resizeMode='contain'/>
        </View>
    )
}

export default CommonPreviewImage

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent:'center'
            // justifyContent: 'center'
        },
        closeIconContainer: {
            padding: 10,
            borderRadius: 100,
            position: 'absolute',
            zIndex: 99,
            top: 30,
            right: 10,
            backgroundColor: '#ffffff78'
        },
        closeIcon: {
            width: wp(6),
            height: wp(6),
            resizeMode: 'contain'
        }
    })
}