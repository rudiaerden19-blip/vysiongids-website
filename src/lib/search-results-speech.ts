import { provinceLabel } from '@/lib/belgium-locations'
import { parseListingSearchQuery } from '@/lib/gids-listing-search'
import { normalizeSearchText } from '@/lib/gids-text'
import type { ListingTypeId } from '@/lib/listing-types'

type TypeWords = { one: string; many: string }

const TYPE_WORDS: Partial<Record<Exclude<ListingTypeId, 'all'>, TypeWords>> = {
  frituur: { one: 'frituur', many: 'frituren' },
  pizza: { one: 'pizzeria', many: "pizzeria's" },
  restaurant: { one: 'restaurant', many: 'restaurants' },
  kebab: { one: 'kebabzaak', many: 'kebabzaken' },
  snack: { one: 'snackbar', many: 'snackbars' },
  traiteur: { one: 'traiteur', many: 'traiteurs' },
  sterrenzaak: { one: 'sterrenzaak', many: 'sterrenzaken' },
  broodjeszaak: { one: 'broodjeszaak', many: 'broodjeszaken' },
  chinees: { one: 'Chinees restaurant', many: 'Chinese restaurants' },
  sushi: { one: 'sushi restaurant', many: 'sushi restaurants' },
  cafe: { one: 'café', many: 'cafés' },
  bistro: { one: 'bistro', many: 'bistro\'s' },
}

const DEFAULT_TYPE: TypeWords = { one: 'zaak', many: 'zaken' }

function titleCasePlace(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function typeWordsFromQuery(qNorm: string): TypeWords | null {
  if (!qNorm) return null
  if (/\bfrituur|\bfritu|\bfrieten|\bfriet\b/.test(qNorm)) return TYPE_WORDS.frituur!
  if (/\bpizz/.test(qNorm)) return TYPE_WORDS.pizza!
  if (/\brestaurant|\bresto\b/.test(qNorm)) return TYPE_WORDS.restaurant!
  if (/\bkebab\b/.test(qNorm)) return TYPE_WORDS.kebab!
  if (/\bsushi\b/.test(qNorm)) return TYPE_WORDS.sushi!
  if (/\bchinees|\bchinese\b/.test(qNorm)) return TYPE_WORDS.chinees!
  if (/\bcafe|\bcafé\b/.test(qNorm)) return TYPE_WORDS.cafe!
  if (/\bbistro\b/.test(qNorm)) return TYPE_WORDS.bistro!
  if (/\bsnack\b/.test(qNorm)) return TYPE_WORDS.snack!
  return null
}

export function resolveSearchResultTypeWords(q: string | undefined, type: string | undefined): TypeWords {
  const typeId = (type?.trim() || 'all') as ListingTypeId
  if (typeId !== 'all' && TYPE_WORDS[typeId]) return TYPE_WORDS[typeId]!
  const fromQ = typeWordsFromQuery(normalizeSearchText(q ?? ''))
  return fromQ ?? DEFAULT_TYPE
}

export function resolveSearchResultPlacePhrase(q: string | undefined, prov: string | undefined): string | null {
  const raw = q?.trim() ?? ''
  if (raw) {
    const inMatch = raw.match(/\b(?:in|te)\s+([a-zA-Zà-üÀ-Ü][a-zA-Zà-üÀ-Ü'-\s]{0,38}[a-zA-Zà-üÀ-Ü'])/i)
    if (inMatch?.[1]) {
      return `in ${titleCasePlace(inMatch[1])}`
    }
    const parsed = parseListingSearchQuery(raw)
    const place = parsed.freeText.trim()
    if (place.length >= 2 && place.length <= 32) {
      return `in ${titleCasePlace(place)}`
    }
  }
  const provSlug = prov?.trim()
  if (provSlug) {
    const label = provinceLabel(provSlug)
    if (label && label !== 'België') return `in ${label}`
  }
  return null
}

export function buildSearchResultsSpeechMessage(input: {
  count: number
  q?: string
  type?: string
  prov?: string
}): string {
  const { one, many } = resolveSearchResultTypeWords(input.q, input.type)
  const place = resolveSearchResultPlacePhrase(input.q, input.prov)
  const placeSuffix = place ? ` ${place}` : ''

  if (input.count === 0) {
    return `Wij hebben geen ${many} gevonden voor u${placeSuffix}.`
  }
  if (input.count === 1) {
    return `Wij hebben één ${one} gevonden voor u${placeSuffix}.`
  }
  return `Wij hebben ${input.count} ${many} gevonden voor u${placeSuffix}.`
}
