"use client"
import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react"

/* ─── Layout constants ──────────────────────────────────────────── */
const M = { top: 12, right: 68, bottom: 30, left: 58 } // margins
const Y_TICKS = 5
const X_TICKS = 8

/* ─── Helpers ───────────────────────────────────────────────────── */

/** Auto-calculate domain from visible data keys, with fallback. */
function calcDomain(data: Record<string, unknown>[], keys: string[]): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (const d of data) {
    for (const k of keys) {
      const v = d[k]
      if (typeof v === "number" && isFinite(v)) {
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
    }
  }
  if (!isFinite(lo)) return [0, 1]
  if (lo === hi) return [lo - 1, hi + 1]
  const pad = (hi - lo) * 0.1
  // Don't let padding push a non-negative domain below zero (e.g. sales ranks, counts)
  const paddedLo = lo >= 0 ? Math.max(0, lo - pad) : lo - pad
  return [paddedLo, hi + pad]
}

/** Generate ~N nicely-rounded axis ticks for a given [lo, hi] range. */
function niceRange(lo: number, hi: number, n: number): number[] {
  const rawStep = (hi - lo) / Math.max(n - 1, 1)
  if (rawStep === 0) return [lo]
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const niceStep =
    ([1, 2, 2.5, 5, 10].find((f) => f * mag >= rawStep) ?? 10) * mag
  const niceMin = Math.floor(lo / niceStep) * niceStep
  const niceMax = Math.ceil(hi / niceStep) * niceStep
  const ticks: number[] = []
  for (let t = niceMin; t <= niceMax + niceStep * 0.01; t += niceStep) {
    ticks.push(Math.round(t * 1e10) / 1e10)
  }
  return ticks
}

/**
 * Build an SVG path string for one data series.
 * Handles null/undefined gaps (connectNulls = draws separate segments).
 */
/**
 * Build an SVG path string for one data series.
 * Null/undefined values produce a horizontal flatline at the last known Y,
 * keeping the path continuous with no pen-lift gaps or rounded-cap dots.
 */
function buildPath(
  data: Record<string, unknown>[],
  key: string,
  xFn: (i: number) => number,
  yFn: (v: number) => number,
  pixelOffset = 0,
): string {
  let d = ""
  let lastY: number | null = null
  for (let i = 0; i < data.length; i++) {
    const v = data[i][key]
    const x = xFn(i)
    if (v === null || v === undefined) {
      // Hold the last known value as a flatline
      if (lastY !== null) d += ` L${x.toFixed(1)},${lastY.toFixed(1)}`
      continue
    }
    const y = yFn(v as number) + pixelOffset
    d += d === "" ? `M${x.toFixed(1)},${y.toFixed(1)}` : ` L${x.toFixed(1)},${y.toFixed(1)}`
    lastY = y
  }
  return d
}

/* ─── Public types ──────────────────────────────────────────────── */

export interface ChartLine {
  key: string
  name?: string
  color: string
  /** Which Y axis to use. Defaults to "left". */
  yAxis?: "left" | "right"
  visible?: boolean
  /**
   * Fixed pixel offset applied to every Y coordinate for this line.
   * Use small values (e.g. -3, 0, 3) to visually separate lines whose
   * data values are identical or nearly identical.
   */
  pixelOffset?: number
}

export interface AxisConfig {
  formatter?: (v: number) => string
  reversed?: boolean
  /** Fixed domain [min, max]. Omit for auto. */
  domain?: [number, number]
}

interface KeepaLineChartProps {
  data: Record<string, unknown>[]
  /** Field name used for the X axis (timestamp string). */
  xKey: string
  lines: ChartLine[]
  leftAxis?: AxisConfig
  rightAxis?: AxisConfig
  xFormatter?: (val: string) => string
  height?: number
  /** Crosshair from an external source (synced hover). */
  syncedX?: string | null
  onMouseMove?: (xVal: string | null, idx: number | null) => void
  onMouseLeave?: () => void
  tooltipContent?: (point: Record<string, unknown>) => React.ReactNode
}

/* ─── Component ─────────────────────────────────────────────────── */

