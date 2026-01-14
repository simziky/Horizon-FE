import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryForAuth } from '../queryInterceptor';



export const keepaApi = createApi({
  reducerPath: 'keepa',
  baseQuery: baseQueryForAuth,
  endpoints: (builder) => ({
    
    productSummary: builder.query({
      query: ({asin, id}) => ({
        url: `catalog/products/summary?asin=${asin}&marketplaceId=${id}`,
        method: 'GET',
        
      }),
    }),
   
    priceHistory: builder.query({
      query: ({asin, id, period}) => ({
        url: `catalog/products/price-history?asin=${asin}&marketplaceId=${id}&period=${period}&priceTypes[]=amazon&priceTypes[]=buybox&priceTypes[]=new`,
        method: 'GET',
        
      }),
    }),
   
    salesRank: builder.query({
      query: ({asin, id, period}) => ({
        url: `catalog/products/category-sales-rank?asin=${asin}&marketplaceId=${id}&period=${period}`,
        method: 'GET',
        
      }),
    }),
    ratingReview: builder.query({
      query: ({asin, id, period}) => ({
        url: `catalog/products/ratings-reviews-history?asin=${asin}&marketplace_id=${id}&period=${period}`,
        method: 'GET',
        
      }),
    }),
   
    
  }),
});

export const {
  useLazyProductSummaryQuery,
  useLazyPriceHistoryQuery,
  useLazySalesRankQuery,
  useLazyRatingReviewQuery
  } = keepaApi; 