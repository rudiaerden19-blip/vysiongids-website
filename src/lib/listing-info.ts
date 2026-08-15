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

const DAY_MAP: Record<string, ListingWeekday> = {
  monday: 'maandag',
  tuesday: 'dinsdag',
  wednesday: 'woensdag',
  thursday: 'donderdag',
  friday: 'vrijdag',
  saturday: 'zaterdag',
  sunday: 'zondag',
}

function brusselsNow(now: Date): { dayNl: ListingWeekday; nowMins: number; dayIndex: number } | null {
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
  const dayNl = weekday ? DAY_MAP[weekday] : undefined
  if (!dayNl) return null
  return { dayNl, nowMins: hour * 60 + minute, dayIndex: DAY_INDEX[dayNl] }
}

function formatMinutesAsTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function dayLabelForOffset(offset: number, day: ListingWeekday): string {
  if (offset === 0) return 'vandaag'
  if (offset === 1) return 'morgen'
  return day
}

function findNextOpeningSlot(
  listing: Listing,
  now: Date,
): { dayLabel: string; timeLabel: string } | null {
  const ctx = brusselsNow(now)
  if (!ctx) return null
  const hours = resolveHoursByDay(listing)

  for (let offset = 0; offset < 7; offset++) {
    const day = WEEKDAYS_NL[(ctx.dayIndex + offset) % 7]
    const row = hours.find((r) => r.day === day)
    if (!row) continue
    const slots = parseSlots(row.hours).sort((a, b) => a.start - b.start)
    for (const slot of slots) {
      if (offset === 0 && slot.start <= ctx.nowMins) continue
      return {
        dayLabel: dayLabelForOffset(offset, day),
        timeLabel: formatMinutesAsTime(slot.start),
      }
    }
  }
  return null
}

export type ListingOpenStatus = {
  isOpen: boolean
  label: string
}

/** Tekst voor zoeklijst / badges: «Nu open» of «Opent woensdag om 12:00». */
export function getListingOpenStatus(listing: Listing, now = new Date()): ListingOpenStatus {
  if (isListingOpenNow(listing, now)) {
    return { isOpen: true, label: 'Nu open' }
  }
  const next = findNextOpeningSlot(listing, now)
  if (next) {
    return { isOpen: false, label: `Opent ${next.dayLabel} om ${next.timeLabel}` }
  }
  return { isOpen: false, label: 'Momenteel gesloten' }
}

/** Europe/Brussels — vereenvoudigd open-check voor demo */
export function isListingOpenNow(listing: Listing, now = new Date()): boolean {
  const ctx = brusselsNow(now)
  if (!ctx) return false

  const row = resolveHoursByDay(listing).find((r) => r.day === ctx.dayNl)
  if (!row) return false
  const slots = parseSlots(row.hours)
  return slots.some(({ start, end }) => ctx.nowMins >= start && ctx.nowMins < end)
}

export function listingWebsiteDisplay(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url
  }
}