"use client"

interface KeepaControlsProps {
  timeRange: string
  onTimeRangeChange: (range: string) => void
  closeUpView: boolean
  onCloseUpViewChange: (enabled: boolean) => void
}

const timeRanges = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: '3months', label: '3 Months' },
  { key: 'all', label: 'All (351 days)' }
]

export default function KeepaControls({
  timeRange,
  onTimeRangeChange,
  closeUpView,
  onCloseUpViewChange
}: KeepaControlsProps) {
  return (
    <div className="px-6 py-3 border-b border-border bg-[#FAFAFA] flex items-center justify-between">
      {/* Time Range Controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-[#01011D]">Time Range:</span>
        <div className="flex items-center gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.key}
              onClick={() => onTimeRangeChange(range.key)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                timeRange === range.key
                  ? 'bg-primary text-white'
                  : 'bg-white text-[#787891] hover:bg-gray-100'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Close-up View Toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#787891]">📊 Close-up view</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={closeUpView}
            onChange={(e) => onCloseUpViewChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
    </div>
  )
} 