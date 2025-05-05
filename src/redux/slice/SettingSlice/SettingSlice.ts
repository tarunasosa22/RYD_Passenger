import { createSlice } from "@reduxjs/toolkit";

interface initialStateTypes {

    networkStatus: boolean,
    isLogOut: boolean,
    isDeleteAccount: boolean

};

const initialState: initialStateTypes = {
    networkStatus: false,
    isLogOut: false,
    isDeleteAccount: false

};

export const SettingSlice = createSlice({
    name: "SETTINGS",
    initialState,
    reducers: {
        setNetworkStatus: (state, action) => {
            state.networkStatus = action.payload
        },
        setLogOutPopUp: (state, action) => {
            state.isLogOut = action.payload
        },
        setDeleteAccountPopUp: (state, action) => {
            state.isDeleteAccount = action.payload
        },
    },
});

export const { setNetworkStatus, setLogOutPopUp, setDeleteAccountPopUp } = SettingSlice.actions;
export default SettingSlice.reducer;
