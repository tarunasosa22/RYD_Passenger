import { createSlice } from "@reduxjs/toolkit";
import { ColorsTypes } from "../types/ColorsTypes";
import { lightThemeColors } from "../styles/Colors";
import { isEmptyObj } from "native-base";
import { TranslationKeys } from "../localization/TranslationKeys";
import { t } from "i18next";

interface initialStateTypes {
    isDarkMode: boolean,
    colors: ColorsTypes,
};

const initialState: initialStateTypes = {
    isDarkMode: false,
    colors: lightThemeColors,
};

export const parseErrorData = (response: { data: string[] & string, status: number }): string => {
    if (response?.data) {
        if (isEmptyObj(response?.data) || response.status == 500) {
            return t(TranslationKeys.something_went_wrong);
        }
        let customErrroMessage = '';
        for (const errorKey in response?.data) {
            customErrroMessage += Array.isArray(response?.data[errorKey]) ? response?.data[errorKey][0] : response?.data[errorKey] + '\n';
        }
        return customErrroMessage;
    } else {
        return t(TranslationKeys.something_went_wrong);
    }
};

export const CommonSlice = createSlice({
    name: "COMMON_REDUCER",
    initialState,
    reducers: {
        setTheme: (state, action) => {
            state.isDarkMode = action.payload
            state.colors = lightThemeColors
        },
    },
});

export const { setTheme } = CommonSlice.actions;
export default CommonSlice.reducer;
