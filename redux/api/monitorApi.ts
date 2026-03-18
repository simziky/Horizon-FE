import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../queryInterceptor";

export const monitorApi = createApi({
  reducerPath: "monitorApi",
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 300, // 5 min — monitor/unmonitor mutations invalidate tags directly
  baseQuery: baseQuery,
  tagTypes: ["MonitoredSellers"],
  endpoints: (builder) => ({
    monitorSeller: builder.mutation<
      { success: boolean; message: string },
      { sellerId: string; marketplaceId: number }
    >({
      query: ({ sellerId, marketplaceId }) => ({
        url: "sellers/monitor",
        method: "POST",
        body: { seller_id: sellerId, marketplace_id: marketplaceId },
      }),
      invalidatesTags: ["MonitoredSellers"],
    }),
    
    unmonitorSeller: builder.mutation<
      { success: boolean; message: string },
      { sellerId: string; marketplaceId: number }
    >({
      query: ({ sellerId, marketplaceId }) => ({
        url: "sellers/unmonitor",
        method: "POST",
        body: { seller_id: sellerId, marketplace_id: marketplaceId },
      }),
      invalidatesTags: ["MonitoredSellers"],
    }),
    
    getMonitoredSellers: builder.query<
      {
        status: number;
        message: string;
        data: Array<{
          id: number;
          seller_id: string;
          seller_name: string;
          seller_amazon_link: string;
          rating: {
            count: number;
            stars: number;
            percentage_change: number | null;
            change_type: string | null;
          };
          marketplace: {
            id: number;
            name: string;
            currency_symbol: string;
            currency_code: string;
          };
          products_count: number;
          monitoring_since: string;
          last_updated: string;
        }>;
        responseCode: string;
        meta: {
          current_page: number;
          per_page: number;
          total: number;
          pagination: {
            current_page: number;
            total_pages: number;
            per_page: number;
            total: number;
            has_next_page: boolean;
            has_previous_page: boolean;
          };
        };
      },
      { page?: number; per_page?: number, id?: number }
    >({
      query: ({id, page = 1, per_page = 20 } = {}) => ({
        url: `sellers/monitored?marketplace_id=${id}&page=${page}&per_page=${per_page}`,
        method: "GET",
      }),
      providesTags: ["MonitoredSellers"],
    }),
  }),
});

export const {
  useMonitorSellerMutation,
  useUnmonitorSellerMutation,
  useGetMonitoredSellersQuery,
} = monitorApi; 