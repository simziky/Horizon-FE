"use client";

import { useState } from "react";
import { Drawer } from "antd";
import { BsArrowDown, BsArrowUp } from "react-icons/bs";
import Image from "next/image";
import { FaCheckCircle } from "react-icons/fa";
import CustomDatePicker from "./CustomDatePicker";
import { useGetSalesStatisticsQuery } from "@/redux/api/productsApi";
import { useAppSelector } from "@/redux/hooks";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
// import ProgressLoader from "@/components/ui/ProgressLoader";
import CircularLoader from "@/components/ui/CircularLoader";
import { Product } from "@/types";
// import useCurrencyConverter from "@/utils/currencyConverter";

interface BuyBoxItem {
  seller: string;
  timestamp: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const SalesStats = ({ product }: { product: Product }) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days by default
    endDate: new Date().toISOString(),
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { marketplaceId, currencyCode, currencySymbol } = useAppSelector(
    (state) => state?.global
  );
  // const { convertPrice } = useCurrencyConverter(currencyCode);

  // Fetch sales statistics when drawer is opened
  const { data: salesStatsData, isLoading: isLoadingSalesStats } =
    useGetSalesStatisticsQuery(
      {
        marketplaceId,
        itemAsin: product.asin,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
      { skip: !open } // Only fetch when drawer is open
    );

  // Combine local data with fetched data, preferring fetched data when available
  const salesStats = salesStatsData?.data || [];
  const buyboxTimeline = salesStatsData?.data?.buybox_timeline || [];

  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);

  // Handle date range change from the CustomDatePicker
  const handleDateChange = (
    dates: dayjs.Dayjs | [dayjs.Dayjs, dayjs.Dayjs]
  ) => {
    if (Array.isArray(dates)) {
      const [start, end] = dates;
      setDateRange({
        startDate: start.toDate().toISOString(),
        endDate: end.toDate().toISOString(),
      });
    } else {
      setDateRange({
        startDate: dates.toDate().toISOString(),
        endDate: dates.toDate().toISOString(),
      });
    }
  };

  // Format percentage with appropriate arrow
  const formatPercentage = (value: number) => {
    if (value > 0) {
      return (
        <p className="text-green-500 text-sm flex items-center gap-0.5">
          <BsArrowUp className="size-4" />
          {Math.abs(value).toFixed(2)}%
        </p>
      );
    } else if (value < 0) {
      return (
        <p className="text-red-500 text-sm flex items-center gap-0.5">
          <BsArrowDown className="size-4" />
          {Math.abs(value).toFixed(2)}%
        </p>
      );
    } else {
      return <p className="text-gray-500 text-sm">0%</p>;
    }
  };

