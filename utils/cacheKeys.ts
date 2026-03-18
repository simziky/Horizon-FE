/**
 * Cache key normalisation helpers.
 *
 * RTK Query uses serialized query args as cache keys. Inconsistent formats
 * (mixed ASIN casing, non-canonical periods, extra whitespace) produce
 * duplicate cache entries for identical data. These helpers ensure every
 * cache key is built from a canonical form.
 */

// ─── ASIN ────────────────────────────────────────────────────────────────────

/** Normalise an ASIN: trim whitespace and uppercase. */
export function normalizeAsin(asin: string): string {
  return String(asin).trim().toUpperCase()
}

// ─── Period ───────────────────────────────────────────────────────────────────

const VALID_PERIODS = new Set(['7d', '30d', '90d', '1y', 'all'])
const DEFAULT_PERIOD = '30d'

/**
 * Normalise a time-range period string.
 * Falls back to '30d' for any unrecognised value so cache keys stay stable
 * even when callers pass undefined or an unexpected string.
 */
export function normalizePeriod(period?: string | null): string {
  if (!period) return DEFAULT_PERIOD
  const lower = period.trim().toLowerCase()
  return VALID_PERIODS.has(lower) ? lower : DEFAULT_PERIOD
}

// ─── Marketplace ID ───────────────────────────────────────────────────────────

/** Normalise a marketplace ID to a consistent string representation. */
export function normalizeMarketplaceId(id: string | number): string {
  return String(id).trim()
}

// ─── Composite key builders ───────────────────────────────────────────────────

/**
 * Build a canonical keepa cache key.
 * @example keepaCacheKey('price_history', '1', 'b075CybdkC ', '30D')
 *          → 'keepa_price_history:1:B075CYBDKC:30d'
 */
export function keepaCacheKey(
  endpoint: string,
  marketplaceId: string | number,
  asin: string,
  period?: string | null,
): string {
  const parts = [
    `keepa_${endpoint}`,
    normalizeMarketplaceId(marketplaceId),
    normalizeAsin(asin),
  ]
  if (period !== undefined) parts.push(normalizePeriod(period))
  return parts.join(':')
}
