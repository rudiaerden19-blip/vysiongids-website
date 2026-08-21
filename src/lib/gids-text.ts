/** Normaliseer zaaknaam voor unieke lookup (login / duplicate check). */
export function normalizeGidsBusinessName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u201B\u0060\u02BC]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extra lookup-keys voor veelgemaakte typo's (meervoud/enkelvoud op laatste segment). */
function gidsBusinessNamePluralVariants(base: string): string[] {
  const variants: string[] = []
  const push = (v: string) => {
    if (v && v !== base) variants.push(v)
  }

  if (base.endsWith('s') && base.length > 2) {
    push(base.slice(0, -1))
  } else {
    push(`${base}s`)
  }

  const hyphenIdx = base.lastIndexOf('-')
  if (hyphenIdx > 0) {
    const prefix = base.slice(0, hyphenIdx + 1)
    const last = base.slice(hyphenIdx + 1)
    if (last.endsWith('s') && last.length > 2) {
      push(prefix + last.slice(0, -1))
    } else if (last && !last.endsWith('s')) {
      push(prefix + last + 's')
    }
  }

  return variants
}

/** Login/lookup: DB kan oude apostrof-varianten hebben (’ vs '). */
export function gidsBusinessNameLookupKeys(rawName: string): string[] {
  const base = normalizeGidsBusinessName(rawName)
  if (!base) return []
  const keys = new Set<string>([base])
  for (const v of gidsBusinessNamePluralVariants(base)) {
    keys.add(v)
  }
  if (base.includes("'")) {
    keys.add(base.replace(/'/g, '\u2019'))
    keys.add(base.replace(/'/g, '\u2018'))
  }
  return [...keys]
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

/** Reviewtekst: start met hoofdletter; ook na punt/vraagteken/uitroepteken. */
export function formatReviewCommentText(input: string): string {
  return formatGidsSentenceText(input.replace(/\s+/g, ' ').trim())
}

/** Eerste letter (a–z, incl. accenten) vanaf `start` hoofdletter maken. */
function capitalizeFirstLetterFrom(input: string, start: number): string {
  for (let i = Math.max(0, start); i < input.length; i++) {
    const ch = input[i]!
    if (/[a-zà-ÿ]/i.test(ch)) {
      return input.slice(0, i) + ch.toUpperCase() + input.slice(i + 1)
    }
  }
  return input
}

/**
 * Lopende tekst / omschrijving: hoofdletter aan start, na zinspunt en aan begin van nieuwe regel.
 * Leestekens aan het begin (b.v. * of ") tellen niet mee — de eerste echte letter wordt hoofdletter.
 * Behoudt regeleinden.
 */
export function formatGidsSentenceText(input: string): string {
  if (!input) return input
  let s = input.replace(/\r\n/g, '\n')
  s = capitalizeFirstLetterFrom(s, 0)
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\n') {
      s = capitalizeFirstLetterFrom(s, i + 1)
    } else if (/[.!?…]/.test(s[i]!)) {
      let j = i + 1
      while (j < s.length && /[\s]/.test(s[j]!)) j++
      s = capitalizeFirstLetterFrom(s, j)
    }
  }
  return s
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
