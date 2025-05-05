import i18n from "i18next";
import { initReactI18next } from 'react-i18next';
import { getAsyncStorageData } from "../../utils/HelperFunctions";
import { AppStrings } from "../../utils/AppStrings";

import en from "../en.json";
import hn from "../hn.json";
import ar from "../ar.json";

const resources = {
    en: {
        translation: en
    },
    hi: {
        translation: hn
    },
    ar: {
        translation: ar
    }
}

getAsyncStorageData(AppStrings.selected_language).then(res => {
    i18n
        .use(initReactI18next)
        .init({
            compatibilityJSON: 'v3',
            lng: res === null ? 'en' : res,
            fallbackLng: 'en',
            resources,
            keySeparator: false,
            interpolation: {
                escapeValue: false
            }
        })
})



export default i18n;