export default function KeepaLineChart({
  data,
  xKey,
  lines,
  leftAxis = {},
  rightAxis,
  xFormatter,
  height = 240,
  syncedX,
  onMouseMove,
  onMouseLeave,
  tooltipContent,
}: KeepaLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  /* Synchronous initial measurement — runs before browser paint so SVG
     is correctly sized on the very first frame (avoids overflow-clipping
     that occurs when the default 600px guess exceeds the real container). */
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const w = containerRef.current.getBoundingClientRect().width
    if (w > 0) setWidth(w)
  }, [])

  /* Responsive width via ResizeObserver */
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) setWidth(w)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const cw = width - M.left - M.right   // chart inner width
  const ch = height - M.top - M.bottom  // chart inner height

  const visibleLines = useMemo(() => lines.filter((l) => l.visible !== false), [lines])

  const leftKeys = useMemo(
    () => visibleLines.filter((l) => !l.yAxis || l.yAxis === "left").map((l) => l.key),
    [visibleLines],
  )
  const rightKeys = useMemo(
    () => visibleLines.filter((l) => l.yAxis === "right").map((l) => l.key),
    [visibleLines],
  )

  const leftDomain = useMemo(
    () => leftAxis.domain ?? calcDomain(data, leftKeys),
    [data, leftKeys, leftAxis.domain],
  )
  const rightDomain: [number, number] | null = useMemo(
    () => (rightKeys.length > 0 ? (rightAxis?.domain ?? calcDomain(data, rightKeys)) : null),
    [data, rightKeys, rightAxis?.domain],
  )

  const leftTicks = useMemo(() => niceRange(leftDomain[0], leftDomain[1], Y_TICKS), [leftDomain])
  const rightTicks = useMemo(
    () => (rightDomain ? niceRange(rightDomain[0], rightDomain[1], Y_TICKS) : []),
    [rightDomain],
  )

  /* Scale functions */
  const xFn = useCallback(
    (i: number) => M.left + (data.length <= 1 ? cw / 2 : (i / (data.length - 1)) * cw),
    [cw, data.length],
  )

  const makeYFn = useCallback(
    (domain: [number, number], reversed = false) => {
      const [lo, hi] = domain
      const range = hi - lo || 1
      return (v: number) => {
        const ratio = (v - lo) / range
        return M.top + (reversed ? ratio : 1 - ratio) * ch
      }
    },
    [ch],
  )

  const leftYFn = useMemo(
    () => makeYFn(leftDomain, leftAxis.reversed),
    [makeYFn, leftDomain, leftAxis.reversed],
  )
  const rightYFn = useMemo(
    () => (rightDomain ? makeYFn(rightDomain, rightAxis?.reversed) : null),
    [makeYFn, rightDomain, rightAxis?.reversed],
  )

  /* X tick indices: evenly distributed, always include last */
  const xTickIndices = useMemo(() => {
    if (data.length === 0) return []
    const step = Math.max(1, Math.floor(data.length / X_TICKS))
    const indices: number[] = []
    for (let i = 0; i < data.length; i += step) indices.push(i)
    if (indices[indices.length - 1] !== data.length - 1) indices.push(data.length - 1)
    return indices
  }, [data.length])

  /* Build all SVG paths */
  const paths = useMemo(() => {
    return visibleLines.map((line) => {
      const yFn = line.yAxis === "right" ? rightYFn : leftYFn
      if (!yFn) return { ...line, d: "" }
      return { ...line, d: buildPath(data, line.key, xFn, yFn, line.pixelOffset ?? 0) }
    })
  }, [visibleLines, data, xFn, leftYFn, rightYFn])

  /* Crosshair x pixel from synced external hover */
  const syncedXPx = useMemo(() => {
    if (!syncedX) return null
    const idx = data.findIndex((d) => d[xKey] === syncedX)
    return idx >= 0 ? xFn(idx) : null
  }, [syncedX, data, xKey, xFn])

  /* Mouse events on the invisible capture rect */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      if (data.length === 0 || cw <= 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      const mx = e.clientX - rect.left                // 0..cw within chart area
      const idx = Math.max(0, Math.min(data.length - 1, Math.round((mx / cw) * (data.length - 1))))

      setHoveredIdx(idx)
      // Tooltip pos relative to container div
      setTooltipPos({ x: mx + M.left, y: e.clientY - rect.top + M.top })

      // Throttle parent sync via RAF
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        onMouseMove?.(data[idx]?.[xKey] as string ?? null, idx)
      })
    },
    [data, cw, xKey, onMouseMove],
  )

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setHoveredIdx(null)
    setTooltipPos(null)
    onMouseLeave?.()
  }, [onMouseLeave])

  const hoveredXPx = hoveredIdx !== null ? xFn(hoveredIdx) : null
  const crosshairX = hoveredXPx ?? syncedXPx
  const hoveredPoint = hoveredIdx !== null ? data[hoveredIdx] : null
  const hasRightAxis = rightKeys.length > 0

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      {width > 0 && <svg width={width} height={height} className="block overflow-visible" aria-hidden>
        {/* Horizontal grid lines (left Y ticks) */}
        {leftTicks.map((tick) => {
          const y = leftYFn(tick)
          return (
            <line
              key={`hg-${tick}`}
              x1={M.left} x2={M.left + cw}
              y1={y} y2={y}
              stroke="#f0f0f0" strokeWidth={1}
            />
          )
        })}

        {/* Vertical grid lines (X ticks) */}
        {xTickIndices.map((i) => {
          const x = xFn(i)
          return (
            <line
              key={`vg-${i}`}
              x1={x} x2={x}
              y1={M.top} y2={M.top + ch}
              stroke="#f0f0f0" strokeWidth={1}
            />
          )
        })}

        {/* Data lines */}
        {paths.map((line) =>
          line.d ? (
            <path
              key={line.key}
              d={line.d}
              stroke={line.color}
              strokeWidth={1.5}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null,
        )}

        {/* Crosshair (synced or local hover) */}
        {crosshairX !== null && (
          <line
            x1={crosshairX} x2={crosshairX}
            y1={M.top} y2={M.top + ch}
            stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 2"
          />
        )}

        {/* Left Y axis line */}
        <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + ch} stroke="#e5e7eb" />

        {/* Left Y tick labels — skip any that are < 14px from the previous rendered label
            or within 16px of the X-axis baseline (avoids overlap with X tick labels) */}
        {leftTicks.reduce<{ lastY: number; els: React.ReactNode[] }>(
          (acc, tick) => {
            const y = leftYFn(tick)
            if (y < M.top + 8) return acc                // too close to top edge
            if (y > M.top + ch - 16) return acc          // too close to X axis
            if (acc.lastY !== -Infinity && Math.abs(y - acc.lastY) < 14) return acc // too close to prev label
            acc.els.push(
              <text key={`ly-${tick}`} x={M.left - 5} y={y}
                textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#9ca3af">
                {leftAxis.formatter ? leftAxis.formatter(tick) : tick}
              </text>
            )
            acc.lastY = y
            return acc
          },
          { lastY: -Infinity, els: [] },
        ).els}

        {/* Right Y axis */}
        {hasRightAxis && rightYFn && (
          <>
            <line
              x1={M.left + cw} x2={M.left + cw}
              y1={M.top} y2={M.top + ch}
              stroke="#e5e7eb"
            />
            {rightTicks.reduce<{ lastY: number; els: React.ReactNode[] }>(
              (acc, tick) => {
                const y = rightYFn(tick)
                if (y < M.top + 8) return acc            // too close to top edge
                if (y > M.top + ch - 16) return acc
                if (acc.lastY !== -Infinity && Math.abs(y - acc.lastY) < 14) return acc
                acc.els.push(
                  <text key={`ry-${tick}`} x={M.left + cw + 5} y={y}
                    textAnchor="start" dominantBaseline="middle" fontSize={9} fill="#9ca3af">
                    {rightAxis?.formatter ? rightAxis.formatter(tick) : tick}
                  </text>
                )
                acc.lastY = y
                return acc
              },
              { lastY: -Infinity, els: [] },
            ).els}
          </>
        )}

        {/* X axis line */}
        <line
          x1={M.left} x2={M.left + cw}
          y1={M.top + ch} y2={M.top + ch}
          stroke="#e5e7eb"
        />

        {/* X tick labels */}
        {xTickIndices.map((i) => {
          const x = xFn(i)
          const raw = data[i]?.[xKey] as string
          const label = xFormatter ? xFormatter(raw) : raw
          return (
            <text key={`xt-${i}`} x={x} y={M.top + ch + 14}
              textAnchor="middle" fontSize={9} fill="#9ca3af">
              {label}
            </text>
          )
        })}

        {/* Invisible mouse-capture rect (sits on top, full chart area) */}
        <rect
          x={M.left} y={M.top}
          width={cw} height={ch}
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </svg>}

      {/* Floating tooltip */}
      {hoveredPoint && tooltipContent && tooltipPos && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: tooltipPos.x > width * 0.6 ? tooltipPos.x - 8 : tooltipPos.x + 12,
            top: Math.max(0, tooltipPos.y - 20),
            transform: tooltipPos.x > width * 0.6 ? "translateX(-100%)" : undefined,
          }}
        >
          {tooltipContent(hoveredPoint)}
        </div>
      )}
    </div>
  )
}
