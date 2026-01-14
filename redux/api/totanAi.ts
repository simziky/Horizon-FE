import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryForAuth } from '../queryInterceptor';



export const totanApi = createApi({
  reducerPath: 'totan',
  baseQuery: baseQueryForAuth,
  endpoints: (builder) => ({
    
    chat: builder.mutation({
      query: (data) => ({
        url: `totan-ai/chat`,
        method: 'POST',
        body:data
      }),
    }),
   
    analyze: builder.mutation({
      query: (data) => ({
        url: `totan-ai/analyze`,
        method: 'POST',
        body: data
      }),
    }),
   
    purchaseQuantity: builder.query({
      query: (asin) => ({
        url: `totan-ai/purchase-quantity/${asin}`,
        method: 'GET',
        
      }),
    }),
    chatHistory: builder.query({
      query: (sessionId) => ({
        url: `totan-ai/session/${sessionId}`,
        method: 'GET',
      }),
    }),
    chatAllHistory: builder.query({
      query: (size) => ({
        url: `totan-ai/history?perPage=${size}`,
        method: 'GET',
      }),
    }),
   
    
  }),
});

export const {
    useChatMutation,
    useAnalyzeMutation,
    useLazyPurchaseQuantityQuery,
    useLazyChatHistoryQuery,
    useChatAllHistoryQuery,
    useLazyChatAllHistoryQuery
 
  } = totanApi; 