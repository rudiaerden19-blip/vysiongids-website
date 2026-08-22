/** Publieke KPI’s op de homepage */

/**
 * Kalibratie homepage «Actieve ondernemers»: publiek cijfer vs. Supabase published-telling.
 * Elke extra gepubliceerde zaak (horeca + diensten) telt +1 op het publieke cijfer.
 * Na bulk-import in Supabase: pas beide constanten aan (zelfde verschil behouden of op 1:1 zetten).
 */
export const STATS_ACTIVE_ONDERNEMERS_CALIBRATION_DB = 83
export const STATS_ACTIVE_ONDERNEMERS_CALIBRATION_PUBLIC = 288

/** Homepage «Actieve ondernemers» (alle segmenten, published in Supabase). */
export function publicActiveOndernemersDisplayCount(actualCount: number): number {
  const n = Math.max(0, Math.floor(actualCount))
  return STATS_ACTIVE_ONDERNEMERS_CALIBRATION_PUBLIC + (n - STATS_ACTIVE_ONDERNEMERS_CALIBRATION_DB)
}

/** Zoekpagina horeca-totalen (zelfde als werkelijk aantal, geen vloer). */
export function publicHorecaZakenDisplayCount(actualCount: number): number {
  return Math.max(0, Math.floor(actualCount))
}

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

function daysSinceLaunch(now: Date, anchorKey = STATS_SEARCH_LAUNCH_KEY): number {
  const key = brusselsDateKey(now)
  const [y, m, d] = key.split('-').map(Number)
  const currentUtc = Date.UTC(y, m - 1, d)
  const [ay, am, ad] = anchorKey.split('-').map(Number)
  const anchorUtc = Date.UTC(ay, am - 1, ad)
  return Math.max(0, Math.floor((currentUtc - anchorUtc) / 86400000))
}

function utcDateKeyAfterDays(anchorKey: string, dayOffset: number): string {
  const [ay, am, ad] = anchorKey.split('-').map(Number)
  const t = Date.UTC(ay, am - 1, ad + dayOffset)
  const d = new Date(t)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const DIENSTEN_VISITORS_BASE = 80
const DIENSTEN_VISITORS_LAUNCH = STATS_SEARCH_LAUNCH_KEY
const DIENSTEN_VISITOR_DAY_DELTAS = [75, 70, 40, 100, 55, 90, 35, 65, 110, 45, 80, 50] as const

/** Bezoekers op dienstenkaart: start 80, per dag wisselende stijging (per slug stabiel). */
export function dienstenListingVisitorsDisplay(slug: string, now = new Date()): number {
  const slugNorm = slug.trim().toLowerCase() || 'leverancier'
  const dayCount = daysSinceLaunch(now, DIENSTEN_VISITORS_LAUNCH)
  let total = DIENSTEN_VISITORS_BASE
  for (let i = 0; i < dayCount; i++) {
    const dayKey = utcDateKeyAfterDays(DIENSTEN_VISITORS_LAUNCH, i)
    const h = hashDateKey(`${slugNorm}|visitors|${dayKey}`)
    total += DIENSTEN_VISITOR_DAY_DELTAS[h % DIENSTEN_VISITOR_DAY_DELTAS.length]!
  }
  return total
}

function daysSinceLaunchSearch(now: Date): number {
  return daysSinceLaunch(now, STATS_SEARCH_LAUNCH_KEY)
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
  const dayIndex = daysSinceLaunchSearch(now)

  /** ~12–18 extra per kalenderdag t.o.v. lancering */
  const dailyGrowth = dayIndex * 15

  /** Variatie binnen de week (ma–do lager band) */
  const weekdayBand = hash % 200

  /** Vrijdag, zaterdag, zondag: +450–820 boven doordeweeks niveau */
  const isWeekendPeak = weekday >= 4
  const weekendBoost = isWeekendPeak ? 450 + (hash % 370) : 0

  return STATS_SEARCH_BASE + dailyGrowth + weekdayBand + weekendBoost
}
