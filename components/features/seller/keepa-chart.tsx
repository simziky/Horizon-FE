import { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { useLazyPriceHistoryQuery } from "@/redux/api/keepa";
import { useAppSelector } from "@/redux/hooks";
import { LoadingOutlined } from "@ant-design/icons";

interface ChartDataPoint {
  date: string;
  price: number;
}

interface ChartRangeData {
  amazon?: ChartDataPoint[];
  sales_rank?: ChartDataPoint[];
  new_fba?: ChartDataPoint[];
}

export interface ChartData {
  [key: string]: ChartRangeData | undefined;
}

interface KeepaChartProps {
  chartData?: ChartData | null;
  currency?: string;
  asin?: string; // Add ASIN prop for API calls
  index?: number;
}

interface ProcessedChartDataPoint {
  date: string;
  dateFormatted: string;
  fullDate: string;
  amazon: number | null;
  buybox: number | null;
  new: number | null;
}



const KeepaChart = ({ chartData, currency = "", asin, index }: KeepaChartProps) => {
  const { marketplaceId } = useAppSelector((state) => state?.global);
  const timeRange = "30"; // Fixed at 30 days
  const [isTimeRangeChanging, setIsTimeRangeChanging] = useState(false);
  
  // API hook for price history
  const [getPriceHistory, { data: priceHistoryData, isLoading: priceHistoryLoading }] = useLazyPriceHistoryQuery();

  // Fallback function for legacy data
  const transformData = () => {
    if (!chartData) return [];

    const rangeData = chartData[timeRange];
    if (!rangeData) return [];

    const amazonData = rangeData.amazon || [];
    const salesRankData = rangeData.sales_rank || [];
    const newFBAData = rangeData.new_fba || [];

    const allDates = [
      ...amazonData.map((d: ChartDataPoint) => d.date),
      ...salesRankData.map((d: ChartDataPoint) => d.date),
      ...newFBAData.map((d: ChartDataPoint) => d.date),
    ];

    const uniqueDates = [...new Set(allDates)].sort();

    return uniqueDates.map((date) => {
      const formatDate = () => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
        });
      };

      return {
        date,
        dateFormatted: formatDate(),
        fullDate: new Date(date).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        amazon: amazonData.find((d: ChartDataPoint) => d.date === date)?.price || null,
        buybox: null, // Legacy data doesn't have buybox
        new: newFBAData.find((d: ChartDataPoint) => d.date === date)?.price || null,
      };
    });
  };

  // Fetch price history data when ASIN and marketplace changes
  useEffect(() => {
    if (asin && marketplaceId) {
      setIsTimeRangeChanging(true);
      
      getPriceHistory({
        asin,
        id: marketplaceId,
        period: "30d",
      }).finally(() => {
        setIsTimeRangeChanging(false);
      });
    }
  }, [asin, marketplaceId, getPriceHistory]);

  // Process API data for chart display
  const processedChartData: ProcessedChartDataPoint[] = useMemo(() => {
    if (!priceHistoryData?.data?.price_history?.price_types) {
      return transformData(); // Fallback to old data
    }

    const priceHistory = priceHistoryData.data.price_history.price_types;
    const amazonData = priceHistory.amazon?.data || {};
    const buyboxData = priceHistory.buybox?.data || {};
    const newData = priceHistory.new?.data || {};

    // Get all unique timestamps from all price types
    const allTimestamps = new Set<string>();
    Object.keys(amazonData).forEach(timestamp => allTimestamps.add(timestamp));
    Object.keys(buyboxData).forEach(timestamp => allTimestamps.add(timestamp));
    Object.keys(newData).forEach(timestamp => allTimestamps.add(timestamp));

    const sortedTimestamps = Array.from(allTimestamps).sort();

    return sortedTimestamps.map((timestamp) => {
      const date = new Date(timestamp);
      
      const formatDate = () => {
        return date.toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
        });
      };

      const amazonPrice = amazonData[timestamp]?.price ?? null;
      const buyboxPrice = buyboxData[timestamp]?.price ?? null;
      const newPrice = newData[timestamp]?.price ?? null;

      return {
        date: timestamp,
        dateFormatted: formatDate(),
        fullDate: date.toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        amazon: amazonPrice,
        buybox: buyboxPrice,
        new: newPrice,
      };
    }).filter(item => item.amazon !== null || item.buybox !== null || item.new !== null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceHistoryData, timeRange, chartData]);

  const finalChartData = priceHistoryData ? processedChartData : transformData();
  const isLoading = priceHistoryLoading || isTimeRangeChanging;

  // Determine which lines to show based on data availability
  const hasAmazonData = finalChartData.some(item => item.amazon !== null);
  const hasBuyboxData = finalChartData.some(item => item.buybox !== null);
  const hasNewData = finalChartData.some(item => item.new !== null);

  // Debug logging for new marketplace data
  

  // Custom tooltip component
  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: number | null;
      color: string;
      name: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const dataPoint = finalChartData.find((d) => d.dateFormatted === label);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium text-gray-800 mb-2">
            {dataPoint?.fullDate || label}
          </p>
          {payload.map((entry, index: number) => {
            if (entry.value === null || entry.value === undefined) return null;
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {currency}{Number(entry.value).toFixed(2)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (!finalChartData.length && !isLoading) {
    return (
      <div className="rounded-xl border border-border h-full flex flex-col bg-white">
        <div className="p-4 flex-shrink-0 flex items-center justify-between">
          <p className="bg-[#F3F4F6] rounded-2xl py-2 px-4 text-[#676A75] font-semibold w-max text-xs">
            Keepa(beta)
          </p>
          {index === 0 && asin && (
            <button
              onClick={() => window.open(`/keepa?asin=${asin}`, '_blank', 'noopener,noreferrer')}
              className="bg-primary text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              View keepa
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No chart data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border h-full flex flex-col">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
        <div className="p-4 flex-shrink-0 flex items-center justify-between">
          <p className="bg-[#F3F4F6] rounded-2xl py-2 px-4 text-[#676A75] font-semibold w-max text-xs">
            Keepa(beta)
          </p>
          {index === 0 && asin && (
            <button
              onClick={() => window.open(`/keepa?asin=${asin}`, '_blank', 'noopener,noreferrer')}
              className="bg-primary text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              View keepa
            </button>
          )}
        </div>

        <div className="relative flex-1 min-h-0">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <LoadingOutlined spin />
                Loading chart data...
              </div>
            </div>
          )}
          
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={finalChartData}
              margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dateFormatted"
                tickFormatter={(date) => date}
                tick={{ fontSize: 10 }}
                interval={Math.max(1, Math.floor(finalChartData.length / 6))}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              
              {/* Amazon Price Line - show if available */}
              {hasAmazonData && (
                <Line
                  type="monotone"
                  dataKey="amazon"
                  stroke="#FF6B6B"
                  strokeWidth={2}
                  dot={false}
                  name="AMAZON"
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              )}
              
              {/* Buybox Price Line - show if available */}
              {hasBuyboxData && (
                <Line
                  type="monotone"
                  dataKey="buybox"
                  stroke="#4ECDC4"
                  strokeWidth={2}
                  dot={false}
                  name="BUYBOX"
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              )}
              
              {/* New Marketplace Line - show if data is available */}
              {hasNewData && (
                <Line
                  type="monotone"
                  dataKey="new"
                  stroke="#45B7D1"
                  strokeWidth={2}
                  dot={false}
                  name="NEW"
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default KeepaChart;

