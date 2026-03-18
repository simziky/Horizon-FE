"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useMemo } from "react";
import { Skeleton, Tooltip as AntTooltip } from "antd";
import dayjs from "dayjs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useGetMarketAnalysisQuery } from "@/redux/api/productsApi";
import MiniDatePicker from "@/components/features/upc-scanner/date-picker";
import type { TooltipProps } from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import CustomDatePicker from "../CustomDatePicker";

interface MarketAnalysisProps {
  asin: string;
  marketplaceId: number;
  isLoading?: boolean;
}

interface MarketAnalysisData {
  buybox: Array<{ date: string; price: number }>;
  amazon: Array<{ date: string; price: number }>;
}

interface MergedDataPoint {
  date: string;
  buyBox: number | null;
  amazon: number | null;
  Amazon: number; // For compatibility with existing chart
  BuyBox: number; // For compatibility with existing chart
}

const MarketAnalysis = ({ asin, marketplaceId, isLoading }: MarketAnalysisProps) => {
  const [statStartDate, setStatStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [statEndDate, setStatEndDate] = useState(dayjs().add(1, "month").format("YYYY-MM-DD"));
  const [selectedMetric, setSelectedMetric] = useState("price");

  const {
    data: marketAnalysisData,
    error: marketAnalysisError,
    isLoading: isLoadingMarketAnalysis,
  } = useGetMarketAnalysisQuery({
    marketplaceId,
    itemAsin: asin,
    statStartDate,
    statEndDate,
  });

  const ShadowDot = (props: any) => {
    const { cx, cy, fill, stroke, strokeWidth, r, payload, index } = props;
    
    // Only show dot if this index is in the random selected indices
    if (!randomIndices.includes(index)) {
      return null;
    }
    
    return (
      <g>
        {/* Shadow circle */}
        <circle
          cx={cx}
          cy={cy + 2}
          r={r}
          fill="rgba(0, 0, 0, 0.15)"
          filter="blur(2px)"
        />
        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </g>
    );
  };

  // Custom active dot component with larger shadow
  const ShadowActiveDot = (props: any) => {
    const { cx, cy, fill, stroke, strokeWidth, r } = props;
    
    return (
      <g>
        {/* Shadow circle */}
        <circle
          cx={cx}
          cy={cy + 3}
          r={r + 1}
          fill="rgba(0, 0, 0, 0.2)"
          filter="blur(3px)"
        />
        {/* Main dot */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </g>
    );
  };

  const handleDateChange = (dates: any) => {
    if (dates && dates.length === 2) {
      const [startDate, endDate] = dates;
      setStatStartDate(startDate.format("YYYY-MM-DD"));
      setStatEndDate(endDate.format("YYYY-MM-DD"));
    }
  };

  // Transform the API data to match the chart's expected format
  const transformData = (data: MarketAnalysisData | undefined): MergedDataPoint[] => {
    if (!data) return [];

    const buyboxMap = new Map(data.buybox.map((item) => [dayjs(item.date).format("MMM D"), item.price]));
    const amazonMap = new Map(data.amazon.map((item) => [dayjs(item.date).format("MMM D"), item.price]));

    const allDates = new Set([...Array.from(buyboxMap.keys()), ...Array.from(amazonMap.keys())]);

    const mergedData: MergedDataPoint[] = Array.from(allDates).map((date) => {
      const buyBoxPrice = buyboxMap.get(date) ?? null;
      const amazonPrice = amazonMap.get(date) ?? null;
      
      return {
        date,
        buyBox: buyBoxPrice,
        amazon: amazonPrice,
        // For compatibility with existing chart structure
        Amazon: amazonPrice || 0,
        BuyBox: buyBoxPrice || 0,
      };
    });

    return mergedData.sort((a, b) => (dayjs(a.date, "MMM D").isBefore(dayjs(b.date, "MMM D")) ? -1 : 1));
  };

  const chartData = transformData(marketAnalysisData?.data);

  // Generate random indices for showing dots (max 5 dots)
  const randomIndices = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const maxDots = Math.min(5, chartData.length);
    const indices: number[] = [];
    
    // Generate unique random indices
    while (indices.length < maxDots) {
      const randomIndex = Math.floor(Math.random() * chartData.length);
      if (!indices.includes(randomIndex)) {
        indices.push(randomIndex);
      }
    }
    
    return indices.sort((a, b) => a - b); // Sort for consistency
  }, [chartData.length]);

  // Custom tooltip formatter for the chart
  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg text-sm">
          <p className="text-gray-700 font-medium mb-1">{`${label}`}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <p style={{ color: entry.color }} className="font-medium">
                {`${entry.name}: ${Number(entry.value).toFixed(2)}`}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get price range for tooltips
  const getMinMaxPrices = () => {
    if (!chartData.length) return { min: 'N/A', max: 'N/A' };
    
    const allPrices = chartData.flatMap(item => {
      const prices = [];
      if (item.amazon !== null) prices.push(item.amazon);
      if (item.buyBox !== null) prices.push(item.buyBox);
      return prices;
    });
    
    if (!allPrices.length) return { min: 'N/A', max: 'N/A' };
    
    return {
      min: `$${Math.min(...allPrices).toFixed(2)}`,
      max: `$${Math.max(...allPrices).toFixed(2)}`
    };
  };

  const priceRange = getMinMaxPrices();

  if (isLoading || isLoadingMarketAnalysis) {
    return <MarketAnalysisSkeleton />;
  }

  return (
    <div className="rounded-xl bg-white p-4 lg:p-5">
      <div className="flex items-center gap-4 justify-between">
        <AntTooltip title={`Price analysis from ${statStartDate} to ${statEndDate}. Price range: ${priceRange.min} - ${priceRange.max}`} placement="top">
          <span className="bg-[#F3F4F6] px-3 py-1.5 rounded-3xl text-[#676A75] font-semibold text-sm w-max">
            Market Analysis
          </span>
        </AntTooltip>

        <CustomDatePicker isRange onChange={handleDateChange} />
      </div>

      <div className="mt-5 flex items-center gap-1 text-xs">
        <button
          type="button"
          className={`border rounded-full px-3 py-2 font-semibold transition-colors ${
            selectedMetric === "price"
              ? "bg-[#18CB961F] border-transparent text-[#009F6D]"
              : "border-border text-[#939AA6]"
          }`}
          onClick={() => setSelectedMetric("price")}
        >
          Price
        </button>
        <AntTooltip title="Volume data not available in current API" placement="top">
          <button
            type="button"
            className="border border-border rounded-full px-3 py-2 text-[#939AA6] opacity-50 cursor-not-allowed"
            disabled
          >
            Volume
          </button>
        </AntTooltip>
        <AntTooltip title="Reviews data not available in current API" placement="top">
          <button
            type="button"
            className="border border-border rounded-full px-3 py-2 text-[#939AA6] opacity-50 cursor-not-allowed"
            disabled
          >
            Reviews
          </button>
        </AntTooltip>
      </div>

      {/* legend */}
      <div className="mt-5 text-[#596375] text-sm font-semibold flex items-center gap-4">
        <span className="flex gap-1 items-center">
          <span className="size-3.5 bg-[#F20B7A] rounded-md" />
          <AntTooltip title="Price history when sold directly by Amazon" placement="top">
            <p className="cursor-help">Amazon</p>
          </AntTooltip>
        </span>
        <span className="flex gap-1 items-center">
          <span className="size-3.5 bg-[#18CB96] rounded-md" />
          <AntTooltip title="Price history of the Buy Box (featured offer on Amazon)" placement="top">
            <p className="cursor-help">Buy Box</p>
          </AntTooltip>
        </span>
      </div>

      <div className="mt-5">
        {chartData.length > 0 ? (
          isLoadingMarketAnalysis ? (
            <div className="h-[300px] flex items-center justify-center font-medium">Loading...</div>
          ) : marketAnalysisError ? (
            <div className="h-[300px] flex items-center justify-center text-red-500 font-medium">
              Error loading market analysis data
            </div>
          ) : (
            <AntTooltip title={`Price trends from ${statStartDate} to ${statEndDate}. Hover over the chart to see exact prices.`} placement="top">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAmazon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f81d75" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f81d75" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorBuyBox" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00c48c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00c48c" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray=" 2 2" 
                    vertical={true} 
                    horizontal={false}
                    stroke="#e0e0e0"
                    strokeWidth={1}
                  />
                  <XAxis 
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.toLocaleString("default", { month: "short" })} ${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Amazon"
                    stroke="#f81d75"
                    strokeWidth={2}
                    fill="url(#colorAmazon)"
                    fillOpacity={1}
                    dot={<ShadowDot fill="#f81d75" strokeWidth={2} r={6} stroke="#fff" />}
                    activeDot={<ShadowActiveDot r={6} stroke="#f81d75" strokeWidth={2} fill="#fff" />}
                  />
                  <Area
                    type="monotone"
                    dataKey="BuyBox"
                    stroke="#00c48c"
                    strokeWidth={2}
                    fill="url(#colorBuyBox)"
                    fillOpacity={1}
                    dot={<ShadowDot fill="#00c48c" strokeWidth={2} stroke="#fff" r={6} />}
                    activeDot={<ShadowActiveDot r={6} stroke="#00c48c" strokeWidth={2} fill="#fff" />}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </AntTooltip>
          )
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No market analysis data available for the selected date range.
          </div>
        )}
      </div>
    </div>
  );
};

const MarketAnalysisSkeleton = () => {
  return (
    <div className="rounded-xl bg-white p-4 lg:p-5">
      <div className="flex items-center gap-4 justify-between">
        <Skeleton.Button active size="small" style={{ width: 150 }} />
        <Skeleton.Button active size="small" style={{ width: 200 }} />
      </div>
      <div className="mt-5 flex items-center gap-1">
        <Skeleton.Button active size="small" style={{ width: 60 }} />
        <Skeleton.Button active size="small" style={{ width: 80 }} />
        <Skeleton.Button active size="small" style={{ width: 70 }} />
      </div>
      <div className="mt-5 flex items-center gap-4">
        <Skeleton.Button active size="small" style={{ width: 100 }} />
        <Skeleton.Button active size="small" style={{ width: 100 }} />
      </div>
      <div className="mt-5">
        <Skeleton.Button active size="large" block style={{ height: 300 }} />
      </div>
    </div>
  );
};

export default MarketAnalysis;