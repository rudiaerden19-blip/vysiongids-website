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

function isDutchApostropheParticle(word: string): boolean {
  return /^'[a-z]{1,3}$/i.test(word.trim())
}

function titleCaseWordSegment(segment: string, forceCapital: boolean): string {
  if (!segment) return segment
  if (/^\d+$/.test(segment)) return segment
  const lower = segment.toLowerCase()
  if (!forceCapital && TITLE_CASE_LOWER_WORDS.has(lower)) return lower
  if (isDutchApostropheParticle(lower)) return lower
  const letterIdx = lower.search(/[a-zà-ÿ]/)
  if (letterIdx < 0) return lower
  return lower.slice(0, letterIdx) + lower.charAt(letterIdx).toUpperCase() + lower.slice(letterIdx + 1)
}

/** Weergavenaam / adres: elk woord met hoofdletter (behalve kleine voorzetsels midden in de zin). */
export function formatGidsTitleCase(input: string): string {
  const trimmed = input.replace(/\s+/g, ' ')
  if (!trimmed.trim()) return trimmed
  return trimmed
    .split(' ')
    .map((word, wordIndex) => {
      if (isDutchApostropheParticle(word)) return word.toLowerCase()
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
