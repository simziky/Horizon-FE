import type React from "react"
import { CheckCircle, ShoppingCart, Star, PieChart } from "lucide-react"



interface ScoreBreakdownItem {
  label: string
  value: number
  max: number
  percentage: number
}



interface ProductAnalysisProps {
  productName?: string
  subtitle?: string
  overallScore?: number
  rating?: string
  metrics?: {
    roi?: string
    profitMargin?: string
    monthlySales?: number
    estimatedRevenue?: string
    isProfitable?: boolean
  }
  scoreBreakdown?: ScoreBreakdownItem[]
  status?: {
    isProfitable?: boolean
    platform?: string
    rating?: string
    reviewCount?: number
  }
}

export default function ProductAnalysisCard({
  productName = "Example Product Name",
  subtitle = "Detailed product analysis report",
  overallScore = 8.0,
  rating = "Excellent",
  metrics = {
    roi: "55.75%",
    profitMargin: "35.12%",
    monthlySales: 1500,
    estimatedRevenue: "$15,000",
    isProfitable: true,
  },
  scoreBreakdown = [
    { label: "Profitability", value: 3.0, max: 3, percentage: 100 },
    { label: "Estimated Demand", value: 2.0, max: 3, percentage: 66.7 },
    { label: "Buy Box Eligible", value: 1.0, max: 3, percentage: 33.3 },
    { label: "Sales Rank Impact", value: 1.0, max: 3, percentage: 33.3 },
    { label: "FBA Sellers", value: 1.0, max: 3, percentage: 33.3 },
    { label: "Amazon on Listing", value: 0.5, max: 3, percentage: 16.7 },
    { label: "Variation Listing", value: 0.0, max: 3, percentage: 0 },
    { label: "Offer Count", value: 0.5, max: 3, percentage: 16.7 },
  ],
  status = {
    isProfitable: true,
    platform: "Other Marketplace",
    rating: "0",
    reviewCount: 850,
  },
}: ProductAnalysisProps) {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold mb-1 max-w-[500px]">{productName}</h3>
            <p className="text-green-50 text-sm">{subtitle}</p>
          </div>
          <div className="text-center bg-white/20 py-3 px-5 rounded-full">
            <span className="block text-base font-bold leading-none">{overallScore.toFixed(1)}/10</span>
            <span className="text-xs">{rating}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <span className="block text-sm text-gray-600 mb-2">ROI</span>
            <span className="text-2xl font-bold text-green-600">{metrics.roi}</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <span className="block text-sm text-gray-600 mb-2">Profit Margin</span>
            <span className="text-2xl font-bold text-green-600">{metrics.profitMargin}</span>
            {metrics.isProfitable && (
              <div className="flex items-center justify-center mt-2">
                <span className="w-2.5 h-2.5 bg-green-600 rounded-full mr-2"></span>
                <span className="text-sm">Profitable</span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <span className="block text-sm text-gray-600 mb-2">Monthly Sales</span>
            <span className="text-2xl font-bold text-gray-900">{metrics.monthlySales?.toLocaleString()}</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            <span className="block text-sm text-gray-600 mb-2">Estimated Revenue</span>
            <span className="text-2xl font-bold text-gray-900">{metrics.estimatedRevenue}</span>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="px-6 pb-6">
          <h4 className="text-gray-800 text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Score Breakdown
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scoreBreakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 min-w-[140px]">{item.label}</span>
                <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(item.percentage, item.value > 0 ? 2 : 0)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-800 font-medium min-w-[50px] text-right">
                  {item.value.toFixed(1)}/{item.max}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Status */}
        <div className="flex flex-wrap gap-3 p-6 bg-gray-50 border-t border-gray-200">
          {status.isProfitable && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Profitable: Yes</span>
            </div>
          )}

          {status.platform && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
              <ShoppingCart className="w-4 h-4" />
              <span>Platform: {status.platform}</span>
            </div>
          )}

          {status.rating !== undefined && status.reviewCount !== undefined && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm">
              <Star className="w-4 h-4" fill="currentColor" />
              <span>
                Rating: {status.rating} ⭐ ({status.reviewCount} reviews)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}