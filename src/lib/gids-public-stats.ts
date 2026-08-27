/** Publieke KPI’s op de homepage */

/**
 * Kalibratie homepage «Actieve ondernemers»: publiek cijfer vs. type-slots (meerdere types = meerdere).
 * Elke extra type-keuze of nieuwe zaak telt +1 op het publieke cijfer.
 * Na bulk-import in Supabase: pas beide constanten aan (zelfde verschil behouden of op 1:1 zetten).
 */
export const STATS_ACTIVE_ONDERNEMERS_CALIBRATION_DB = 83
export const STATS_ACTIVE_ONDERNEMERS_CALIBRATION_PUBLIC = 288

/** Homepage «Actieve ondernemers» (alle segmenten, published in Supabase). */
export function publicActiveOndernemersDisplayCount(actualCount: number): number {
  const n = Math.max(0, Math.floor(actualCount))
  return STATS_ACTIVE_ONDERNEMERS_CALIBRATION_PUBLIC + (n - STATS_ACTIVE_ONDERNEMERS_CALIBRATION_DB)
}

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

/** Duidelijk verschillende niveaus per bedrijf — niet allemaal ~900. */
const DIENSTEN_VISITOR_BANDS = [600, 800, 1300, 2000] as const
/** Vanaf deze dag telt elke kalenderdag (Brussel) extra bezoekers bij. */
const DIENSTEN_VISITORS_GROWTH_FROM = '2026-08-27'
const DIENSTEN_VISITOR_DAY_DELTAS = [45, 60, 75, 90, 55, 100, 40, 80, 110, 50, 70, 95] as const

/**
 * Bezoekers op dienstenkaart: vast populariteitsniveau (rond 600 / 800 / 1300 / 2000)
 * plus elke dag een zichtbare sprong (populaire bedrijven groeien sneller).
 * Vandaag telt mee naar rato van het uur (06:00→22:00).
 */
export function dienstenListingVisitorsDisplay(slug: string, now = new Date()): number {
  const slugNorm = slug.trim().toLowerCase() || 'leverancier'
  const seed = hashDateKey(`${slugNorm}|visitors-band`)
  const band = DIENSTEN_VISITOR_BANDS[seed % DIENSTEN_VISITOR_BANDS.length]!
  const jitter = (hashDateKey(`${slugNorm}|visitors-jitter`) % 241) - 120
  const popularity = band / 800

  const todayKey = brusselsDateKey(now)
  const completedDays = daysSinceLaunch(now, DIENSTEN_VISITORS_GROWTH_FROM)
  let grown = 0
  for (let i = 0; i < completedDays; i++) {
    const dayKey = utcDateKeyAfterDays(DIENSTEN_VISITORS_GROWTH_FROM, i)
    const h = hashDateKey(`${slugNorm}|visitors|${dayKey}`)
    const raw = DIENSTEN_VISITOR_DAY_DELTAS[h % DIENSTEN_VISITOR_DAY_DELTAS.length]!
    grown += Math.round(raw * popularity)
  }

  if (todayKey >= DIENSTEN_VISITORS_GROWTH_FROM) {
    const hToday = hashDateKey(`${slugNorm}|visitors|${todayKey}`)
    const todayFull = Math.round(
      DIENSTEN_VISITOR_DAY_DELTAS[hToday % DIENSTEN_VISITOR_DAY_DELTAS.length]! * popularity,
    )
    const { hour, minute } = brusselsHourAndMinute(now)
    const time = hour + minute / 60
    const frac = time < 6 ? 0 : Math.min(1, (time - 6) / 16)
    grown += Math.round(todayFull * frac)
  }

  return Math.max(180, band + jitter + grown)
}

function hashDateKey(key: string): number {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 33 + key.charCodeAt(i)) >>> 0
  }
  return hash
}

function brusselsHourAndMinute(now: Date): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return { hour, minute }
}

/**
 * Bezoekers vandaag (Brussel):
 * 00:00–09:00 → 0 · 09:00→20:00 lineair ~180→13.000 · 20:00→24:00 blijft oplopen · 00:00 reset.
 */
export function zoekactiesPerDagDisplay(now = new Date()): number {
  const { hour, minute } = brusselsHourAndMinute(now)
  const time = hour + minute / 60
  const startHour = 9
  const peakHour = 20
  const baseAtNine = 180
  const atPeak = 13_000

  if (time < startHour) return 0

  const morningHours = peakHour - startHour
  if (time < peakHour) {
    const progress = (time - startHour) / morningHours
    return Math.round(baseAtNine + (atPeak - baseAtNine) * progress)
  }

  const eveningHours = 24 - peakHour
  const hourlyMorningRate = (atPeak - baseAtNine) / morningHours
  const eveningEnd = Math.round(atPeak + hourlyMorningRate * eveningHours)
  const progressEvening = Math.min(1, (time - peakHour) / eveningHours)
  return Math.round(atPeak + (eveningEnd - atPeak) * progressEvening)
}
