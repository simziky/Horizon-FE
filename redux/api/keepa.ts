import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryForAuth } from '../queryInterceptor';
import { keepaCacheKey } from '@/utils/cacheKeys';

export const keepaApi = createApi({
  reducerPath: 'keepa',
  baseQuery: baseQueryForAuth,
  // Soft TTL: serve cached data if younger than these values before re-fetching.
  // Hard TTL (keepUnusedDataFor) is set per-endpoint below.
  refetchOnMountOrArgChange: 900, // 15 min default soft TTL
  refetchOnReconnect: true,
  endpoints: (builder) => ({

    productSummary: builder.query({
      query: ({asin, id}) => ({
        url: `catalog/products/summary?asin=${asin}&marketplaceId=${id}`,
        method: 'GET',
      }),
      keepUnusedDataFor: 1200, // Hard TTL: 20 min
      serializeQueryArgs: ({ queryArgs: { asin, id } }) =>
        keepaCacheKey('summary', id, asin),
    }),

    priceHistory: builder.query({
      query: ({asin, id, period}) => ({
        url: `catalog/products/price-history?asin=${asin}&marketplaceId=${id}&period=${period}&priceTypes[]=amazon&priceTypes[]=buybox&priceTypes[]=new`,
        method: 'GET',
      }),
      keepUnusedDataFor: 1800, // Hard TTL: 30 min
      serializeQueryArgs: ({ queryArgs: { asin, id, period } }) =>
        keepaCacheKey('price_history', id, asin, period),
    }),

    salesRank: builder.query({
      query: ({asin, id, period}) => ({
        url: `catalog/products/category-sales-rank?asin=${asin}&marketplaceId=${id}&period=${period}`,
        method: 'GET',
      }),
      keepUnusedDataFor: 1800, // Hard TTL: 30 min
      serializeQueryArgs: ({ queryArgs: { asin, id, period } }) =>
        keepaCacheKey('sales_rank', id, asin, period),
    }),

    ratingReview: builder.query({
      query: ({asin, id, period}) => ({
        url: `catalog/products/ratings-reviews-history?asin=${asin}&marketplace_id=${id}&period=${period}`,
        method: 'GET',
      }),
      keepUnusedDataFor: 1800, // Hard TTL: 30 min
      serializeQueryArgs: ({ queryArgs: { asin, id, period } }) =>
        keepaCacheKey('rating', id, asin, period),
    }),


  }),
});

export const {
  useLazyProductSummaryQuery,
  useLazyPriceHistoryQuery,
  useLazySalesRankQuery,
  useLazyRatingReviewQuery
  } = keepaApi; 