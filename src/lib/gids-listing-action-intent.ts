import type { Listing } from '@/lib/listing-types'
import { fixVoiceSearchTranscript, type VoiceNameHint, buildVoiceNameHints } from '@/lib/voice-search-transcript-fix'
import { normalizeSearchText } from '@/lib/gids-text'

export type ListingActionIntent =
  | { kind: 'search'; failedAction?: 'order' | 'review' }
  | { kind: 'review'; slug: string; listingName: string; path: string }
  | { kind: 'order'; slug: string; listingName: string; orderUrl: string }

const FILLER = new Set([
  'de',
  'het',
  'een',
  'van',
  'voor',
  'bij',
  'aan',
  'naar',
  'op',
  'in',
  'te',
  'die',
  'dat',
  'er',
  'maar',
  'even',
  'eens',
  'mij',
  'me',
  'mijn',
])

/** Spraakherkenning: veel voorkomende STT-fouten. */
export function normalizeVoiceActionQuery(raw: string): string {
  return raw
    .replace(/\bbedtel\b/gi, 'bestel')
    .replace(/\bpestel\b/gi, 'bestel')
    .replace(/\bbesteld\b/gi, 'bestel')
    .replace(/\bbestellen\b/gi, 'bestel')
    .replace(/\bordere\b/gi, 'order')
    .replace(/\bordern\b/gi, 'order')
    .replace(/\brevieuw\b/gi, 'review')
    .replace(/\brevieww\b/gi, 'review')
    .replace(/\brevieu\b/gi, 'review')
    .replace(/\brecensie\b/gi, 'review')
    .replace(/\bbeoordeel\b/gi, 'beoordeling')
}

const TYPE_WORDS = new Set([
  'frituur',
  'kebab',
  'pizza',
  'snack',
  'snackbar',
  'restaurant',
  'resto',
  'pizzeria',
  'café',
  'cafe',
  'bistro',
  'traiteur',
  'broodjeszaak',
  'sushi',
  'chinees',
  'chinese',
  'sterrenzaak',
  'eethuis',
  'grill',
  'house',
])

function detectActionKind(qNorm: string): 'review' | 'order' | null {
  if (
    /\b(geef|schrijf|plaats|zet)\s+(een\s+)?review\b/.test(qNorm) ||
    /\breview\s+(voor|van|bij|aan|over)\b/.test(qNorm) ||
    /\b(een\s+)?review\s+(voor|van|bij)\b/.test(qNorm) ||
    /\bbeoordeling(\s+geven|\s+schrijven)?\b/.test(qNorm) ||
    /\bsterren\s+geven\b/.test(qNorm)
  ) {
    return 'review'
  }
  if (
    /\b(bestellen|bestel|orderen|order)\b/.test(qNorm) ||
    /\bbestel\s+bij\b/.test(qNorm) ||
    /\bonline\s+bestellen\b/.test(qNorm) ||
    /\b(iets|eten|food)\s+bestellen\b/.test(qNorm)
  ) {
    return 'order'
  }
  return null
}

