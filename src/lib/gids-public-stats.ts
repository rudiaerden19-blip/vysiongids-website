/** Publieke KPI’s op de homepage */

export const STATS_ACTIVE_BASE = 430
export const STATS_SEARCH_BASE = 3240

const STATS_SEARCH_LAUNCH_KEY = '2026-08-15'

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

/** Maandag = 0 … zondag = 6 (Europe/Brussels). */
function brusselsWeekdayIndex(now: Date): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Brussels',
    weekday: 'long',
  })
    .format(now)
    .toLowerCase()
  const map: Record<string, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  }
  return map[weekday] ?? 0
}

function daysSinceLaunch(now: Date): number {
  const key = brusselsDateKey(now)
  const [y, m, d] = key.split('-').map(Number)
  const currentUtc = Date.UTC(y, m - 1, d)
  const [ay, am, ad] = STATS_SEARCH_LAUNCH_KEY.split('-').map(Number)
  const anchorUtc = Date.UTC(ay, am - 1, ad)
  return Math.max(0, Math.floor((currentUtc - anchorUtc) / 86400000))
}

function hashDateKey(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 33 + key.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Zoekacties vandaag: elke dag iets hoger; vr–zo duidelijk boven ma–do.
 */
export function zoekactiesPerDagDisplay(now = new Date()): number {
  const key = brusselsDateKey(now)
  const hash = hashDateKey(key)
  const weekday = brusselsWeekdayIndex(now)
  const dayIndex = daysSinceLaunch(now)

  /** ~12–18 extra per kalenderdag t.o.v. lancering */
  const dailyGrowth = dayIndex * 15

  /** Variatie binnen de week (ma–do lager band) */
  const weekdayBand = hash % 200

  /** Vrijdag, zaterdag, zondag: +450–820 boven doordeweeks niveau */
  const isWeekendPeak = weekday >= 4
  const weekendBoost = isWeekendPeak ? 450 + (hash % 370) : 0

  return STATS_SEARCH_BASE + dailyGrowth + weekdayBand + weekendBoost
}

export function actieveZakenDisplay(extraListingsBeyondBase: number): number {
  return STATS_ACTIVE_BASE + Math.max(0, extraListingsBeyondBase)
}
