"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { BiChevronDown } from "react-icons/bi";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { useGetBuyboxInfoQuery } from "@/redux/api/productsApi";
import dayjs from "dayjs";

interface BuyboxAnalysisProps {
  asin: string;
  marketplaceId: number;
}

interface BuyboxItem {
  seller: string;
  weight_percentage: number;
  is_buybox_winner: boolean;
  rating?: string;
  review_count?: number;
  seller_type?: string;
}

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

const BuyboxAnalysis = ({ asin, marketplaceId }: BuyboxAnalysisProps) => {
  const [dateRange, setDateRange] = useState("30");
  const [statStartDate, setStatStartDate] = useState(
    dayjs().subtract(30, "days").format("YYYY-MM-DD")
  );
  const [statEndDate, setStatEndDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const {
    data: buyboxData,
    isLoading: isLoadingBuybox,
  } = useGetBuyboxInfoQuery({
    marketplaceId,
    itemAsin: asin,
    statStartDate,
    statEndDate,
  });

  const buybox = (buyboxData?.data?.buybox as BuyboxItem[]) ?? [];

  // Color palette for sellers
  const colorPalette = [
    "#6610F2", // Purple
    "#458BE1", // Blue
    "#FDCA40", // Yellow
    "#FFA15B", // Orange
    "#FF715B", // Red-orange
    "#F38D2E", // Deep orange
  ];

  const pieData: PieChartData[] =
    buybox?.map((seller, index) => ({
      name: seller.seller,
      value: seller.weight_percentage,
      color: colorPalette[index % colorPalette.length],
    })) || [];

  const buyboxWinner = buybox.find((seller) => seller.is_buybox_winner);
  const totalSellers = buybox.length;

  // Handle date range change
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDateRange(value);

    const endDate = dayjs();
    let startDate;

    switch (value) {
      case "30":
        startDate = endDate.subtract(30, "days");
        break;
      case "90":
        startDate = endDate.subtract(90, "days");
        break;
      case "180":
        startDate = endDate.subtract(180, "days");
        break;
      case "all":
        startDate = endDate.subtract(1, "year");
        break;
      default:
        startDate = endDate.subtract(30, "days");
    }

    setStatStartDate(startDate.format("YYYY-MM-DD"));
    setStatEndDate(endDate.format("YYYY-MM-DD"));
  };

  // Handle pie chart click
  const onPieClick = (_: any, index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Render active shape with percentage
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 5}
          outerRadius={innerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="#414D55"
          className="font-bold text-2xl"
        >
          {payload.value}%
        </text>
        {/** 
        <text
          x={cx}
          y={cy + 15}
          textAnchor="middle"
          fill="#696D6E"
          className="text-xs font-medium"
        >
          {payload.name}
        </text>
        */}
      </g>
    );
  };

  return (
    <div className="rounded-xl  ">
      <div className="flex gap-4 items-center justify-between">
        <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm w-max">
          Buy Box Analysis
        </span>

        <div className="relative">
          <select
            aria-label="Filter"
            className="bg-primary flex items-center gap-2.5 rounded-2xl py-2 pl-3 pr-8 text-white font-semibold w-max text-xs appearance-none outline-none"
            value={dateRange}
            onChange={handleDateRangeChange}
          >
            <option value="30" className="bg-white text-black rounded-t-md">
              30 days
            </option>
            <option value="90" className="bg-white text-black rounded-t-md">
              90 days
            </option>
            <option value="180" className="bg-white text-black rounded-t-md">
              180 days
            </option>
            <option value="all" className="bg-white text-black rounded-t-md">
              All time
            </option>
          </select>
          <BiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
        </div>
      </div>

      {isLoadingBuybox ? (
        <div className="flex items-center justify-center h-64 mt-6">
          <div className="text-sm text-gray-500 font-medium">Loading...</div>
        </div>
      ) : buybox.length > 0 ? (
        <>
          {/* Chart */}
          <div
            className="relative flex items-center justify-center mt-6"
            style={{ height: 250 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  onClick={onPieClick}
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  style={{ cursor: "pointer" }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label when nothing is selected */}
            {activeIndex === null && (
              <div className="absolute text-center pointer-events-none">
                <div className="text-xs text-[#696D6E] font-medium">
                  Click to view
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-2 max-h-32 overflow-y-auto show-scrollbar">
            {pieData.map((entry, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm p-1 rounded transition-colors cursor-pointer ${
                  activeIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              >
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="flex-1 truncate font-medium text-gray-700 space-x-3">
                  {entry.name}
                </span>
                {buybox[index]?.is_buybox_winner && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Winner
                  </span>
                )}
                <span className="font-semibold text-gray-900">
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 mt-6">
          <div className="text-sm text-gray-500">
            No buybox data available for this period.
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyboxAnalysis;