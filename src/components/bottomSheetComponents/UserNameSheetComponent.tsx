import React from 'react';
import { Platform, StyleSheet, Text, View } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useGlobalStyles } from "../../hooks/useGlobalStyles";
import { useAppDispatch, useAppSelector } from "../../redux/Store";
import CustomPrimaryButton from "../CustomPrimaryButton";
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { Fonts } from '../../styles/Fonts';
import { FontSizes } from '../../styles/FontSizes';
import { useFormik } from 'formik';
import * as yup from 'yup';
import CommonErrorText from '../CommonErrorText';
import { updateRiderDetials } from '../../redux/slice/authSlice/AuthSlice';
import { NameRegExp } from '../../utils/ScreenUtils';
import { TranslationKeys } from '../../localization/TranslationKeys';
import { useTranslation } from 'react-i18next';


interface UserNameBottomSheetComponentProps {
    onChange: () => void
};

const UserNameBottomSheetComponent = (props: UserNameBottomSheetComponentProps) => {
    
    const Styles = useStyles();
    const GlobalStyle = useGlobalStyles();
    const { colors } = useAppSelector(state => state.CommonSlice);
    const { userDetail } = useAppSelector(state => state.AuthSlice)
    const dispatch = useAppDispatch();
    const {t} = useTranslation();
    
    const UserNameValidationSchema = yup.object().shape({
        userName: yup.string().trim().required(t(TranslationKeys.please_enter_name)).matches(NameRegExp, t(TranslationKeys.name_cannot_containe_number))
    });

    const {
        handleChange,
        handleSubmit,
        values,
        errors,
        touched,
        resetForm,
        setValues
    } = useFormik({
        initialValues: { userName: '' },
        enableReinitialize: true,
        validationSchema: UserNameValidationSchema,
        onSubmit: (values) => {
            const data = new FormData()
            data.append("name", values.userName)

            const params = {
                rider_id: userDetail?.id,
                formData: data
            }
            dispatch(updateRiderDetials(params)).unwrap().then((res) => {
                console.log("🚀 ~ file: UserNameSheetComponent.tsx:53 ~ dispatch ~ res:", res)
                props.onChange()
                resetForm()
            }).catch((error) => {
                console.log("🚀 ~ file: UserNameSheetComponent.tsx:56 ~ dispatch ~ error:", error)
            })
        }
    });

    return (
        <View style={Styles.containerStyle}>
            <View>
                <Text
                    numberOfLines={1}
                    style={Styles.nameTxtStyle}>{t(TranslationKeys.name)}</Text>
                <BottomSheetTextInput
                    placeholder={t(TranslationKeys.enter_your_name)}
                    onChangeText={(text) => {
                        setValues({ userName: text })
                    }}
                    value={values.userName}
                    placeholderTextColor={colors.SECONDARY_TEXT}
                    style={Styles.sheetInputTextStyle}
                />
                {(errors.userName && touched.userName) ?
                    <CommonErrorText title={errors.userName} />
                    : null
                }
            </View>
            <CustomPrimaryButton
                onPress={handleSubmit}
                style={[GlobalStyle.primaryBtnStyle, Styles.confirmBtnStyle]}
                title={t(TranslationKeys.confirm)} />
        </View>
    );
};

export default UserNameBottomSheetComponent;

const useStyles = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return (
        StyleSheet.create({
            sheetInputTextStyle: {
                backgroundColor: colors.BOX_SECONDARY_BACKGROUND,
                borderRadius: wp(3),
                borderWidth: wp(0.3),
                borderColor: colors.BOX_BORDER,
                padding: wp(3),
                fontFamily: Fonts.FONT_POP_REGULAR,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.SECONDARY_TEXT,
            },
            nameTxtStyle: {
                fontFamily: Fonts.FONT_POP_MEDIUM,
                fontSize: FontSizes.FONT_SIZE_16,
                color: colors.PRIMARY_TEXT,
                paddingVertical: wp(1)
            },
            confirmBtnStyle: {
                marginBottom: Platform.OS == "ios" ? wp(3) : wp(2),
            },
            containerStyle: {
                flex: 1,
                justifyContent: 'space-between'
            }
        })
    );
};
