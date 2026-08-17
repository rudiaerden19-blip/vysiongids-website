/** Geschatte weergaves per zaak — deterministisch per slug+dag, oplopend na 6:00 (Brussel). */

function brusselsDateKey(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function brusselsMinutesOfDay(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

function hashSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Vanaf 06:00 (Brussel): start 6, +1 per 10 minuten.
 * Per zaak/dag een vaste afwijking zodat niet elke zaak hetzelfde getal toont.
 */
export function listingDailyViewCount(slug: string, now = new Date()): number {
  const normalizedSlug = slug.trim().toLowerCase()
  const dateKey = brusselsDateKey(now)
  const seed = hashSeed(`${normalizedSlug}:${dateKey}`)

  const minutesSince6 = brusselsMinutesOfDay(now) - 6 * 60
  const ticks = minutesSince6 >= 0 ? Math.floor(minutesSince6 / 10) : 0
  const base = 6 + ticks

  const spread = 6 + (seed % 19)
  const direction = seed % 3
  let offset: number
  if (direction === 0) {
    offset = -Math.min(spread, Math.max(2, Math.floor(base * 0.18)))
  } else if (direction === 1) {
    offset = Math.floor(spread * 0.6)
  } else {
    offset = spread + Math.floor((seed >> 4) % 7)
  }

  return Math.max(6, base + offset)
}

export function formatListingDailyViewCount(n: number): string {
  return new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 0 }).format(n)
}

function parseDateKey(dateKey: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateKey.split('-').map(Number)
  return { y, m, d }
}

/** Vast tijdstip op een Brusselse kalenderdag (voor dagtotalen in week/maand). */
function instantOnBrusselsDate(dateKey: string, hour: number, minute: number): Date {
  const { y, m, d } = parseDateKey(dateKey)
  const searchStart = Date.UTC(y, m - 1, d - 1, 0, 0, 0)
  const searchEnd = Date.UTC(y, m - 1, d + 1, 0, 0, 0)
  const target = hour * 60 + minute
  for (let t = searchStart; t < searchEnd; t += 15 * 60 * 1000) {
    const dt = new Date(t)
    if (brusselsDateKey(dt) !== dateKey) continue
    const mod = brusselsMinutesOfDay(dt)
    if (mod >= target) return dt
  }
  return new Date(searchStart + 36 * 3600 * 1000)
}

function previousBrusselsDateKey(dateKey: string): string {
  const dt = instantOnBrusselsDate(dateKey, 12, 0)
  return brusselsDateKey(new Date(dt.getTime() - 24 * 3600 * 1000))
}

function nextBrusselsDateKey(dateKey: string): string {
  const dt = instantOnBrusselsDate(dateKey, 12, 0)
  return brusselsDateKey(new Date(dt.getTime() + 24 * 3600 * 1000))
}

function enumerateBrusselsDateKeys(fromKey: string, toKey: string): string[] {
  const keys: string[] = []
  let k = fromKey
  for (let guard = 0; guard < 366 && k <= toKey; guard++) {
    keys.push(k)
    if (k === toKey) break
    k = nextBrusselsDateKey(k)
  }
  return keys
}

function brusselsWeekdayIndexMonday0(dateKey: string): number {
  const dt = instantOnBrusselsDate(dateKey, 12, 0)
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Brussels',
    weekday: 'short',
  }).format(dt)
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
  return map[wd] ?? 0
}

function startOfIsoWeekMondayKey(now: Date): string {
  let key = brusselsDateKey(now)
  const daysFromMonday = brusselsWeekdayIndexMonday0(key)
  for (let i = 0; i < daysFromMonday; i++) {
    key = previousBrusselsDateKey(key)
  }
  return key
}

function startOfMonthDateKey(todayKey: string): string {
  return `${todayKey.slice(0, 8)}01`
}

function listingViewCountForDateKey(
  slug: string,
  dateKey: string,
  todayKey: string,
  now: Date,
): number {
  if (dateKey === todayKey) return listingDailyViewCount(slug, now)
  return listingDailyViewCount(slug, instantOnBrusselsDate(dateKey, 20, 0))
}

export type ListingOwnerViewStats = {
  today: number
  week: number
  month: number
}

/** Vandaag, deze week (ma–vandaag) en deze maand (1e–vandaag), Brussel. */
export function listingOwnerViewStats(slug: string, now = new Date()): ListingOwnerViewStats {
  const todayKey = brusselsDateKey(now)
  const weekStart = startOfIsoWeekMondayKey(now)
  const monthStart = startOfMonthDateKey(todayKey)

  let week = 0
  for (const key of enumerateBrusselsDateKeys(weekStart, todayKey)) {
    week += listingViewCountForDateKey(slug, key, todayKey, now)
  }

  let month = 0
  for (const key of enumerateBrusselsDateKeys(monthStart, todayKey)) {
    month += listingViewCountForDateKey(slug, key, todayKey, now)
  }

  return {
    today: listingDailyViewCount(slug, now),
    week,
    month,
  }
}
