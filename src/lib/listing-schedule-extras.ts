import { belgianPublicHolidaysForYears } from '@/lib/belgian-public-holidays'

export type ListingAnnualLeaveRange = {
  from: string
  to: string
}

export type ListingHolidayChoice = 'open' | 'closed'

export type ListingScheduleExtras = {
  annualLeave?: ListingAnnualLeaveRange[]
  holidays?: Record<string, ListingHolidayChoice>
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MAX_LEAVE_RANGES = 8

export function brusselsCalendarDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function normalizeListingScheduleExtras(raw: unknown): ListingScheduleExtras | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const out: ListingScheduleExtras = {}

  if (Array.isArray(o.annualLeave)) {
    const annualLeave: ListingAnnualLeaveRange[] = []
    for (const item of o.annualLeave.slice(0, MAX_LEAVE_RANGES)) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const from = String(row.from ?? '').trim()
      const to = String(row.to ?? '').trim()
      if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) continue
      if (to < from) continue
      annualLeave.push({ from, to })
    }
    if (annualLeave.length) out.annualLeave = annualLeave
  }

  if (o.holidays && typeof o.holidays === 'object') {
    const holidays: Record<string, ListingHolidayChoice> = {}
    for (const [key, val] of Object.entries(o.holidays as Record<string, unknown>)) {
      if (!ISO_DATE.test(key)) continue
      if (val === 'open' || val === 'closed') holidays[key] = val
    }
    if (Object.keys(holidays).length) out.holidays = holidays
  }

  return Object.keys(out).length ? out : undefined
}

export function parseScheduleExtrasJson(raw: string): ListingScheduleExtras | undefined {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '{}') return undefined
  try {
    return normalizeListingScheduleExtras(JSON.parse(trimmed))
  } catch {
    return undefined
  }
}

export function isDateInAnnualLeave(date: string, schedule: ListingScheduleExtras | undefined): boolean {
  if (!schedule?.annualLeave?.length) return false
  return schedule.annualLeave.some((r) => date >= r.from && date <= r.to)
}

export function holidayChoiceForDate(
  date: string,
  schedule: ListingScheduleExtras | undefined,
): ListingHolidayChoice | null {
  const choice = schedule?.holidays?.[date]
  return choice === 'open' || choice === 'closed' ? choice : null
}

export function defaultHolidayYears(): number[] {
  const y = new Date().getFullYear()
  return [y, y + 1]
}

export function holidaysForOwnerForm(): ReturnType<typeof belgianPublicHolidaysForYears> {
  return belgianPublicHolidaysForYears(defaultHolidayYears())
}