  const renderStatContent = () => {
    if (isLoadingSalesStats) {
      return (
        <div className="flex items-center justify-center h-64">
          <CircularLoader
            duration={5000}
            color="#18CB96"
            size={64}
            strokeWidth={6}
          />
          {/* <ProgressLoader
            duration={5000}
            color="#18CB96"
            className="w-3/4 max-w-md"
          /> */}
        </div>
      );
    }

    return (
      <>
        {/* Sales Statistics Section */}
        <div className="border border-border rounded-lg grid grid-cols-2 divide-x">
          <span className="p-4 flex flex-col gap-1">
            <p className="text-[#737373] text-xs">Estimated No. of Sales</p>
            <p className="text-xl md:text-2xl font-semibold">
              {salesStats?.estimated_sales_per_month?.amount?.toLocaleString() ||
                0}{" "}
              / month
            </p>
          </span>
          <span className="p-4 flex flex-col gap-1">
            <p className="text-[#737373] text-xs">Total No. of Sellers:</p>
            <p className="text-xl md:text-2xl font-semibold">
              {salesStats?.number_of_sellers || 0} Sellers
            </p>
          </span>
        </div>

        {/* Seller Analytics Section */}
        <div className="border border-border rounded-xl shadow-sm p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <p className="text-[#0A0A0A] font-semibold text-base">
              Seller Analytics
            </p>

            {/* Date range picker */}
            <CustomDatePicker isRange onChange={handleDateChange} />
          </div>

          {/* Net Revenue */}
          <div className="bg-[#FFF9D6] rounded-xl p-3 flex items-center gap-4 justify-between">
            <span className="flex flex-col gap-1">
              <p className="text-[#737373] text-xs">Net Revenue</p>
              <p className="text-base font-semibold">
                {salesStats?.sales_analytics?.net_revenue?.currency ||
                  currencySymbol}
                {salesStats?.sales_analytics?.net_revenue?.amount?.toLocaleString() ||
                  0}
              </p>
            </span>
            {formatPercentage(
              salesStats?.sales_analytics?.net_revenue?.percentage || 0
            )}
          </div>

          {/* Price and Monthly Units Sold */}
          <div className="border border-border rounded-lg grid grid-cols-2 divide-x">
            <span className="p-3 flex items-center gap-4 justify-between">
              <span className="flex flex-col gap-1">
                <p className="text-[#737373] text-xs">Price</p>
                <p className="text-base font-semibold">
                  {salesStats?.sales_analytics?.price?.currency ||
                    currencySymbol}
                  {salesStats?.sales_analytics?.price?.amount?.toLocaleString() ||
                    0}
                </p>
              </span>
              {formatPercentage(
                salesStats?.sales_analytics?.price?.percentage || 0
              )}
            </span>
            <span className="p-3 flex items-center gap-4 justify-between">
              <span className="flex flex-col gap-1">
                <p className="text-[#737373] text-xs">Monthly Units Sold</p>
                <p className="text-base font-semibold">
                  {salesStats?.sales_analytics?.monthly_units_sold?.amount?.toLocaleString() ||
                    0}
                </p>
              </span>
              {formatPercentage(
                salesStats?.sales_analytics?.monthly_units_sold?.percentage || 0
              )}
            </span>
          </div>

          {/* Daily Units Sold and Monthly Revenue */}
          <div className="border border-border rounded-lg grid grid-cols-2 divide-x">
            <span className="p-3 flex items-center gap-4 justify-between">
              <span className="flex flex-col gap-1">
                <p className="text-[#737373] text-xs">Daily Units Sold</p>
                <p className="text-base font-semibold">
                  {salesStats?.sales_analytics?.daily_units_sold?.amount?.toLocaleString() ||
                    0}
                </p>
              </span>
              {formatPercentage(
                salesStats?.sales_analytics?.daily_units_sold?.percentage || 0
              )}
            </span>
            <span className="p-3 flex items-center gap-4 justify-between">
              <span className="flex flex-col gap-1">
                <p className="text-[#737373] text-xs">Monthly Revenue</p>
                <p className="text-base font-semibold">
                  {salesStats?.sales_analytics?.monthly_revenue?.currency ||
                    currencySymbol}
                  {salesStats?.sales_analytics?.monthly_revenue?.amount?.toLocaleString() ||
                    0}
                </p>
              </span>
              {formatPercentage(
                salesStats?.sales_analytics?.monthly_revenue?.percentage || 0
              )}
            </span>
          </div>

          {/* Date First Available and Seller Type */}
          <div className="flex flex-col gap-2 text-base">
            <span className="flex items-center gap-5 justify-between">
              <p className="text-[#595959]">Date First Available</p>
              <p className="font-semibold">
                {salesStats?.date_first_available
                  ? new Date(
                      salesStats.date_first_available
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
            </span>
            <span className="flex items-center gap-5 justify-between">
              <p className="text-[#595959]">Seller Type</p>
              <p className="font-semibold">
                {salesStats?.seller_type || "N/A"}
              </p>
            </span>
          </div>
        </div>

        {/* Buy Box Timeline */}
        <div className="border border-gray-300 rounded-xl shadow-sm p-4 flex flex-col gap-3 bg-white">
          <p className="text-black font-semibold text-base">
            Buy Box Timeline (Last {buyboxTimeline.length} Sellers)
          </p>

          <div className="flex flex-col gap-4">
            {buyboxTimeline.map((item: BuyBoxItem, index: number) => (
              <div key={index} className="flex gap-3 items-start">
                <FaCheckCircle
                  className={`size-4 mt-1 ${
                    index === 0 ? "text-green-500" : "text-gray-400"
                  }`}
                />

                <div className="flex flex-col gap-1">
                  <p
                    className={`font-semibold text-sm ${
                      index === 0 ? "text-black" : "text-[#A3A3A3]"
                    }`}
                  >
                    {index === 0
                      ? "Latest Seller with the Buy Box"
                      : "Previous Seller with the Buy Box"}
                  </p>
                  <p className="text-[#A3A3A3] text-xs">
                    {item.seller} (
                    {new Date(item.timestamp).toLocaleDateString()})
                  </p>
                </div>
              </div>
            ))}

            {buyboxTimeline.length === 0 && (
              <p className="text-gray-500">No buybox timeline data available</p>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={showDrawer}
        className="text-primary hover:underline duration-150"
      >
        Sales Statistics
      </button>

      <Drawer
        onClose={onClose}
        open={open}
        closable={false}
        width={500}
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-6 flex flex-col gap-4">
          {/* Product details - always shown */}
          <div className="border border-border rounded-xl shadow-sm p-4 flex flex-col gap-6 text-[#09090B]">
            <div className="flex gap-4">
              <span className="size-12 flex items-center justify-center">
                <span className="size-12 overflow-hidden rounded-lg mt-4">
                  <Image
                    src={product.image || "/assets/svg/ufo.svg"}
                    alt="thumbnail"
                    className="size-12 object-cover"
                    width={48}
                    height={48}
                    priority
                    unoptimized
                  />
                </span>
              </span>

              <span className="space-y-1 text-sm">
                <h3
                  onClick={() =>
                    router.push(`/dashboard/product/${product.asin}`)
                  }
                  className="text-base font-bold hover:underline duration-100 cursor-pointer"
                >
                  {product.title}
                </h3>

                {/* <p>
                  {"⭐".repeat(product.rating || 0)}{" "}
                  <span className="font-bold">({product.reviews || 0})</span>
                </p> */}
                <p>By ASIN: {product.asin}</p>
                <p>By UPC: {product.upc || "N/A"}</p>
              </span>
            </div>

            {/* Fetched content or loader */}
            {renderStatContent()}
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default SalesStats;

