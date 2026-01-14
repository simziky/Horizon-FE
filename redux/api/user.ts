import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryForAuth } from "../queryInterceptor";


export const userApi = createApi({
  reducerPath: "user",
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 10,
  baseQuery: baseQueryForAuth,
  endpoints: (builder) => ({

   
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "reset-password",
        method: "POST",
        body: data,
      }),
    }),
    getReferrals: builder.query({
      query: () => ({
        url: "customer/referrals",
        method: "GET",
      }),
    }),
    getSettings: builder.query({
      query: () => ({
        url: "customer/settings",
        method: "GET",
      }),
    }),
    updateSettings: builder.mutation({
      query: (data) => ({
        url: "customer/settings",
        method: "PUT",
        body: data,
      }),
    }),
    getSubscriptions: builder.query({
      query: () => ({
        url: "customer/subscriptions",
        method: "GET",
      }),
    }),
    getNotifications: builder.query({
      query: () => ({
        url: "customer/notifications",
        method: "GET",
      }),
    }),
    getFeatureUsage: builder.query({
      query: (featureKey) => ({
        url: `/features/${featureKey}/check`,
        method: "GET",
      }),
    }),
    markRead: builder.mutation({
      query: (id) => ({
        url: `customer/notifications/${id}`,
        method: "PUT",
      }),
    }),
    markAllRead: builder.mutation({
      query: () => ({
        url: `customer/notifications/mark-all-read`,
        method: "PUT",
      }),
    }),
    deleteAllNotification: builder.mutation({
      query: () => ({
        url: `customer/notifications/delete-all`,
        method: "DELETE",
      }),
    }),
    deleteSingleNotification: builder.mutation({
      query: (id) => ({
        url: `customer/notifications/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
 useLazyGetReferralsQuery,
 useLazyGetSettingsQuery,
 useUpdateSettingsMutation,
 useLazyGetSubscriptionsQuery,
 useLazyGetNotificationsQuery,
 useMarkReadMutation,
 useMarkAllReadMutation,
 useDeleteAllNotificationMutation,
 useDeleteSingleNotificationMutation,
 useLazyGetFeatureUsageQuery

} = userApi;
