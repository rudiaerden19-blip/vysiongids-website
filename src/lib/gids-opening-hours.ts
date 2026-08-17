import type { ListingDayHours, ListingWeekday } from '@/lib/listing-types'
import { WEEKDAYS_NL } from '@/lib/listing-info'

export type DayHoursFormState = {
  day: ListingWeekday
  closed: boolean
  shift1From: string
  shift1To: string
  shift2Enabled: boolean
  shift2From: string
  shift2To: string
}

const DAY_LABEL: Record<ListingWeekday, string> = {
  maandag: 'Maandag',
  dinsdag: 'Dinsdag',
  woensdag: 'Woensdag',
  donderdag: 'Donderdag',
  vrijdag: 'Vrijdag',
  zaterdag: 'Zaterdag',
  zondag: 'Zondag',
}

export function defaultWeekHoursFormState(): DayHoursFormState[] {
  return WEEKDAYS_NL.map((day) => ({
    day,
    closed: day === 'maandag',
    shift1From: '10:00',
    shift1To: '18:00',
    shift2Enabled: false,
    shift2From: '',
    shift2To: '',
  }))
}

function normalizeTime(t: string): string | null {
  const trimmed = t.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function slotString(from: string, to: string): string {
  return `${from}–${to}`
}

function shift2Counts(state: DayHoursFormState): 'off' | 'empty' | 'partial' | 'full' {
  if (!state.shift2Enabled) return 'off'
  const from2 = normalizeTime(state.shift2From)
  const to2 = normalizeTime(state.shift2To)
  if (!from2 && !to2) return 'empty'
  if (!from2 || !to2) return 'partial'
  return 'full'
}

export function dayFormStateToHoursRow(state: DayHoursFormState): ListingDayHours | { error: string } {
  if (state.closed) {
    return { day: state.day, hours: 'gesloten' }
  }

  const from1 = normalizeTime(state.shift1From)
  const to1 = normalizeTime(state.shift1To)
  if (!from1 || !to1) {
    return { error: `${DAY_LABEL[state.day]}: vul shift 1 van en tot in (uu:mm).` }
  }
  if (from1 === to1) {
    return { error: `${DAY_LABEL[state.day]}: shift 1 — «van» en «tot» mogen niet gelijk zijn.` }
  }

  let hours = slotString(from1, to1)

  const shift2 = shift2Counts(state)
  if (shift2 === 'partial') {
    return {
      error: `${DAY_LABEL[state.day]}: vul shift 2 volledig in, of vink «2e shift» uit.`,
    }
  }
  if (shift2 === 'full') {
    const from2 = normalizeTime(state.shift2From)!
    const to2 = normalizeTime(state.shift2To)!
    if (from2 === to2) {
      return { error: `${DAY_LABEL[state.day]}: shift 2 — «van» en «tot» mogen niet gelijk zijn.` }
    }
    const end1 = toMinutes(to1)
    const start1 = toMinutes(from1)
    const shift1SameCalendarDay = end1 > start1
    if (shift1SameCalendarDay && toMinutes(from2) < end1) {
      return {
        error: `${DAY_LABEL[state.day]}: 2e shift valt binnen shift 1 — één shift volstaat, of vink «2e shift» uit.`,
      }
    }
    hours = `${hours}, ${slotString(from2, to2)}`
  }

  return { day: state.day, hours }
}

export function weekFormToHoursByDay(states: DayHoursFormState[]): { rows: ListingDayHours[] } | { error: string } {
  const rows: ListingDayHours[] = []
  let openDays = 0
  for (const state of states) {
    const row = dayFormStateToHoursRow(state)
    if ('error' in row) return { error: row.error }
    rows.push(row)
    if (row.hours !== 'gesloten') openDays++
  }
  if (openDays === 0) {
    return { error: 'Minstens één dag moet open zijn.' }
  }
  return { rows }
}

export function summarizeOpeningHours(rows: ListingDayHours[]): string {
  const open = rows.filter((r) => r.hours !== 'gesloten')
  if (open.length === 0) return 'Gesloten'
  const unique = new Set(open.map((r) => r.hours))
  if (unique.size === 1 && open.length === 7) {
    return `Ma–Zo ${open[0]!.hours}`
  }
  if (unique.size === 1) {
    const days = open.map((r) => DAY_LABEL[r.day].slice(0, 2)).join(', ')
    return `${days} ${open[0]!.hours}`
  }
  return open.map((r) => `${DAY_LABEL[r.day].slice(0, 2)} ${r.hours}`).join(' · ')
}

export function closedDaysFromRows(rows: ListingDayHours[]): string | null {
  const closed = rows.filter((r) => r.hours === 'gesloten').map((r) => DAY_LABEL[r.day])
  return closed.length ? closed.join(', ') : null
}

function parseHoursSlot(slot: string): { from: string; to: string } | null {
  const m = slot.trim().match(/^(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})$/)
  if (!m) return null
  const from = normalizeTime(m[1]!)
  const to = normalizeTime(m[2]!)
  if (!from || !to) return null
  return { from, to }
}

/** Voor beheer: bestaande hours_by_day terug naar form state. */
export function hoursByDayToFormState(rows: ListingDayHours[]): DayHoursFormState[] {
  return WEEKDAYS_NL.map((day) => {
    const row = rows.find((r) => r.day === day)
    const base: DayHoursFormState = {
      day,
      closed: true,
      shift1From: '10:00',
      shift1To: '18:00',
      shift2Enabled: false,
      shift2From: '',
      shift2To: '',
    }
    if (!row || row.hours.trim().toLowerCase() === 'gesloten') return base

    const parts = row.hours.split(',').map((s) => s.trim())
    const slot1 = parseHoursSlot(parts[0] ?? '')
    if (!slot1) return { ...base, closed: false }

    const out: DayHoursFormState = {
      day,
      closed: false,
      shift1From: slot1.from,
      shift1To: slot1.to,
      shift2Enabled: false,
      shift2From: '',
      shift2To: '',
    }
    if (parts.length > 1) {
      const slot2 = parseHoursSlot(parts[1] ?? '')
      if (slot2) {
        out.shift2Enabled = true
        out.shift2From = slot2.from
        out.shift2To = slot2.to
      }
    }
    return out
  })
}

export { DAY_LABEL }