function stripActionPhrases(qNorm: string): string {
  return qNorm
    .replace(/\b(geef|schrijf|plaats|zet)\s+(een\s+)?review\b/g, ' ')
    .replace(/\breview\s+(voor|van|bij|aan|over)\b/g, ' ')
    .replace(/\b(een\s+)?review\b/g, ' ')
    .replace(/\bbeoordeling(\s+geven|\s+schrijven)?\b/g, ' ')
    .replace(/\bbeoordeel\b/g, ' ')
    .replace(/\bsterren\s+geven\b/g, ' ')
    .replace(/\bonline\s+bestellen\b/g, ' ')
    .replace(/\b(iets|eten|food)\s+bestellen\b/g, ' ')
    .replace(/\b(bestellen|bestel|bedtel|orderen|order)\b/g, ' ')
    .replace(/^\s*bij\s+|\s+bij\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function listingMatchScore(listing: Listing, nameQuery: string): number {
  const q = normalizeSearchText(nameQuery)
  if (!q || q.length < 2) return 0

  const name = normalizeSearchText(listing.name)
  const slugWords = normalizeSearchText(listing.slug.replace(/-/g, ' '))
  const city = normalizeSearchText(listing.city)

  let score = 0

  if (name === q) score += 200
  else if (name.includes(q) || q.includes(name)) score += 120

  if (slugWords.includes(q) || q.split(/\s+/).every((w) => w.length >= 3 && slugWords.includes(w))) {
    score += 100
  }

  const qTokens = q.split(/\s+/).filter((w) => w.length >= 3 && !FILLER.has(w))
  const distinctive = qTokens.filter((w) => !TYPE_WORDS.has(w))

  if (qTokens.length > 0) {
    let hits = 0
    for (const t of qTokens) {
      if (name.includes(t) || slugWords.includes(t) || city.includes(t)) hits++
    }
    score += hits * 35
  }

  if (distinctive.length > 0) {
    let dHits = 0
    for (const t of distinctive) {
      if (name.includes(t) || slugWords.includes(t)) dHits++
      for (const part of listing.slug.split('-')) {
        if (part.length >= 4 && (part === t || part.startsWith(t) || t.startsWith(part))) {
          score += 55
        }
      }
    }
    if (dHits === distinctive.length) score += 40
  }

  if (qTokens.length === 1 && qTokens[0]!.length >= 4) {
    const t = qTokens[0]!
    for (const part of listing.slug.split('-')) {
      if (part.length >= 4 && (part.startsWith(t) || t.startsWith(part))) score += 45
    }
  }

  return score
}

function pickListing(nameQuery: string, listings: Listing[]): Listing | null {
  let best: Listing | null = null
  let bestScore = 0
  for (const listing of listings) {
    const score = listingMatchScore(listing, nameQuery)
    if (score > bestScore) {
      bestScore = score
      best = listing
    }
  }
  if (bestScore >= 50) return best

  const slim = nameQuery
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !FILLER.has(w) && !TYPE_WORDS.has(w))
    .join(' ')
  if (slim && slim !== nameQuery) {
    return pickListing(slim, listings)
  }
  return bestScore >= 45 ? best : null
}

export function getListingActionFailureSpeech(raw: string, listings: Listing[]): string | null {
  const hints: VoiceNameHint[] = buildVoiceNameHints(listings)
  const fixed = fixVoiceSearchTranscript(normalizeVoiceActionQuery(raw.trim()), hints)
  const qNorm = normalizeSearchText(fixed)
  if (!qNorm) return null
  const kind = detectActionKind(qNorm)
  if (!kind) return null
  const nameQuery = stripActionPhrases(qNorm)
  if (pickListing(nameQuery, listings)) return null
  if (kind === 'order') {
    return 'Ik vond die zaak niet om te bestellen. Zeg bestel bij, en de volledige zaaknaam.'
  }
  return 'Ik vond die zaak niet voor een review.'
}

export function resolveListingActionIntent(raw: string, listings: Listing[]): ListingActionIntent {
  const hints: VoiceNameHint[] = buildVoiceNameHints(listings)
  const fixed = fixVoiceSearchTranscript(normalizeVoiceActionQuery(raw.trim()), hints)
  const qNorm = normalizeSearchText(fixed)
  if (!qNorm) return { kind: 'search' }

  const kind = detectActionKind(qNorm)
  if (!kind) return { kind: 'search' }

  const nameQuery = stripActionPhrases(qNorm)
  const listing = pickListing(nameQuery, listings)
  if (!listing) return { kind: 'search', failedAction: kind }

  if (kind === 'review') {
    return {
      kind: 'review',
      slug: listing.slug,
      listingName: listing.name,
      path: `/zaak/${listing.slug}/reviews#schrijven`,
    }
  }

  const orderUrl = listing.orderUrl?.trim()
  if (!orderUrl) {
    return {
      kind: 'order',
      slug: listing.slug,
      listingName: listing.name,
      orderUrl: `/zaak/${listing.slug}`,
    }
  }

  return {
    kind: 'order',
    slug: listing.slug,
    listingName: listing.name,
    orderUrl: orderUrl.includes('://') ? orderUrl : `https://${orderUrl}`,
  }
}
