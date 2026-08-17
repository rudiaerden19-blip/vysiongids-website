export type BelgianPublicHoliday = {
  date: string
  label: string
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function toIsoDateUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

function addUtcDays(d: Date, days: number): Date {
  const out = new Date(d.getTime())
  out.setUTCDate(out.getUTCDate() + days)
  return out
}

/** Gregoriaanse Paaszondag (UTC-datum). */
export function easterSundayUtc(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = c % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

/** Wettelijke feestdagen in België (vaste + beweeglijke). */
export function belgianPublicHolidaysForYear(year: number): BelgianPublicHoliday[] {
  const easter = easterSundayUtc(year)
  const fixed = (month: number, day: number, label: string) =>
    ({ date: `${year}-${pad2(month)}-${pad2(day)}`, label }) as BelgianPublicHoliday

  return [
    fixed(1, 1, 'Nieuwjaar'),
    { date: toIsoDateUtc(addUtcDays(easter, 1)), label: 'Paasmaandag' },
    fixed(5, 1, 'Dag van de arbeid'),
    { date: toIsoDateUtc(addUtcDays(easter, 39)), label: 'O.L.H. Hemelvaart' },
    { date: toIsoDateUtc(addUtcDays(easter, 50)), label: 'Pinkstermaandag' },
    fixed(7, 21, 'Nationale feestdag'),
    fixed(8, 15, 'Maria-Hemelvaart'),
    fixed(11, 1, 'Allerheiligen'),
    fixed(11, 11, 'Wapenstilstand'),
    fixed(12, 25, 'Kerstmis'),
  ]
}

export function belgianPublicHolidaysForYears(years: number[]): BelgianPublicHoliday[] {
  const byDate = new Map<string, BelgianPublicHoliday>()
  for (const y of years) {
    for (const h of belgianPublicHolidaysForYear(y)) {
      if (!byDate.has(h.date)) byDate.set(h.date, h)
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}
