import type { Listing } from '@/lib/listing-types'
import { LISTING_TYPES } from '@/lib/listing-types'
import { normalizeSearchText } from '@/lib/gids-text'

function listingTypeLabel(type: Listing['type']): string {
  return LISTING_TYPES.find((t) => t.id === type)?.label ?? type
}

/** Woorden aan begin van zaaknaam die niet voor sortering tellen (type/categorie). */
const NAME_SORT_PREFIXES = [
  'frituur',
  'kebab',
  'snack',
  'pizza',
  'pizzeria',
  'restaurant',
  'traiteur',
  'broodjeszaak',
  'café',
  'cafe',
  'bistro',
  'chinees restaurant',
  'chinees',
  'sushi restaurant',
  'sushi',
  'sterrenzaak',
  'bakkerij',
  'slagerij',
  'koffiehuis',
  'lunchroom',
  'foodtruck',
  'ijssalon',
  'wijnhandel',
]

/** Sorteersleutel: echte naam (bv. «Nolim Pelt»), niet «Frituur Nolim Pelt». */
export function listingAlphabeticalSortKey(listing: Listing): string {
  let key = normalizeSearchText(listing.name)
  if (!key) return ''

  const typeLabel = normalizeSearchText(listingTypeLabel(listing.type))
  if (typeLabel && typeLabel !== 'alles') {
    key = stripLeadingToken(key, typeLabel)
  }

  for (let pass = 0; pass < 3; pass++) {
    let changed = false
    for (const prefix of NAME_SORT_PREFIXES) {
      const p = normalizeSearchText(prefix)
      const next = stripLeadingToken(key, p)
      if (next !== key) {
        key = next
        changed = true
      }
    }
    if (!changed) break
  }

  return key || normalizeSearchText(listing.name)
}

function stripLeadingToken(key: string, token: string): string {
  if (!token) return key
  if (key === token) return ''
  const prefix = `${token} `
  if (key.startsWith(prefix)) return key.slice(prefix.length).trim()
  return key
}

export function compareListingsByName(a: Listing, b: Listing): number {
  const ka = listingAlphabeticalSortKey(a)
  const kb = listingAlphabeticalSortKey(b)
  const byName = ka.localeCompare(kb, 'nl', { sensitivity: 'base' })
  if (byName !== 0) return byName
  return normalizeSearchText(a.name).localeCompare(normalizeSearchText(b.name), 'nl', { sensitivity: 'base' })
}
