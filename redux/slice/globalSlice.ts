import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface globalState {
  subScriptionId: any;
  marketplaceId: number;
  currencyCode:string;
  currencySymbol:string;
  ipAlert: {
    setIpIssue: number;
    eligibility: boolean;
  };
  ipIssues:number
}

const initialState: globalState = {
    subScriptionId: null,
    marketplaceId: 6,
    currencyCode: "CAD",
    currencySymbol: "C$",
    ipAlert: {
      setIpIssue: 0,
      eligibility: false
    },
    ipIssues: 0
};

const globalSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    setSubScriptionId: (state, action: PayloadAction<number>) => {
      state.subScriptionId = action.payload; // Set loading state
    },
    setMarketPlaceId: (state, action: PayloadAction<number>)=>{
      state.marketplaceId = action.payload;
    },
    setCurrencyCode: (state, action: PayloadAction<string>)=>{
      state.currencyCode = action.payload;
    },
    setCurrencySymbol: (state, action: PayloadAction<string>)=>{
      state.currencySymbol = action.payload;
    },
    setIpIssues: (state, action: PayloadAction<number>) => {
      state.ipIssues = action.payload; // Set loading state
    },
    setIpAlert: (state, action: PayloadAction<{ setIpIssue: number; eligibility: boolean }>) => {
      state.ipAlert = action.payload;
    }
    
  },
});

export const {
   setSubScriptionId ,
   setMarketPlaceId,
   setCurrencyCode,
   setCurrencySymbol,
   setIpIssues,
   setIpAlert
  } = globalSlice.actions;
export default globalSlice.reducer;
