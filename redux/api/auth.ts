import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryForAuth } from "../queryInterceptor";
import { setUser } from "../slice/authSlice";
import Cookies from "js-cookie";

export const authApi = createApi({
  reducerPath: "auth",
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 10,
  baseQuery: baseQueryForAuth,
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: "auth/login",
        method: "POST",
        body: data,
      }),
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          const token = data?.data?.token;

          // Set cookie (web app)
          Cookies.set("optisage-token", token, {
            expires: new Date(new Date().getTime() + 6 * 60 * 60 * 1000),
            path: "/",
            sameSite: "None",
            secure: true,
          });
          //console.log("Stored Token:", Cookies.get("token"));
          //sessionStorage.setItem("token", apiResponse.data?.token);

          dispatch(setUser(data?.data.user));

          // Determine allowed origin for message
          const currentOrigin = window.location.origin;
          const targetOrigin = currentOrigin.includes("staging.")
            ? "https://staging.optisage.ai"
            : "https://app.optisage.ai";

          // Send token to extension if in iframe
          if (window.parent !== window) {
            // Send STORE_TOKEN message
            window.parent.postMessage(
              {
                type: "STORE_TOKEN",
                token: token,
              },
              targetOrigin
            );

            // Send LOGIN_SUCCESS message
            window.parent.postMessage(
              {
                type: "LOGIN_SUCCESS",
                token: token,
              },
              targetOrigin
            );
          }
        } catch (error) {
          console.error("Login failed:", error);
        }
      },
      invalidatesTags: ["Profile"],
    }),

    signup: builder.mutation({
      query: (data) => ({
        url: "auth/signup",
        method: "POST",
        body: data,
      }),
      //invalidatesTags: ["Profile"],
    }),

    checkEmail: builder.mutation({
      query: (data) => ({
        url: "auth/signup/check-email",
        method: "POST",
        body: data,
      }),
      //invalidatesTags: ["Profile"],
    }),
    createPassword: builder.mutation({
      query: (data) => ({
        url: "create_password",
        method: "POST",
        body: data,
      }),
    }),
    setPassword: builder.mutation({
      query: ({ data, token }) => ({
        url: `auth/set-password/${token}`,
        method: "POST",
        body: data,
      }),
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          const token = data?.data?.token;

          // Set cookie (web app)
          Cookies.set("optisage-token", token, {
            expires: new Date(new Date().getTime() + 6 * 60 * 60 * 1000),
            path: "/",
            sameSite: "None",
            secure: true,
          });

          dispatch(setUser(data?.data.user));

        } catch (error) {
          console.error("Set password failed:", error);
        }
      },
    }),
    forgetPassword: builder.mutation({
      query: (data) => ({
        url: "forgot-password",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "reset-password",
        method: "POST",
        body: data,
      }),
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: "change-password",
        method: "POST",
        body: data,
      }),
    }),

    getProfile: builder.query({
      query: () => ({
        url: "customer/profile",
        method: "GET",
      }),
      onQueryStarted(_, { dispatch, queryFulfilled }) {
        queryFulfilled
          .then((apiResponse) => {
            dispatch(setUser(apiResponse?.data?.data));
          })
          .catch((error) => {
            console.log(error);
          });
      },
    }),
    amazonAuth: builder.query({
      query: (data) => ({
        url: "amazon/exchange-token",
        method: "POST",
        body: data,
      }),
    }),
    resendVerification: builder.mutation({
      query: (data) => ({
        url: "email/verification-notification",
        method: "POST",
        body: data,
      }),
    }),
    updateUser: builder.mutation({
      query: (data) => ({
        url: "auth/update-user",
        method: "POST",
        body: data,
      }),
    }),
    updateConnectAmazon: builder.mutation({
      query: (data) => ({
        url: "customer/settings/update-amazon-connect-notification",
        method: "PUT",
        body: data,
      }),
    }),
    getPricing: builder.query<any, {}>({
      query: () => ({
        url: "pricing/new",
        method: "GET",
      }),
    }),
    getUserPricing: builder.query<any, {}>({
      query: () => ({
        url: "pricing",
        method: "GET",
      }),
    }),
    getProductCategories: builder.query({
      query: () => ({
        url: "auth/product-categories",
        method: "GET",
      }),
    }),
    getExperinceLevel: builder.query({
      query: () => ({
        url: "auth/experience-levels",
        method: "GET",
      }),
    }),
    getCountries: builder.query({
      query: () => ({
        url: "auth/countries",
        method: "GET",
      }),
    }),
    logout: builder.query({
      query: () => "auth/logout",
    }),
  }),
});

export const {
  useLoginMutation,
  useCheckEmailMutation,
  useSignupMutation,
  useLazyGetProfileQuery,
  useLogoutQuery,
  useCreatePasswordMutation,
  useForgetPasswordMutation,
  useLazyGetPricingQuery,
  useLazyGetUserPricingQuery,
  useSetPasswordMutation,
  useResetPasswordMutation,
  useLazyAmazonAuthQuery,
  useResendVerificationMutation,
  useChangePasswordMutation,
  useLazyGetCountriesQuery,
  useLazyGetExperinceLevelQuery,
  useLazyGetProductCategoriesQuery,
  useUpdateUserMutation,
  useUpdateConnectAmazonMutation
} = authApi;
