import type { Listing, ListingAmenityId, ListingDayHours, ListingWeekday } from '@/lib/listing-types'

export const WEEKDAYS_NL: ListingWeekday[] = [
  'maandag',
  'dinsdag',
  'woensdag',
  'donderdag',
  'vrijdag',
  'zaterdag',
  'zondag',
]

export const AMENITY_LABELS: Record<ListingAmenityId, string> = {
  bancontact: 'Bancontact mogelijk',
  wifi: 'Wifi aanwezig',
  chef: 'Chef achter het fornuis',
  wheelchair: 'Toegankelijk voor rolstoelgebruikers',
  terrace: 'Terras',
  takeaway: 'Afhalen',
  delivery: 'Levering',
}

const CLOSED_WORD = 'gesloten'

function closedDayMatches(day: ListingWeekday, closedDays?: string): boolean {
  if (!closedDays?.trim()) return false
  const c = closedDays.toLowerCase()
  const d = day.toLowerCase()
  return c.includes(d.slice(0, 3)) || c.includes(d)
}

/** Fallback: zelfde uren elke dag, ma. gesloten als closedDays vermeldt maandag */
export function resolveHoursByDay(listing: Listing): ListingDayHours[] {
  if (listing.hoursByDay?.length) return listing.hoursByDay

  const defaultHours = listing.openingHours?.trim() || 'Op aanvraag'
  return WEEKDAYS_NL.map((day) => ({
    day,
    hours: closedDayMatches(day, listing.closedDays) ? CLOSED_WORD : defaultHours,
  }))
}

function parseTimeToMinutes(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function parseSlots(hours: string): Array<{ start: number; end: number }> {
  if (!hours || hours.toLowerCase().includes(CLOSED_WORD)) return []
  const slots: Array<{ start: number; end: number }> = []
  const re = /(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/g
  let match: RegExpExecArray | null
  while ((match = re.exec(hours)) !== null) {
    const start = parseTimeToMinutes(match[1])
    let end = parseTimeToMinutes(match[2])
    if (start == null || end == null) continue
    if (end <= start) end += 24 * 60
    slots.push({ start, end })
  }
  return slots
}

const DAY_INDEX: Record<ListingWeekday, number> = {
  maandag: 0,
  dinsdag: 1,
  woensdag: 2,
  donderdag: 3,
  vrijdag: 4,
  zaterdag: 5,
  zondag: 6,
}

/** Europe/Brussels — vereenvoudigd open-check voor demo */
export function isListingOpenNow(listing: Listing, now = new Date()): boolean {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(now)
  const weekday = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase()
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  const nowMins = hour * 60 + minute

  const dayMap: Record<string, ListingWeekday> = {
    monday: 'maandag',
    tuesday: 'dinsdag',
    wednesday: 'woensdag',
    thursday: 'donderdag',
    friday: 'vrijdag',
    saturday: 'zaterdag',
    sunday: 'zondag',
  }
  const dayNl = weekday ? dayMap[weekday] : undefined
  if (!dayNl) return false

  const row = resolveHoursByDay(listing).find((r) => r.day === dayNl)
  if (!row) return false
  const slots = parseSlots(row.hours)
  return slots.some(({ start, end }) => nowMins >= start && nowMins < end)
}

export function listingWebsiteDisplay(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url
  }
}