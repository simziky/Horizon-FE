import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryForAuth } from "../queryInterceptor";

export const productsApi = createApi({
  reducerPath: "productsApi",
  refetchOnReconnect: true,
  baseQuery: baseQueryForAuth,
  endpoints: (builder) => ({
    searchItems: builder.query({
      query: ({ q, marketplaceId, pageSize = 5, pageToken }) => ({
        url: "catalog",
        method: "GET",
        params: { q, marketplaceId, pageSize, ...(pageToken && { pageToken }) },
      }),
    }),

    getSearchHistory: builder.query({
      query: ({ marketplaceId, pageSize = 5, pageToken, page = 2  }) => ({
        url: "catalog/search-history",
        method: "GET",
        params: { page ,marketplaceId, pageSize, ...(pageToken && { pageToken }) },
        // https://api-staging.optisage.ai/api/catalog/search-history?marketplaceId=1&q=tv&perPage=5
      }),
    }),

    searchProductsHistory: builder.query({
      query: ({ q, marketplaceId, perPage = 5, page = 1 }) => ({
        url: "catalog/search-history",
        method: "GET",
        params: { q, marketplaceId, perPage, page },
        // https://api-staging.optisage.ai/api/catalog/products/search?perPage=10&page=3'
      }),
    }),

    getItem: builder.query({
      query: ({ marketplaceId, itemAsin }) => {
        // console.log("Fetching item with params:", { marketplaceId, itemAsin });
        return {
          url: "catalog/products",
          method: "GET",
          params: { marketplaceId, itemAsin },
        };
      },
    }),

    getRankingsAndPrices: builder.query({
      query: ({ marketplaceId, itemAsin, period = "current" }) => ({
        url: "catalog/products/rankings",
        method: "GET",
        params: { marketplaceId, asin: itemAsin, period },
      }),
    }),

    getBuyboxInfo: builder.query({
      query: ({ marketplaceId, itemAsin, statStartDate, statEndDate }) => ({
        url: "catalog/products/buybox-details",
        method: "GET",
        params: { marketplaceId, asin: itemAsin, statStartDate, statEndDate },
        // https://api-staging.optisage.ai/api/catalog/products/buybox-details?asin=B0DP3G4GVQ&marketplaceId=1&statStartDate=2025-03-01&statEndDate=2025-03-14
      }),
    }),

    getBuyboxDetails: builder.query({
      query: ({ marketplaceId, itemAsin }) => ({
        url: "catalog/products/buybox-details",
        method: "GET",
        params: { marketplaceId, asin: itemAsin },
      }),
    }),

    getMarketAnalysis: builder.query({
      query: ({ marketplaceId, itemAsin, statStartDate, statEndDate }) => ({
        url: `catalog/products/${itemAsin}/market-analysis`,
        method: "GET",
        // params: { marketplaceId, date },
        params: { marketplaceId, asin: itemAsin, statStartDate, statEndDate },
        // https://api-staging.optisage.ai/api/catalog/products/:asin/market-analysis?marketplaceId=1&statStartDate=2025-03-01&statEndDate=2025-03-25
      }),
    }),

    getProductFees: builder.query({
      query: ({ marketplaceId, itemAsin }) => ({
        url: `catalog/products/fees/${itemAsin}`,
        method: "GET",
        params: { marketplaceId, asin: itemAsin },
        // https://api.optisage.test/api/catalog/products/fees/:asin
      }),
    }),

    calculateProfitablility: builder.mutation({
      query: ({ body }) => ({
        url: "catalog/products/profitability",
        method: "POST",
        body,
        // https://api-staging.optisage.ai/api/catalog/products/profitability
      }),
    }),

    getSalesStatistics: builder.query({
      query: ({ marketplaceId, itemAsin, startDate, endDate }) => ({
        url: "catalog/products/sales-statistics",
        method: "GET",
        params: {
          marketplaceId,
          asin: itemAsin,
          startDate,
          endDate,
        },
        // https://api.optisage.test/api/catalog/products/sales-statistics?asin=B07N4M94X4&marketplaceId=ATVPDKIKX0DER&startDate=2019-08-01T00:00-07:00&endDate=2018-08-03T00:00-07:00
      }),
    }),

    fetchMarketplaces: builder.query({
      query: () => ({
        url: "catalog/marketplaces",
        method: "GET",
      }),
    }),
    getIpAlert: builder.query({
      query: (params) => ({
        url: "catalog/products/ip-alert",
        method: "GET",
        params,
      }),
      keepUnusedDataFor: 600, // Hard TTL: 10 min
    }),
  }),
});

export const {
  useSearchItemsQuery,
  useGetSearchHistoryQuery,
  useSearchProductsHistoryQuery,
  useFetchMarketplacesQuery,
  useLazyFetchMarketplacesQuery,
  useGetItemQuery,
  useGetRankingsAndPricesQuery,
  useGetBuyboxInfoQuery,
  useGetBuyboxDetailsQuery,
  useGetProductFeesQuery,
  useCalculateProfitablilityMutation,
  useGetSalesStatisticsQuery,
  useLazyGetIpAlertQuery,
  useGetMarketAnalysisQuery,
} = productsApi;
