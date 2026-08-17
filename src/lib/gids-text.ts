/** Normaliseer zaaknaam voor unieke lookup (login / duplicate check). */
export function normalizeGidsBusinessName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const TITLE_CASE_LOWER_WORDS = new Set(['de', 'het', 'een', 'van', 'der', 'den', 'te', 'op', 'in', 'en', 'du', 'la'])

function titleCaseWordSegment(segment: string, forceCapital: boolean): string {
  if (!segment) return segment
  if (/^\d+$/.test(segment)) return segment
  const lower = segment.toLowerCase()
  if (!forceCapital && TITLE_CASE_LOWER_WORDS.has(lower)) return lower
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/** Weergavenaam / adres: elk woord met hoofdletter (behalve kleine voorzetsels midden in de zin). */
export function formatGidsTitleCase(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, ' ')
  if (!trimmed) return trimmed
  return trimmed
    .split(' ')
    .map((word, wordIndex) => {
      const forceFirst = wordIndex === 0
      return word
        .split('-')
        .map((part, partIndex) => titleCaseWordSegment(part, forceFirst || partIndex > 0))
        .join('-')
    })
    .join(' ')
}

export function slugifyListing(name: string, city: string): string {
  const raw = normalizeGidsBusinessName(`${name}-${city}`)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return raw.slice(0, 80) || 'zaak'
}

export function normalizeSearchText(s: string): string {
  return normalizeGidsBusinessName(s)
}
