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
  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) return null
  const [h, m] = trimmed.split(':').map(Number)
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

export function dayFormStateToHoursRow(state: DayHoursFormState): ListingDayHours | { error: string } {
  if (state.closed) {
    return { day: state.day, hours: 'gesloten' }
  }

  const from1 = normalizeTime(state.shift1From)
  const to1 = normalizeTime(state.shift1To)
  if (!from1 || !to1) {
    return { error: `${DAY_LABEL[state.day]}: vul shift 1 van en tot in (uu:mm).` }
  }
  if (toMinutes(to1) <= toMinutes(from1)) {
    return { error: `${DAY_LABEL[state.day]}: shift 1 — «tot» moet na «van» liggen.` }
  }

  let hours = slotString(from1, to1)

  if (state.shift2Enabled) {
    const from2 = normalizeTime(state.shift2From)
    const to2 = normalizeTime(state.shift2To)
    if (!from2 || !to2) {
      return { error: `${DAY_LABEL[state.day]}: vul shift 2 van en tot in.` }
    }
    if (toMinutes(to2) <= toMinutes(from2)) {
      return { error: `${DAY_LABEL[state.day]}: shift 2 — «tot» moet na «van» liggen.` }
    }
    if (toMinutes(from2) < toMinutes(to1)) {
      return { error: `${DAY_LABEL[state.day]}: shift 2 moet na shift 1 beginnen.` }
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

export { DAY_LABEL }
