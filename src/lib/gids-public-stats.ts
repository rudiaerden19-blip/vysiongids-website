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

/** Zoekpagina horeca-totalen (zelfde als werkelijk aantal, geen vloer). */
export function publicHorecaZakenDisplayCount(actualCount: number): number {
  return Math.max(0, Math.floor(actualCount))
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

/** ~210 bezoekers per uur na 9u, stabiel per dag+uur-slot (niet elk uur hetzelfde getal). */
function bezoekersHourlyDelta(dateKey: string, hourSlotIndex: number): number {
  const hash = hashDateKey(`${dateKey}|bezoekers-uur|${hourSlotIndex}`)
  return 175 + (hash % 71)
}

/**
 * Bezoekers vandaag: om 9:00 (Brussel) = 80, daarna per uur ~210 extra (175–245), geen count-up animatie.
 */
export function zoekactiesPerDagDisplay(now = new Date()): number {
  const dateKey = brusselsDateKey(now)
  const { hour, minute } = brusselsHourAndMinute(now)
  const startHour = 9
  const baseAtNine = 80

  if (hour < startHour) return baseAtNine

  const hoursSinceNine = hour - startHour + minute / 60
  const fullHours = Math.floor(hoursSinceNine)
  let total = baseAtNine

  for (let slot = 0; slot < fullHours; slot++) {
    total += bezoekersHourlyDelta(dateKey, slot)
  }

  const fraction = hoursSinceNine - fullHours
  if (fraction > 0) {
    total += Math.round(bezoekersHourlyDelta(dateKey, fullHours) * fraction)
  }

  return total
}
