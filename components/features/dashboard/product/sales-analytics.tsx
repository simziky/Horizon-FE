"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { BsArrowDown, BsArrowUp } from "react-icons/bs";
import { FaCheckCircle } from "react-icons/fa";
import Image from "next/image";
import { useGetSalesStatisticsQuery } from "@/redux/api/productsApi";
import { useAppSelector } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import CircularLoader from "@/components/ui/CircularLoader";

interface BuyBoxItem {
  seller: string;
  timestamp: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface Product {
  asin: string;
  title: string;
  image?: string;
  upc?: string;
}

interface SalesAnalyticsProps {
  //product?: Product | undefined;
  asin?: string;
  showProductHeader?: boolean;
}

const SalesAnalytics = ({  asin, showProductHeader = false }: SalesAnalyticsProps) => {
  const router = useRouter();

  // Calculate date range for previous month and current month
  const getCurrentAndPreviousMonthRange = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Start of previous month
    const startOfPreviousMonth = new Date(currentYear, currentMonth - 1, 1);
    
    // End of current month
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    
    return {
      startDate: startOfPreviousMonth.toISOString(),
      endDate: endOfCurrentMonth.toISOString(),
    };
  };

  const [dateRange] = useState<DateRange>(getCurrentAndPreviousMonthRange);

  const { marketplaceId, currencyCode, currencySymbol } = useAppSelector(
    (state) => state?.global
  );

  // Use the provided asin or fall back to product.asin
  const productAsin = asin ;

  // Fetch sales statistics
  const { data: salesStatsData, isLoading: isLoadingSalesStats } =
    useGetSalesStatisticsQuery(
      {
        marketplaceId,
        itemAsin: productAsin,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
      { skip: !productAsin } // Only fetch when we have an ASIN
    );

  // Combine local data with fetched data, preferring fetched data when available
  const salesStats = salesStatsData?.data || [];
  const buyboxTimeline = salesStatsData?.data?.buybox_timeline || [];

  // Format percentage with appropriate arrow
  const formatPercentage = (value: number) => {
    if (value > 0) {
      return (
        <p className="text-[#18CB96] flex items-center gap-1">
          <BsArrowUp /> {Math.abs(value).toFixed(1)}%
        </p>
      );
    } else if (value < 0) {
      return (
        <p className="text-[#FD3E3E] flex items-center gap-1">
          <BsArrowDown /> {Math.abs(value).toFixed(1)}%
        </p>
      );
    } else {
      return <p className="text-gray-500 flex items-center gap-1">0%</p>;
    }
  };

  if (isLoadingSalesStats) {
    return (
      <div className="rounded-xl bg-white p-2 lg:p-2">
        <div className="flex items-center justify-center h-64">
          <CircularLoader
            duration={2000}
            color="#18CB96"
            size={64}
            strokeWidth={4}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-2 lg:p-2">
     

      {/* Header */}
      <div className="mb-4">
      
        <p className="text-sm text-[#595959]">
          Data from previous month to current month
        </p>
      </div>

      {/* Net Revenue Card */}
      <div className="bg-[#FEF9F5] rounded-[10px] p-3 text-sm font-medium flex items-center gap-6 justify-between">
        <span className="flex flex-col gap-1.5">
          <p className="text-[#E88001]">Net Revenue</p>
          <p className="text-black text-lg font-semibold">
            {salesStats?.sales_analytics?.net_revenue?.currency || currencySymbol}
            {salesStats?.sales_analytics?.net_revenue?.amount?.toLocaleString() || "55.82"}
          </p>
        </span>
        {formatPercentage(
          salesStats?.sales_analytics?.net_revenue?.percentage || 23.5
        )}
      </div>

      {/* Price and Monthly Units Sold */}
      <div className="mt-5 bg-[#FAFAFB] border border-[#E0E4EE] text-[#595959] rounded-[10px] text-sm flex divide-x divide-[#E0E4EE]">
        <div className="flex-1 flex flex-col gap-1 p-3">
          {formatPercentage(
            salesStats?.sales_analytics?.price?.percentage || 23.5
          )}
          <p className="flex items-center gap-1">Price</p>
          <p className="text-[#596375] font-bold text-lg">
            {salesStats?.sales_analytics?.price?.currency || currencySymbol}
            {salesStats?.sales_analytics?.price?.amount?.toLocaleString() || "34.19"}
          </p>
        </div>

        <div className="flex-1 flex flex-col gap-1 p-3">
          {formatPercentage(
            salesStats?.sales_analytics?.monthly_units_sold?.percentage || 23.5
          )}
          <p className="flex items-center gap-1">Monthly Units Sold</p>
          <p className="text-[#596375] font-bold text-lg">
            {salesStats?.sales_analytics?.monthly_units_sold?.amount?.toLocaleString() || "8000"} / month
          </p>
        </div>
      </div>

      {/* Daily Units Sold and Monthly Revenue */}
      <div className="mt-4 border border-[#E0E4EE] text-[#595959] rounded-[10px] text-sm flex divide-x divide-[#E0E4EE]">
        <div className="flex-1 flex flex-col gap-1 p-3">
          {formatPercentage(
            salesStats?.sales_analytics?.daily_units_sold?.percentage || -23.5
          )}
          <p className="flex items-center gap-1">Daily Units Sold</p>
          <p className="text-[#596375] font-bold text-lg">
            {salesStats?.sales_analytics?.daily_units_sold?.amount?.toLocaleString() || "573"}
          </p>
        </div>

        <div className="flex-1 flex flex-col gap-1 p-3">
          {formatPercentage(
            salesStats?.sales_analytics?.monthly_revenue?.percentage || 23.5
          )}
          <p className="flex items-center gap-1">Monthly Revenue</p>
          <p className="text-[#596375] font-bold text-lg">
            {salesStats?.sales_analytics?.monthly_revenue?.currency || currencySymbol}
            {salesStats?.sales_analytics?.monthly_revenue?.amount?.toLocaleString() || "481,278"}
          </p>
        </div>
      </div>

      {/* Additional Details */}
      <div className="mt-5 flex flex-col gap-1.5 text-sm text-[#595959] px-2">
        <span className="flex items-center gap-4 justify-between">
          <p>Date First Available</p>
          <p className="text-black font-semibold">
            {salesStats?.date_first_available
              ? new Date(salesStats.date_first_available).toLocaleDateString()
              : "07/05/2021"}
          </p>
        </span>
        <span className="flex items-center gap-4 justify-between">
          <p>Seller Type</p>
          <p className="text-black font-semibold">
            {salesStats?.seller_type || "AMZ"}
          </p>
        </span>
        <span className="flex items-center gap-4 justify-between">
          <p>No of Sellers</p>
          <p className="text-black font-semibold flex items-center gap-2">
            <span className="bg-[#009F6D0A] py-1 px-2 rounded-full text-[8px] text-[#008E61] flex items-center gap-1">
              <BsArrowUp />
              23.5%
            </span>
            {salesStats?.number_of_sellers || "5"} Sellers
          </p>
        </span>
        <span className="flex items-center gap-4 justify-between">
          <p>Estimated Sales</p>
          <p className="text-black font-semibold">
            {salesStats?.estimated_sales_per_month?.amount?.toLocaleString() || "0"} / month
          </p>
        </span>
      </div>

     
    </div>
  );
};

export default SalesAnalytics;