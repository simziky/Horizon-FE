"use client"

interface SelectedMetrics {
  buyBox: boolean
  amazon: boolean
  new: boolean
  newThirdPartyFBM: boolean
  newPrimeExclusive: boolean
  salesRank: boolean
  rating: boolean
  ratingCount: boolean
  newOfferCount: boolean
}

interface KeepaLegendProps {
  selectedMetrics: SelectedMetrics
  onMetricToggle: (metric: string) => void
}

const legendItems = [
  { key: 'buyBox', label: 'Buy Box', color: '#FF6B35', icon: '🔶' },
  { key: 'amazon', label: 'Amazon', color: '#FFA500', icon: '🟠' },
  { key: 'new', label: 'New', color: '#4169E1', icon: '🔵' },
  { key: 'newThirdPartyFBM', label: 'New, 3rd Party FBM', color: '#32CD32', icon: '🟢' },
  { key: 'newPrimeExclusive', label: 'New, Prime exclusive', color: '#800080', icon: '🟣' },
  { key: 'salesRank', label: 'Sales Rank', color: '#90EE90', icon: '📈', subRanks: true },
  { key: 'rating', label: 'Rating', color: '#20B2AA', icon: '⭐' },
  { key: 'ratingCount', label: 'Rating Count', color: '#FFD700', icon: '👥' },
  { key: 'newOfferCount', label: 'New Offer Count', color: '#8A2BE2', icon: '🛒' }
]

export default function KeepaLegend({ selectedMetrics, onMetricToggle }: KeepaLegendProps) {
  return (
    <div className="w-80 border-l border-border bg-[#FAFAFA] p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-sm text-[#01011D]">List Price</h4>
          <button className="text-xs text-[#787891] hover:text-[#01011D] cursor-help">
            📅 Range
          </button>
        </div>
        
        {/* Legend Items */}
        <div className="space-y-2">
          {legendItems.map((item) => (
            <div key={item.key} className="space-y-1">
              <div
                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white transition-colors ${
                  selectedMetrics[item.key as keyof SelectedMetrics] ? 'bg-white shadow-sm' : ''
                }`}
                onClick={() => onMetricToggle(item.key)}
              >
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ 
                    backgroundColor: selectedMetrics[item.key as keyof SelectedMetrics] ? item.color : 'transparent',
                    borderColor: item.color 
                  }}
                />
                <span className="text-xs flex-1">{item.label}</span>
                <span className="text-xs">{item.icon}</span>
              </div>
              
              {/* Sub-ranks for Sales Rank */}
              {item.subRanks && selectedMetrics.salesRank && (
                <div className="ml-6 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#787891]">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>Fashion</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#787891]">
                    <div className="w-3 h-3 rounded bg-green-600" />
                    <span>Women&apos;s Boots ⚠️ 3</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Controls */}
        <div className="mt-6 pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#787891]">Day</span>
            <span className="text-xs text-[#787891]">Week</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#787891]">Month</span>
            <span className="text-xs font-semibold text-[#01011D]">3 Months</span>
          </div>
          <div className="text-center text-xs text-[#787891]">
            All (351 days)
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-[#787891]">📊 Close-up view</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
} 