import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryForAuth } from "../queryInterceptor";

export const sellerApi = createApi({
  reducerPath: "Seller",
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 300, // 5 min — all endpoints are lazy queries, triggered manually
  baseQuery: baseQueryForAuth,
  tagTypes: [""],
  endpoints: (builder) => ({
    getSellerDetails: builder.query({
      query: ({ seller_id, id }) => ({
        url: `sellers/${seller_id}?marketplaceId=${id}`,
        method: "GET",
      }),
    }),
    // getSellerProducts: builder.query({
    //   query: ({ sellerId, ...params }) => ({
    //     url: `sellers/${sellerId}/products`,
    //     method: "GET",
    //     params: {
    //       ...params,
    //       marketplaceId: params.marketplaceId,
    //       estimatedSale: params.estimatedSale,
    //       buyboxAmount: params.buyboxAmount,
    //       offer: params.offer,
    //       minBsr: params.minBsr,
    //       maxBsr: params.maxBsr,
    //       q: params.q,
    //       pageToken: params.pageToken,
    //       perPage: params.perPage,
    //     },
    //   }),
    // }),

    getSellerProducts: builder.query({
      query: ({ sellerId, marketplaceId, ...params }) => {
        const queryParams: Record<string, string | number | undefined> = {
          marketplaceId,
          perPage: params.perPage,
        };

        // Addind these optional params only if they exist
        if (params.estimatedSale)
          queryParams.estimatedSale = params.estimatedSale;
        if (params.buyboxAmount) queryParams.buyboxAmount = params.buyboxAmount;
        if (params.offer) queryParams.offer = params.offer;
        if (params.minBsr) queryParams.minBsr = params.minBsr;
        if (params.maxBsr) queryParams.maxBsr = params.maxBsr;
        if (params.q) queryParams.q = params.q;
        if (params.brandName) queryParams.brandName = params.brandName;
        if (params.pageToken) queryParams.pageToken = params.pageToken;
        if (params.categoryId) queryParams.categoryId = params.categoryId;

        return {
          url: `sellers/${sellerId}/products`,
          method: "GET",
          params: queryParams,
        };
      },
    }),
  }),
});

export const { useLazyGetSellerDetailsQuery, useLazyGetSellerProductsQuery } =
  sellerApi;

