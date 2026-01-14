import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import {
  updateIdleTimeOut,
  setShowPackageRestrictionModal, // Add this action
} from "./slice/authSlice";

import Cookies from "js-cookie";
import { getExtensionToken } from "@/utils/extension";

interface GocompareFetchArgs extends FetchArgs {
  meta?: { endpointHeader?: string };
}

export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const baseQueryWithOutToken = fetchBaseQuery({
  baseUrl: `${baseUrl}`,
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json");
    return headers;
  },
});

export const baseQuery = fetchBaseQuery({
  baseUrl: `${baseUrl}`,
  prepareHeaders: async (headers) => {
    // 1. First try to get token from cookies (standard web flow)
    let token = Cookies.get("optisage-token");

    // 2. If in iframe context and no cookie found, check extension storage
    if (!token && typeof window !== "undefined" && window.parent !== window) {
      try {
        const extensionToken = await getExtensionToken();
        if (extensionToken) {
          token = extensionToken;
          // Sync back to cookie for consistency
          Cookies.set("optisage-token", token, {
            sameSite: "None",
            secure: true,
            expires: new Date(new Date().getTime() + 6 * 60 * 60 * 1000),
            path: "/",
          });
        }
      } catch (error) {
        console.error("Failed to access extension storage:", error);
      }
    }

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("Accept", "application/json");
    return headers;
  },
});


export const goCompareQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let modifiedArgs: FetchArgs | string = args;

  if (typeof args === "object") {
    const customArgs = args as GocompareFetchArgs;
    const endpointPath = customArgs.meta?.endpointHeader;

    modifiedArgs = {
      ...args,
      headers: {
        ...(args.headers || {}),
        ...(endpointPath ? { "x-endpoint": endpointPath } : {}),
      },
    };
  }

  return baseQuery(modifiedArgs, api, extraOptions);
};


export const baseQueryForAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result: any = await baseQuery(args, api, extraOptions);
  api.dispatch(updateIdleTimeOut());
  
  // Handle 403 - Package restriction
  if (
    (result.error?.status === 403 || result.error?.originalStatus === 403) &&
    result.error?.data?.responseCode === "93"
  ) {
    api.dispatch(setShowPackageRestrictionModal(true));
  }

  if (result.error?.status === 503 || result.error?.originalStatus === 503) {
    sessionStorage.removeItem("token");
    // window.location.href = "/underMaintenance";
  }

  if (result.error?.status === 500 || result.error?.originalStatus === 500) {
    // sessionStorage.removeItem("authToken");
    // window.location.href = "/serverError";
  }
  return result;
};