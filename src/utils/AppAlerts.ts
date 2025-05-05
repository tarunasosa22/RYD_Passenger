import { Alert } from "react-native";
import { TranslationKeys } from "../localization/TranslationKeys";
import { t } from "i18next";

export const AppAlert = (title: string, message: string, onPositivePress?: () => void, onNegativePress?: () => void) => {
    Alert.alert(
        title,
        message,
        [
            {
                text: t(TranslationKeys.cancel),
                onPress: () => onNegativePress?.()
            },
            {
                text: t(TranslationKeys.ok),
                onPress: () => onPositivePress?.()
            }
        ])
};
