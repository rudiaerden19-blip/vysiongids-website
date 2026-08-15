/** Geschatte «bekeken vandaag» per zaak — deterministisch per slug+dag, oplopend na 6:00. */

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
