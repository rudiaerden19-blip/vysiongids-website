import type { Listing } from '@/lib/listing-types'
import { PROTECTED_SEARCH_VOCABULARY } from '@/lib/gids-search-vocabulary'
import { normalizeSearchText } from '@/lib/gids-text'

export type VoiceNameHint = {
  /** Genormaliseerd woord om tegen te matchen */
  token: string
  /** Vervanging in zoekveld (behoud merknaam) */
  replaceWith: string
}

const STOPWORDS = new Set([
  'eethuis',
  'frituur',
  'restaurant',
  'resto',
  'café',
  'cafe',
  'snack',
  'snackbar',
  'pizzeria',
  'pizza',
  'kebab',
  'bistro',
  'traiteur',
  'broodjes',
  'broodjeszaak',
  'sushi',
  'chinees',
  'chinese',
  'sterrenzaak',
  'bakkerij',
  'slagerij',
  'koffiehuis',
  'lunchroom',
  'foodtruck',
  'ijssalon',
  'wijnhandel',
  'de',
  'het',
  'den',
  'van',
  'en',
  'the',
  'shop',
  'grill',
  'house',
])

export function buildVoiceNameHints(listings: Listing[]): VoiceNameHint[] {
  const hints: VoiceNameHint[] = []
  const seen = new Set<string>()

  const add = (token: string, replaceWith: string) => {
    const norm = normalizeSearchText(token)
    if (norm.length < 4 || STOPWORDS.has(norm) || seen.has(norm)) return
    seen.add(norm)
    let repl = replaceWith.trim() || token
    if (repl.length <= 24 && /^[a-zà-ü]/.test(repl) && !repl.includes(' ')) {
      repl = repl.charAt(0).toUpperCase() + repl.slice(1)
    }
    hints.push({ token: norm, replaceWith: repl })
  }

  for (const listing of listings) {
    addElierSpeechHints(listing, add)
    add(listing.name, listing.name)

    for (const word of listing.name.split(/\s+/)) {
      add(word, word)
    }

    for (const part of listing.slug.split('-')) {
      add(part, part)
    }

    if (listing.city) add(listing.city, listing.city)

    const orderRaw = listing.orderUrl?.trim()
    if (orderRaw) {
      try {
        const host = new URL(orderRaw.includes('://') ? orderRaw : `https://${orderRaw}`).hostname.toLowerCase()
        const tenant = host.split('.')[0] ?? ''
        if (tenant.length >= 4) add(tenant, tenant)
        for (const part of listing.slug.split('-')) {
          if (part.length >= 4 && tenant.includes(part)) {
            add(part, part.charAt(0).toUpperCase() + part.slice(1))
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  return hints.sort((a, b) => b.token.length - a.token.length)
}

/** STT zegt vaak «staf lier» i.p.v. Stafelier / De Stafelier. */
function addElierSpeechHints(listing: Listing, add: (token: string, replaceWith: string) => void) {
  const replaceWith = listing.name.trim()
  if (!replaceWith) return

  const sources = [
    normalizeSearchText(listing.name),
    ...listing.slug.split('-').map((p) => normalizeSearchText(p)),
  ]

  for (const src of sources) {
    const m = src.match(/^(.*?)([a-z]{3,})elier$/)
    if (!m) continue
    const prefix = (m[1] ?? '').trim()
    const stem = m[2] ?? ''
    if (stem.length < 3) continue
    const spoken = prefix ? `${prefix} ${stem} lier` : `${stem} lier`
    add(spoken, replaceWith)
  }
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const row = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) row[j] = j
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost)
      prev = tmp
    }
  }
  return row[b.length]!
}

function maxEditDistance(wordLen: number): number {
  if (wordLen <= 4) return 1
  if (wordLen <= 6) return 2
  return 3
}

function speechMatchDistance(norm: string, token: string): number {
  if (norm === token) return 0
  const d = levenshtein(norm, token)
  if (d <= maxEditDistance(norm.length)) return d

  // Eind-m valt weg in spraak: «nolin» → Nolim
  if (
    norm.length === token.length &&
    norm.length >= 4 &&
    norm.slice(0, -1) === token.slice(0, -1) &&
    norm.endsWith('n') &&
    token.endsWith('m')
  ) {
    return 1
  }

  // Korte merknaam + ontbrekende letters aan het eind
  if (token.startsWith(norm) && token.length - norm.length <= 2 && norm.length >= 4) {
    return token.length - norm.length
  }

  return 999
}

function bestHintForWord(word: string, hints: VoiceNameHint[]): VoiceNameHint | null {
  const norm = normalizeSearchText(word)
  if (norm.length < 4 || hints.length === 0) return null

  let best: VoiceNameHint | null = null
  let bestDist = maxEditDistance(norm.length) + 1

  for (const hint of hints) {
    if (hint.token === norm) return hint
    const d = speechMatchDistance(norm, hint.token)
    if (d <= maxEditDistance(norm.length) && d < bestDist) {
      bestDist = d
      best = hint
    }
  }
  return best
}

/** Corrigeer veel voorkomende spraakfouten (bv. «blondies» → Blonkys). */
export function fixVoiceSearchTranscript(raw: string, hints: VoiceNameHint[]): string {
  let trimmed = raw.trim()
  if (!trimmed || hints.length === 0) return trimmed

  trimmed = trimmed
    .replace(/\bbedtel\b/gi, 'bestel')
    .replace(/\bpestel\b/gi, 'bestel')
    .replace(/\brevieuw\b/gi, 'review')
    .replace(/\brecensie\b/gi, 'review')

  // «no lim» / «no lin» → één woord voor merknamen
  trimmed = trimmed.replace(/\bno\s+li[mn]\b/gi, 'nolim')

  const fullNorm = normalizeSearchText(trimmed)
  if (fullNorm.length >= 4) {
    const exact = hints.find((h) => h.token === fullNorm)
    if (exact) return exact.replaceWith
  }

  const parts = trimmed.split(/(\s+)/)
  const out: string[] = []

  for (const part of parts) {
    if (/^\s+$/.test(part) || part.length < 4) {
      out.push(part)
      continue
    }
    const cleaned = part.replace(/^[^a-zA-Z0-9à-üÀ-Ü']+|[^a-zA-Z0-9à-üÀ-Ü']+$/g, '')
    const edgeStart = part.slice(0, part.indexOf(cleaned) || 0)
    const edgeEnd = part.slice(edgeStart.length + cleaned.length)
    const cleanedNorm = normalizeSearchText(cleaned)
    if (PROTECTED_SEARCH_VOCABULARY.has(cleanedNorm)) {
      out.push(part)
      continue
    }
    const hint = bestHintForWord(cleaned, hints)
    if (hint && normalizeSearchText(cleaned) !== hint.token) {
      out.push(`${edgeStart}${hint.replaceWith}${edgeEnd}`)
    } else {
      out.push(part)
    }
  }

  return out.join('').replace(/\s+/g, ' ').trim()
}

/** Hogere score = transcript past beter bij bekende zaaknamen. */
export function scoreVoiceTranscriptAgainstHints(raw: string, hints: VoiceNameHint[]): number {
  const fixed = fixVoiceSearchTranscript(raw, hints)
  const normFixed = normalizeSearchText(fixed)
  let score = 0
  for (const hint of hints) {
    if (hint.token.length < 4) continue
    if (normFixed.includes(hint.token)) score += hint.token.length
  }
  return score
}

export function pickBestVoiceTranscript(candidates: string[], hints: VoiceNameHint[]): string {
  const uniq = [...new Set(candidates.map((c) => c.trim()).filter(Boolean))]
  if (uniq.length === 0) return ''
  if (hints.length === 0) return uniq[0]!

  let best = uniq[0]!
  let bestScore = -1
  for (const c of uniq) {
    const fixed = fixVoiceSearchTranscript(c, hints)
    const score = scoreVoiceTranscriptAgainstHints(fixed, hints)
    if (score > bestScore) {
      bestScore = score
      best = fixed
    }
  }
  return fixVoiceSearchTranscript(best, hints)
}
