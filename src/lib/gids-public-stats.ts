/** Publieke KPI’s op de homepage */

export const STATS_ACTIVE_BASE = 430
export const STATS_SEARCH_BASE = 3240

export function formatStatNumber(n: number): string {
  return new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 0 }).format(n)
}

function brusselsDateKey(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Vaste waarde per kalenderdag (Europe/Brussels), start rond 3240. */
export function zoekactiesPerDagDisplay(now = new Date()): number {
  const key = brusselsDateKey(now)
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 33 + key.charCodeAt(i)) >>> 0
  }
  const dayOffset = hash % 620
  const trend = Math.floor(
    (now.getTime() - Date.parse('2026-08-15T00:00:00Z')) / (86400000),
  )
  const trendBump = Math.max(0, trend) * 11
  return STATS_SEARCH_BASE + dayOffset + trendBump
}

export function actieveZakenDisplay(extraListingsBeyondBase: number): number {
  return STATS_ACTIVE_BASE + Math.max(0, extraListingsBeyondBase)
}
