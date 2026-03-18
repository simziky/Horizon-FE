/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useMemo, useCallback, useEffect } from "react"
import { LoadingOutlined } from "@ant-design/icons"
import {
  useLazyPriceHistoryQuery,
  useLazyProductSummaryQuery,
  useLazyRatingReviewQuery,
  useLazySalesRankQuery,
} from "@/redux/api/keepa"
import { useAppSelector } from "@/redux/hooks"
import KeepaLineChart, { type ChartLine, type AxisConfig } from "./KeepaLineChart"

/* ─── Module-level helpers (stable refs, no closure over component state) ── */

function formatUnits(value: number): string {
  return `${Math.round(value).toLocaleString()} units`
}

function formatDecimal(value: number, decimals = 1): string {
  return value.toFixed(decimals)
}

function abbreviateNumber(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1e9) return sign + (abs / 1e9).toFixed(1) + "B"
  if (abs >= 1e6) return sign + (abs / 1e6).toFixed(1) + "M"
  if (abs >= 1e3) return sign + (abs / 1e3).toFixed(1) + "K"
  return String(Math.round(value))
}

const TOOLTIP_CLASS =
  "bg-white p-3 border border-gray-200 rounded shadow-lg min-w-[130px] text-xs"

/* ─── Types ──────────────────────────────────────────────────────── */

interface Product {
  title: string
  asin: string
  category: string
  currentPrice: number
  salesRank: number
}

interface KeepaChartProps {
  product: Product
  isLoading: boolean
  asin: string
}

interface ChartDataPoint {
  date: string
  dateFormatted: string
  fullDate: string
  amazon: number | null
  buybox: number | null
  new: number | null
  rating: number | null
  rating_count: number | null
  new_offer_count: number | null
  [key: string]: number | null | string
}

/* ─── Constants ──────────────────────────────────────────────────── */

const TIME_RANGES = [
  { key: "7d",  label: "Week" },
  { key: "30d", label: "Month" },
  { key: "90d", label: "3 Months" },
  { key: "1y",  label: "Year" },
  { key: "all", label: "All" },
]
const CLOSE_UP_THRESHOLD = 0.75
const DAY_IN_MS = 86400000

/* ─── Component ──────────────────────────────────────────────────── */

