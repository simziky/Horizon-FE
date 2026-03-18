/* eslint-disable @typescript-eslint/no-explicit-any */
// Basic product information
export interface Product {
    asin: string
    product_name: string
    product_image: string
    category: string
    upc?: string
    ean?: string
    vendor?: string
    amazon_link?: string
    rating?: {
      stars: number
      count: number
    }
    extra?: {
      buybox_price: number
      monthly_est_product_sales: number
      bsr: string | number
      max_cost?: number
      profit?: number
      profit_percentage?: number
    }
    last_profitability_calculation?: {
      fba: ProfitabilityData
      fbm: ProfitabilityData
    }
  }
  
  // Profitability calculation data
  export interface ProfitabilityData {
    referralFee: number
    fulfillmentType: string
    fullfillmentFee: number
    closingFee: number
    storageFee: number
    prepFee: string | number
    shippingFee: string | number
    digitalServicesFee: number
    miscFee: string | number
    roi: number
    minRoi: number
    minProfit: number
    profitAmount: number
    maxCost: number
    totalFees: number
    vatOnFees: number
    discount: number
    profitMargin: number
    breakevenSalePrice: number
    estimatedAmzPayout: number
    costPrice?: string
  }
  
  // Buybox seller information
  export interface BuyboxItem {
    seller: string
    seller_id: string
    seller_type: string
    rating: number
    review_count: number
    listing_price: number
    weight_percentage: number
    stock_quantity: number
    is_buybox_winner: boolean
    fulfillmentType: string
    currency: string
    seller_feedback?: {
      avg_price: number
      percentage_won: number
      last_won: string
    }
  }
  
  // Market analysis data
  export interface MarketAnalysisDataPoint {
    date: string
    price: number
  }
  
  export interface MarketAnalysisData {
    buybox: MarketAnalysisDataPoint[]
    amazon: MarketAnalysisDataPoint[]
  }
  
  export interface MergedDataPoint {
    date: string
    buyBox: number | null
    amazon: number | null
  }
  
  // Rankings data
  export interface RankingsData {
    net_bb_price_changes?: {
      price: string | number
      percentage: number
    }
    buybox?: number
    amazon?: number
    lowest_fba?: number
    lowest_fbm?: number
    keepa_bsr_drops?: string | number
    estimated_sales?: string | number
    estimated_time_to_sale?: string | number
  }
  
  // IP Alert data
  export interface IpAlertData {
    eligible_to_sell: boolean
    ip_analysis: {
      issues: any[]
    }
  }
  
  // Search result item
  export interface SearchResultItem {
    basic_details: {
      asin: string
      product_name: string
      product_image: string
      category: string
      upc?: string
      vendor?: string
      rating: {
        stars: number
        count: number
      }
    }
    sales_statistics: any
    buybox_timeline: any
  }
  
  // Pagination data
  export interface PaginationData {
    nextPageToken: string | null
    previousPageToken: string | null
  }
  
  // API response types
  export interface ApiResponse<T> {
    status: number
    data: T
  }
  