import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: Record<string, any> = {
  timeout: false,
  idleTimeOut: 1800000, // 30mins
  notAuthorized: false,
  serverError: false,
  isAuthenticated: false,
  user: {},
  avi: '',
  showPackageRestrictionModal: false, // Add this new state
};

export const authSlice = createSlice({
  name: "api",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{}>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setAvi: (state, action: PayloadAction<{profileImage: string}>) => {
      state.avi = action.payload.profileImage;
    },
    setTimeout: (state) => {
      state.timeout = true;
    },
    resetTimeout: (state) => {
      state.timeout = false;
    },
    setNotAuthorized: (state) => {
      state.notAuthorized = true;
    },
    resetNotAuthorized: (state) => {
      state.notAuthorized = false;
    },
    updateIdleTimeOut: (state) => {
      state.idleTimeOut = 1800000;
    },
    resetServerError: (state) => {
      state.serverError = false;
    },
    setServerError: (state) => {
      state.serverError = true;
    },
    logout: (state) => {
      state.user = [];
      state.isAuthenticated = false;
    },
    // Add this new reducer
    setShowPackageRestrictionModal: (state, action: PayloadAction<boolean>) => {
      state.showPackageRestrictionModal = action.payload;
    },
  },
});

export const {
  setUser,
  setAvi,
  setTimeout,
  updateIdleTimeOut,
  resetTimeout,
  resetNotAuthorized,
  setServerError,
  setNotAuthorized,
  resetServerError,
  logout,
  setShowPackageRestrictionModal, // Export the new action
} = authSlice.actions;

export default authSlice.reducer;