export default function KeepaChart({ product, isLoading, asin }: KeepaChartProps) {
  const { marketplaceId } = useAppSelector((state) => state?.global)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isTimeRangeChanging, setIsTimeRangeChanging] = useState(false)

  /* Synchronized crosshair across all three charts */
  const [syncedTimestamp, setSyncedTimestamp] = useState<string | null>(null)

  /* ── API queries ─────────────────────────────────────────────── */
  const [getPriceHistory, { data: priceData, isLoading: priceLoading, error: priceError }] =
    useLazyPriceHistoryQuery()
  const [getProductSummary, { data: summaryData, isLoading: summaryLoading, error: summaryError }] =
    useLazyProductSummaryQuery()
  const [getRatingReview, { data: ratingData, isLoading: ratingLoading, error: ratingError }] =
    useLazyRatingReviewQuery()
  const [getSalesRank, { data: salesRankData, isLoading: salesRankLoading, error: salesRankError }] =
    useLazySalesRankQuery()
  const [getPriceHistoryAll, { data: priceDataAll, isLoading: priceLoadingAll, error: priceErrorAll }] =
    useLazyPriceHistoryQuery()

  /* ── Loading flags ───────────────────────────────────────────── */
  const isInitialLoading = useMemo(
    () =>
      isLoading ||
      (priceLoading && !priceData) ||
      (summaryLoading && !summaryData) ||
      (ratingLoading && !ratingData) ||
      (salesRankLoading && !salesRankData) ||
      (priceLoadingAll && !priceDataAll),
    [isLoading, priceLoading, priceData, summaryLoading, summaryData,
     ratingLoading, ratingData, salesRankLoading, salesRankData, priceLoadingAll, priceDataAll],
  )

  const isLoadingOverall = useMemo(
    () =>
      isLoading || priceLoading || summaryLoading || ratingLoading ||
      salesRankLoading || priceLoadingAll || isTimeRangeChanging,
    [isLoading, priceLoading, summaryLoading, ratingLoading,
     salesRankLoading, priceLoadingAll, isTimeRangeChanging],
  )

  /* ── Metric toggles ──────────────────────────────────────────── */
  const [priceMetrics, setPriceMetrics] = useState({ amazon: true, buybox: true, new: true })
  const [salesRankMetrics, setSalesRankMetrics] = useState<Record<string, boolean>>({})
  const [ratingMetrics, setRatingMetrics] = useState({
    rating: true,
    rating_count: true,
    new_offer_count: true,
  })

  /* ── Time range ──────────────────────────────────────────────── */
  const [universalTimeRange, setUniversalTimeRange] = useState("90d")
  const [priceCloseUpView, setPriceCloseUpView] = useState(false)
  const [salesRankCloseUpView, setSalesRankCloseUpView] = useState(false)
  const [ratingCloseUpView, setRatingCloseUpView] = useState(false)

  /* ── Error handling ──────────────────────────────────────────── */
  useEffect(() => {
    const errors = [priceError, summaryError, ratingError, salesRankError, priceErrorAll].filter(Boolean)
    if (errors.length > 0) setFetchError("Failed to load chart data. Please try again later.")
  }, [priceError, summaryError, ratingError, salesRankError, priceErrorAll])

  /* ── Fetch on ASIN / time range change ───────────────────────── */
  useEffect(() => {
    if (!asin || !marketplaceId) return
    setFetchError(null)

    const getRatingPeriod = (range: string): string => {
      switch (range) {
        case "7d": return "week"
        case "30d": return "month"
        case "90d": return "3months"
        default: return "all"
      }
    }

    Promise.all([
      getPriceHistory({ asin, id: marketplaceId, period: universalTimeRange }),
      getProductSummary({ asin, id: marketplaceId }),
      getRatingReview({ asin, id: marketplaceId, period: getRatingPeriod(universalTimeRange) }),
      getSalesRank({ asin, id: marketplaceId, period: universalTimeRange }),
      getPriceHistoryAll({ asin, id: marketplaceId, period: "all" }),
    ])
      .then(() => setIsTimeRangeChanging(false))
      .catch(() => {
        setFetchError("Failed to load data. Please try again.")
        setIsTimeRangeChanging(false)
      })
  }, [asin, marketplaceId, universalTimeRange,
    getPriceHistory, getProductSummary, getRatingReview, getSalesRank, getPriceHistoryAll])

  /* Initialise salesRankMetrics when data arrives */
  useEffect(() => {
    if (salesRankData?.data?.sales_rank?.sales_rank_data) {
      setSalesRankMetrics((prev) => {
        const next = { ...prev }
        Object.keys(salesRankData.data.sales_rank.sales_rank_data).forEach((key) => {
          if (next[key] === undefined) next[key] = true
        })
        return next
      })
    }
  }, [salesRankData])

  /* ── Date formatters (one instance per time range) ───────────── */
  const shortDateFmt = useMemo(() => {
    if (universalTimeRange === "7d")
      return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric" })
    if (universalTimeRange === "1y" || universalTimeRange === "all")
      return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric", year: "2-digit" })
    return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" })
  }, [universalTimeRange])

  const fullDateFmt = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    [],
  )

  /* ── Chart data: unify all API sources into one timeline ─────── */
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!priceData?.data?.price_history) return []

    const priceHistory = priceData.data.price_history.price_types
    const salesRankHistory = salesRankData?.data?.sales_rank?.sales_rank_data || {}
    const ratingHistory = ratingData?.data?.chart_data || {}

    /* 1. Collect all unique timestamps */
    const allTimestamps = new Set<string>()

    Object.values(priceHistory).forEach((pt: any) => {
      if (pt.data) Object.keys(pt.data).forEach((ts) => allTimestamps.add(ts))
    })

    Object.entries(salesRankHistory).forEach(([key, rt]: [string, any]) => {
      if (!rt.data) return
      if (key === "monthly_sold") {
        Object.keys(rt.data).forEach((ts) => allTimestamps.add(ts))
      } else if (Array.isArray(rt.data)) {
        rt.data.forEach((e: any) => allTimestamps.add(e.date))
      } else {
        Object.keys(rt.data).forEach((ts) => allTimestamps.add(ts))
      }
    })

    Object.values(ratingHistory).forEach((ri: any) => {
      if (!ri?.data) return
      if (Array.isArray(ri.data)) {
        ri.data.forEach((e: any) => allTimestamps.add(e.date))
      } else {
        Object.keys(ri.data).forEach((ts) => allTimestamps.add(ts))
      }
    })

    /* 2. Pre-index array-format data into Maps → O(1) lookup vs O(n) .find() */
    const salesRankMaps: Record<string, Map<string, any>> = {}
    Object.entries(salesRankHistory).forEach(([key, rt]: [string, any]) => {
      if (Array.isArray(rt?.data)) {
        const m = new Map<string, any>()
        rt.data.forEach((e: any) => m.set(e.date, e))
        salesRankMaps[key] = m
      }
    })

    const ratingMaps: Record<string, Map<string, any>> = {}
    Object.keys(ratingHistory).forEach((key) => {
      const ri = ratingHistory[key]
      if (ri?.data && Array.isArray(ri.data)) {
        const m = new Map<string, any>()
        ri.data.forEach((e: any) => m.set(e.date, e))
        ratingMaps[key] = m
      }
    })

    /* 3. Sort timestamps and build ChartDataPoint for each */
    const sortedTimestamps = Array.from(allTimestamps).sort()

    return sortedTimestamps
      .map((timestamp) => {
        const date = new Date(timestamp)
        const validDate = !isNaN(date.getTime())

        /* Price data */
        const amazon = priceHistory.amazon?.data?.[timestamp]?.price ?? null
        const buybox = priceHistory.buybox?.data?.[timestamp]?.price ?? null
        const newPrice = priceHistory.new?.data?.[timestamp]?.price ?? null

        /* Sales rank data (dynamic keys) */
        const salesRankPoint: Record<string, number | null> = {}
        Object.keys(salesRankHistory).forEach((key) => {
          if (key === "main_bsr") {
            salesRankPoint[key] = salesRankHistory[key]?.data?.[timestamp]?.rank ?? null
          } else if (key.startsWith("category_")) {
            salesRankPoint[key] = salesRankMaps[key]?.get(timestamp)?.rank ?? null
          } else if (key === "monthly_sold") {
            salesRankPoint[key] = salesRankHistory[key]?.data?.[timestamp]?.value ?? null
          }
        })

        /* Rating data (dynamic keys) */
        const ratingPoint: Record<string, number | null> = {}
        Object.keys(ratingHistory).forEach((key) => {
          const ri = ratingHistory[key]
          if (!ri?.data) return
          if (Array.isArray(ri.data)) {
            ratingPoint[key] = ratingMaps[key]?.get(timestamp)?.value ?? null
          } else {
            // Object format — find entry within ±1 day
            const entry = validDate
              ? (Object.values(ri.data).find(
                  (item: any) => Math.abs(new Date(item.date).getTime() - date.getTime()) < DAY_IN_MS,
                ) as any)
              : null
            ratingPoint[key] = entry?.value ?? null
          }
        })

        return {
          date: timestamp,
          dateFormatted: validDate ? shortDateFmt.format(date) : timestamp,
          fullDate: validDate ? fullDateFmt.format(date) : timestamp,
          amazon,
          buybox,
          new: newPrice,
          rating: summaryData?.data?.current_data?.rating || 4.0,
          ...salesRankPoint,
          ...ratingPoint,
        } as ChartDataPoint
      })
      .filter(
        (item) =>
          item.amazon !== null ||
          item.buybox !== null ||
          item.new !== null ||
          Object.keys(salesRankHistory).some((k) => (item as any)[k] !== null) ||
          Object.keys(ratingHistory).some((k) => (item as any)[k] !== null),
      )
  }, [priceData, salesRankData, ratingData, summaryData, shortDateFmt, fullDateFmt])

  /* Available price types list */
  const availablePriceTypes: string[] = useMemo(
    () => priceData?.data?.price_history?.summary?.available_types || [],
    [priceData],
  )

  /* ── Filtered (close-up) data — memoized per chart ───────────── */
  const priceChartData = useMemo(() => {
    if (!priceCloseUpView || chartData.length === 0) return chartData
    return chartData.slice(Math.max(0, Math.floor(chartData.length * (1 - CLOSE_UP_THRESHOLD))))
  }, [priceCloseUpView, chartData])

  const salesRankChartData = useMemo(() => {
    if (!salesRankCloseUpView || chartData.length === 0) return chartData
    return chartData.slice(Math.max(0, Math.floor(chartData.length * (1 - CLOSE_UP_THRESHOLD))))
  }, [salesRankCloseUpView, chartData])

  const ratingChartData = useMemo(() => {
    if (!ratingCloseUpView || chartData.length === 0) return chartData
    return chartData.slice(Math.max(0, Math.floor(chartData.length * (1 - CLOSE_UP_THRESHOLD))))
  }, [ratingCloseUpView, chartData])

  /* ── Line configs for each chart ─────────────────────────────── */
  const priceLines: ChartLine[] = useMemo(() => {
    const pt = priceData?.data?.price_history?.price_types
    return [
      { key: "new",    name: "New",     color: pt?.new?.color    ?? "#45B7D1", visible: priceMetrics.new,    pixelOffset: -3 },
      { key: "buybox", name: "Buy Box", color: pt?.buybox?.color ?? "#4ECDC4", visible: priceMetrics.buybox, pixelOffset:  0 },
      { key: "amazon", name: "Amazon",  color: pt?.amazon?.color ?? "#FF6B6B", visible: priceMetrics.amazon, pixelOffset:  3 },
    ]
  }, [priceData, priceMetrics])

  const salesRankLines: ChartLine[] = useMemo(() => {
    const srData = salesRankData?.data?.sales_rank?.sales_rank_data
    if (!srData) return []
    return Object.entries(srData).map(([key, rd]: [string, any]) => ({
      key,
      name: rd.label,
      color: rd.color,
      yAxis: key === "monthly_sold" ? ("left" as const) : ("right" as const),
      visible: salesRankMetrics[key] !== false,
    }))
  }, [salesRankData, salesRankMetrics])

  const ratingLines: ChartLine[] = useMemo(() => {
    const cd = ratingData?.data?.chart_data
    return [
      {
        key: "rating_count",
        name: "Rating Count",
        color: cd?.rating_count?.color ?? "#8884d8",
        yAxis: "left" as const,
        visible: ratingMetrics.rating_count,
      },
      {
        key: "new_offer_count",
        name: "New Offer Count",
        color: cd?.new_offer_count?.color ?? "#ffc658",
        yAxis: "left" as const,
        visible: ratingMetrics.new_offer_count,
      },
      {
        key: "rating",
        name: "Rating",
        color: cd?.rating?.color ?? "#82ca9d",
        yAxis: "right" as const,
        visible: ratingMetrics.rating,
      },
    ]
  }, [ratingData, ratingMetrics])

  /* ── Axis configs ────────────────────────────────────────────── */
  const priceLeftAxis: AxisConfig = useMemo(
    () => ({ formatter: (v) => `$${v.toFixed(0)}` }),
    [],
  )
  const salesRankLeftAxis: AxisConfig = useMemo(
    () => ({ formatter: abbreviateNumber }),
    [],
  )
  const salesRankRightAxis: AxisConfig = useMemo(
    () => ({ formatter: (v) => `#${abbreviateNumber(v)}`, reversed: true }),
    [],
  )
  const ratingRightAxis: AxisConfig = useMemo(
    () => ({ formatter: (v) => v.toFixed(1), domain: [0, 5] as [number, number] }),
    [],
  )

  /* ── Synced crosshair handlers ────────────────────────────────── */
  const handleChartMouseMove = useCallback((xVal: string | null) => {
    setSyncedTimestamp(xVal)
  }, [])

  const handleChartMouseLeave = useCallback(() => {
    setSyncedTimestamp(null)
  }, [])

  /* ── Time range handler ─────────────────────────────────────── */
  const handleTimeRangeChange = useCallback((newRange: string) => {
    setIsTimeRangeChanging(true)
    setUniversalTimeRange(newRange)
    setSyncedTimestamp(null)
  }, [])

  /* ── x-axis tick formatter ───────────────────────────────────── */
  const xTickFormatter = useCallback(
    (ts: string) => {
      const d = new Date(ts)
      return isNaN(d.getTime()) ? ts : shortDateFmt.format(d)
    },
    [shortDateFmt],
  )

  /* ── Tooltip content builders ────────────────────────────────── */
  const priceTooltip = useCallback(
    (point: Record<string, unknown>) => (
      <div className={TOOLTIP_CLASS}>
        <p className="font-medium text-gray-800 mb-1">{point.fullDate as string}</p>
        {priceLines
          .filter((l) => l.visible && point[l.key] !== null && point[l.key] !== undefined)
          .map((l) => (
            <p key={l.key} style={{ color: l.color }}>
              {l.name}: ${Number(point[l.key]).toFixed(2)}
            </p>
          ))}
      </div>
    ),
    [priceLines],
  )

  const salesRankTooltip = useCallback(
    (point: Record<string, unknown>) => (
      <div className={TOOLTIP_CLASS}>
        <p className="font-medium text-gray-800 mb-1">{point.fullDate as string}</p>
        {salesRankLines
          .filter((l) => l.visible && point[l.key] !== null && point[l.key] !== undefined)
          .map((l) => {
            const v = point[l.key] as number
            return (
              <p key={l.key} style={{ color: l.color }}>
                {l.name}:{" "}
                {l.key === "monthly_sold"
                  ? formatUnits(v)
                  : `#${Math.round(v).toLocaleString()}`}
              </p>
            )
          })}
      </div>
    ),
    [salesRankLines],
  )

  const ratingTooltip = useCallback(
    (point: Record<string, unknown>) => (
      <div className={TOOLTIP_CLASS}>
        <p className="font-medium text-gray-800 mb-1">{point.fullDate as string}</p>
        {ratingLines
          .filter((l) => l.visible && point[l.key] !== null && point[l.key] !== undefined)
          .map((l) => {
            const v = point[l.key] as number
            return (
              <p key={l.key} style={{ color: l.color }}>
                {l.name}:{" "}
                {l.key === "rating"
                  ? formatDecimal(v)
                  : Math.round(v).toLocaleString()}
              </p>
            )
          })}
      </div>
    ),
    [ratingLines],
  )

  /* ── Initial loading skeleton ────────────────────────────────── */
  if (isInitialLoading) {
    return (
      <div className="border border-border rounded-xl p-6 bg-white">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  /* ─── Sub-components (defined here to close over local state) ── */

  const UniversalTimeController = () => (
    <div className="px-6 py-3 border-b border-border bg-[#FAFAFA] flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-[#01011D]">Time Range:</span>
        <div className="flex items-center gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              onClick={() => handleTimeRangeChange(range.key)}
              disabled={isLoadingOverall}
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                universalTimeRange === range.key
                  ? "bg-primary text-white"
                  : "bg-white text-[#787891] hover:bg-gray-100"
              } ${isLoadingOverall ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label={`Set time range to ${range.label}`}
            >
              {isLoadingOverall && universalTimeRange === range.key && (
                <LoadingOutlined spin style={{ fontSize: "12px" }} />
              )}
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div className="text-xs text-[#787891] flex items-center gap-2">
        {isLoadingOverall && (
          <div className="flex items-center gap-1">
            <LoadingOutlined spin style={{ fontSize: "12px" }} />
            <span>Loading...</span>
          </div>
        )}
        <span>
          Total Price Types: {priceData?.data?.price_history?.summary?.total_price_types || 0} | Data Points:{" "}
          {chartData.length}
        </span>
      </div>
    </div>
  )

  const ChartCloseUpToggle = ({
    closeUpView,
    onToggle,
    title,
  }: {
    closeUpView: boolean
    onToggle: (enabled: boolean) => void
    title: string
  }) => (
    <div className="px-4 py-2 bg-[#FAFAFA] border-b border-border flex items-center justify-between">
      <span className="text-sm font-medium text-[#01011D]">{title}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#787891]">Close-up view</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={closeUpView}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
            aria-label={`Toggle close-up view for ${title}`}
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
    </div>
  )

  const PriceChartController = () => (
    <div className="w-40 border-l border-border bg-[#FAFAFA] p-2">
      <h4 className="font-semibold text-xs text-[#01011D] mb-1">Price Types</h4>
      <div className="space-y-1">
        {availablePriceTypes.map((priceType: any) => {
          const priceTypeData = priceData?.data?.price_history?.price_types?.[priceType]
          if (!priceTypeData) return null
          return (
            <div
              key={priceType}
              className={`flex items-center gap-1 p-1 rounded cursor-pointer transition-colors ${
                priceMetrics[priceType as keyof typeof priceMetrics] ? "bg-white shadow-sm" : "hover:bg-white"
              }`}
              onClick={() =>
                setPriceMetrics((prev) => ({ ...prev, [priceType]: !prev[priceType as keyof typeof prev] }))
              }
              aria-label={`Toggle ${priceTypeData.label} visibility`}
            >
              <div
                className="w-3 h-3 rounded border"
                style={{
                  backgroundColor: priceMetrics[priceType as keyof typeof priceMetrics]
                    ? priceTypeData.color
                    : "transparent",
                  borderColor: priceTypeData.color,
                }}
              />
              <span className="text-xs flex-1">{priceTypeData.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const SalesRankController = () => (
    <div className="w-40 border-l border-border bg-[#FAFAFA] p-2">
      <h4 className="font-semibold text-xs text-[#01011D] mb-1">Sales Rank & Volume</h4>
      <div className="space-y-1">
        {Object.entries(salesRankData?.data?.sales_rank?.sales_rank_data || {}).map(
          ([key, rankData]: [string, any]) => (
            <div
              key={key}
              className={`flex items-center gap-1 p-1 rounded cursor-pointer transition-colors ${
                salesRankMetrics[key] ? "bg-white shadow-sm" : "hover:bg-white"
              }`}
              onClick={() => setSalesRankMetrics((prev) => ({ ...prev, [key]: !prev[key] }))}
              aria-label={`Toggle ${rankData.label} visibility`}
            >
              <div
                className="w-3 h-3 rounded border"
                style={{
                  backgroundColor: salesRankMetrics[key] ? rankData.color : "transparent",
                  borderColor: rankData.color,
                }}
              />
              <span className="text-xs flex-1">{rankData.label}</span>
            </div>
          ),
        )}
      </div>
    </div>
  )

  const RatingController = () => (
    <div className="w-40 border-l border-border bg-[#FAFAFA] p-2">
      <h4 className="font-semibold text-xs text-[#01011D] mb-1">Rating & Reviews</h4>
      <div className="space-y-1">
        {Object.entries(ratingData?.data?.chart_data || {}).map(([key, ratingDataItem]: [string, any]) => {
          if (!ratingDataItem.label) return null
          return (
            <div
              key={key}
              className={`flex items-center gap-1 p-1 rounded cursor-pointer transition-colors ${
                ratingMetrics[key as keyof typeof ratingMetrics] ? "bg-white shadow-sm" : "hover:bg-white"
              }`}
              onClick={() =>
                setRatingMetrics((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
              }
              aria-label={`Toggle ${ratingDataItem.label} visibility`}
            >
              <div
                className="w-3 h-3 rounded border"
                style={{
                  backgroundColor: ratingMetrics[key as keyof typeof ratingMetrics]
                    ? ratingDataItem.color
                    : "transparent",
                  borderColor: ratingDataItem.color,
                }}
              />
              <span className="text-xs flex-1">{ratingDataItem.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg text-[#01011D] mb-1">
              {priceData?.data?.product?.name || product.title}
            </h3>
            <p className="text-sm text-[#787891]">
              ASIN: {priceData?.data?.product?.asin || product.asin} | Marketplace:{" "}
              {priceData?.data?.product?.marketplace_id || "N/A"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-[#787891]">Current Price: </span>
              <span className="font-semibold text-[#01011D]">
                {priceData?.data?.price_history?.price_types?.buybox?.current_price
                  ? `$${priceData.data.price_history.price_types.buybox.current_price}`
                  : `$${product.currentPrice}`}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-[#787891]">Sales Rank: </span>
              <span className="font-semibold text-[#01011D]">
                #{salesRankData?.data?.sales_rank?.sales_rank_data?.main_bsr?.current_rank || product.salesRank}
              </span>
            </div>
          </div>
        </div>
      </div>

      <UniversalTimeController />

      {fetchError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3" role="alert">
          <strong className="font-bold">Error! </strong>
          <span>{fetchError}</span>
        </div>
      )}

      <div className="p-6 space-y-4">

        {/* ── Price History Chart ─────────────────────────────── */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative border border-gray-200 rounded bg-white overflow-hidden">
              <ChartCloseUpToggle
                closeUpView={priceCloseUpView}
                onToggle={setPriceCloseUpView}
                title="Price History"
              />
              <div className="relative" style={{ height: 300 }}>
                {isLoadingOverall && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <LoadingOutlined spin />
                      Loading chart data...
                    </div>
                  </div>
                )}
                <KeepaLineChart
                  data={priceChartData as Record<string, unknown>[]}
                  xKey="date"
                  lines={priceLines}
                  leftAxis={priceLeftAxis}
                  xFormatter={xTickFormatter}
                  height={288}
                  syncedX={syncedTimestamp}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                  tooltipContent={priceTooltip}
                />
              </div>
            </div>
          </div>
          <PriceChartController />
        </div>

        {/* ── Sales Rank & Volume Chart ───────────────────────── */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative border border-gray-200 rounded bg-white overflow-hidden">
              <ChartCloseUpToggle
                closeUpView={salesRankCloseUpView}
                onToggle={setSalesRankCloseUpView}
                title="Sales Rank & Volume"
              />
              <div className="relative" style={{ height: 300 }}>
                {isLoadingOverall && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <LoadingOutlined spin />
                      Loading chart data...
                    </div>
                  </div>
                )}
                <KeepaLineChart
                  data={salesRankChartData as Record<string, unknown>[]}
                  xKey="date"
                  lines={salesRankLines}
                  leftAxis={salesRankLeftAxis}
                  rightAxis={salesRankRightAxis}
                  xFormatter={xTickFormatter}
                  height={288}
                  syncedX={syncedTimestamp}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                  tooltipContent={salesRankTooltip}
                />
              </div>
            </div>
          </div>
          <SalesRankController />
        </div>

        {/* ── Rating & Reviews Chart ──────────────────────────── */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative border border-gray-200 rounded bg-white overflow-hidden">
              <ChartCloseUpToggle
                closeUpView={ratingCloseUpView}
                onToggle={setRatingCloseUpView}
                title="Rating & Reviews"
              />
              <div className="relative" style={{ height: 300 }}>
                {isLoadingOverall && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <LoadingOutlined spin />
                      Loading chart data...
                    </div>
                  </div>
                )}
                <KeepaLineChart
                  data={ratingChartData as Record<string, unknown>[]}
                  xKey="date"
                  lines={ratingLines}
                  leftAxis={{ formatter: (v) => Math.round(v).toLocaleString() }}
                  rightAxis={ratingRightAxis}
                  xFormatter={xTickFormatter}
                  height={260}
                  syncedX={syncedTimestamp}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={handleChartMouseLeave}
                  tooltipContent={ratingTooltip}
                />
              </div>
            </div>
          </div>
          <RatingController />
        </div>

        {/* Chart footer */}
        <div className="mt-4 text-xs text-[#787891]">
          <div className="flex items-center gap-4 mt-2">
            <span>Current BSR: #{salesRankData?.data?.sales_rank?.sales_rank_data?.main_bsr?.current_value || "N/A"}</span>
            <span>Best: #{salesRankData?.data?.sales_rank?.sales_rank_data?.main_bsr?.best_value || "N/A"}</span>
            <span>Worst: #{salesRankData?.data?.sales_rank?.sales_rank_data?.main_bsr?.worst_value || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="p-6 border-t border-border bg-[#FAFAFA]">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-[#787891] mb-1">Category Sales Ranks</p>
            <div className="space-y-1">
              {summaryData?.data?.category_sales_ranks?.slice(0, 2).map((category: any, index: number) => (
                <div key={category.name} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded bg-green-${500 + index * 100}`}></span>
                  <span className="text-[#01011D] text-xs">{category.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[#787891] mb-1">Current Data</p>
            <div className="space-y-1 text-xs">
              <p>Rating: {summaryData?.data?.current_data?.rating?.toFixed(1) || "N/A"}</p>
            </div>
          </div>

          <div>
            <p className="text-[#787891] mb-1">Price Range</p>
            <div className="space-y-1 text-xs">
              <p>High: {summaryData?.data?.price_range?.currency || "$"}{summaryData?.data?.price_range?.high || "N/A"}</p>
              <p>Low: {summaryData?.data?.price_range?.currency || "$"}{summaryData?.data?.price_range?.low || "N/A"}</p>
              <p>Current: {summaryData?.data?.price_range?.currency || "$"}{summaryData?.data?.price_range?.current || "N/A"}</p>
            </div>
          </div>

          <div>
            <p className="text-[#787891] mb-1">Listing Age</p>
            <div className="space-y-1 text-xs">
              <p>
                {(() => {
                  const priceHistoryAll = priceDataAll?.data?.price_history?.price_types
                  if (!priceHistoryAll) return "N/A"
                  const allTs = new Set<string>()
                  Object.values(priceHistoryAll).forEach((pt: any) => {
                    if (pt.data) Object.keys(pt.data).forEach((ts) => allTs.add(ts))
                  })
                  if (allTs.size === 0) return "N/A"
                  const earliest = Array.from(allTs).sort()[0]
                  const diff = Math.ceil(Math.abs(Date.now() - new Date(earliest).getTime()) / 86400000)
                  const years = Math.floor(diff / 365)
                  const months = Math.floor((diff % 365) / 30)
                  const days = diff % 30
                  if (years > 0) return months > 0 ? `${years}y ${months}m` : `${years}y ${days}d`
                  if (months > 0) return days > 0 ? `${months}m ${days}d` : `${months}m`
                  return `${days}d`
                })()}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">{summaryData?.data?.metadata?.timestamp || "N/A"}</p>
            {isLoadingOverall && (
              <div className="flex items-center gap-1 justify-end mt-1">
                <LoadingOutlined spin style={{ fontSize: "12px" }} />
                <span className="text-xs text-blue-600">Updating...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
