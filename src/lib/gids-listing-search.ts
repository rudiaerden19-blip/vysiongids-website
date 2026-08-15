import type { Listing, ListingAmenityId } from '@/lib/listing-types'
import { LISTING_TYPES } from '@/lib/listing-types'
import type { ListingCuisineId } from '@/lib/listing-cuisine-types'
import { LISTING_CUISINE_TYPES } from '@/lib/listing-cuisine-types'
import { OWNER_PROFILE_AMENITIES, ownerAmenitiesFromListing } from '@/lib/gids-owner-amenities'
import { normalizeSearchText } from '@/lib/gids-text'

/** Extra zoektermen naast het formulierlabel (typo’s, synoniemen). */
const AMENITY_EXTRA_TERMS: Partial<Record<ListingAmenityId, string[]>> = {
  gluten_free: ['gluten vrij', 'glutten', 'glutten vrij', 'coeliakie'],
  accessible: ['gehandicapten', 'gehandicapte', 'handicap', 'rolstoel', 'wheelchair', 'mindervaliden'],
  parking: ['parkeren', 'parkeerplaats'],
  vegetarian: ['vegetarisch'],
  vegan: ['veganistisch'],
  halal: ['halal'],
  dogs_welcome: ['honden', 'hond welkom', 'honden welkom'],
  child_friendly: ['kinderen', 'kindvriendelijk'],
  terrace: ['terras'],
  takeaway: ['afhalen', 'take away', 'takeaway'],
  delivery: ['levering', 'leveren'],
  wifi: ['wi fi', 'wifi', 'internet'],
  groups_welcome: ['groepen', 'groep'],
  gift_vouchers: ['cadeaubon', 'cadeaubonnen'],
}

const CUISINE_EXTRA_TERMS: Partial<Record<ListingCuisineId, string[]>> = {
  belgisch: ['belgische', 'belgisch'],
  frans: ['franse', 'frans'],
  italiaans: ['italiaanse', 'italiaans'],
  turks: ['turkse', 'turks'],
  grieks: ['griekse', 'grieks'],
  japans: ['japanse', 'japans'],
  chinees: ['chinese', 'chinees'],
  indisch: ['indische', 'indisch'],
  mexicaans: ['mexicaanse', 'mexicaans'],
  amerikaans: ['amerikaanse', 'amerikaans'],
}

export type ParsedListingSearchQuery = {
  cuisineIds: ListingCuisineId[]
  amenityIds: ListingAmenityId[]
  /** Resttekst na verwijderen van herkende keuken-/voorzieningtermen */
  freeText: string
  /** Genormaliseerde termen die uit q zijn gehaald (voor haystack) */
  strippedPhrases: string[]
}

function normalizeQueryWithTypoFix(raw: string): string {
  let q = normalizeSearchText(raw)
  if (!q) return q
  const tokens = q.split(/\s+/).map((t) => {
    if (t.length > 4 && t.startsWith('f') && !t.startsWith('frit')) {
      const trimmed = t.slice(1)
      if (trimmed.length >= 4) return trimmed
    }
    return t
  })
  return tokens.join(' ')
}

function phraseInQuery(qNorm: string, phrase: string): boolean {
  const p = normalizeSearchText(phrase)
  if (p.length < 3) return false
  if (qNorm.includes(p)) return true
  if (p.includes(' ')) return false
  return qNorm.split(/\s+/).some((w) => w === p || w.startsWith(p) || p.startsWith(w))
}

export function parseListingSearchQuery(raw: string): ParsedListingSearchQuery {
  const qNorm = normalizeQueryWithTypoFix(raw)
  const cuisineIds: ListingCuisineId[] = []
  const amenityIds: ListingAmenityId[] = []
  const strippedPhrases: string[] = []

  for (const c of LISTING_CUISINE_TYPES) {
    const phrases = [
      c.label,
      c.label.replace(/\s+keuken$/i, ''),
      c.id,
      ...(CUISINE_EXTRA_TERMS[c.id] ?? []),
    ]
    for (const phrase of phrases) {
      if (phraseInQuery(qNorm, phrase)) {
        if (!cuisineIds.includes(c.id)) cuisineIds.push(c.id)
        strippedPhrases.push(normalizeSearchText(phrase))
        break
      }
    }
  }

  for (const a of OWNER_PROFILE_AMENITIES) {
    const phrases = [a.label, ...(AMENITY_EXTRA_TERMS[a.id] ?? [])]
    for (const phrase of phrases) {
      if (phraseInQuery(qNorm, phrase)) {
        if (!amenityIds.includes(a.id)) amenityIds.push(a.id)
        strippedPhrases.push(normalizeSearchText(phrase))
        break
      }
    }
  }

  let freeText = qNorm
  for (const p of [...new Set(strippedPhrases)].sort((a, b) => b.length - a.length)) {
    if (p.length < 3) continue
    freeText = freeText.split(p).join(' ')
  }
  freeText = freeText.replace(/\s+/g, ' ').trim()

  const amenityIdsFinal =
    cuisineIds.includes('vegetarisch') && amenityIds.includes('vegetarian')
      ? amenityIds.filter((id) => id !== 'vegetarian')
      : amenityIds

  return { cuisineIds, amenityIds: amenityIdsFinal, freeText, strippedPhrases }
}

export function listingSearchHaystack(listing: Listing): string {
  const cuisineLabel =
    LISTING_CUISINE_TYPES.find((c) => c.id === listing.cuisineType)?.label ?? ''
  const amenityLabels = (listing.amenities ?? [])
    .map((id) => OWNER_PROFILE_AMENITIES.find((a) => a.id === id)?.label)
    .filter(Boolean)
    .join(' ')

  return normalizeSearchText(
    [
      listing.name,
      listing.city,
      listing.postcode,
      listing.address,
      listing.type,
      LISTING_TYPES.find((t) => t.id === listing.type)?.label ?? listing.type,
      listing.cuisineType ?? '',
      cuisineLabel,
      amenityLabels,
    ].join(' '),
  )
}

function listingHasAmenity(listing: Listing, id: ListingAmenityId): boolean {
  return ownerAmenitiesFromListing(listing.amenities).has(id)
}

export function listingMatchesTextSearch(listing: Listing, freeText: string): boolean {
  const q = normalizeSearchText(freeText)
  if (!q) return true
  const haystack = listingSearchHaystack(listing)
  if (haystack.includes(q)) return true
  return q.split(/\s+/).every((part) => part.length >= 2 && haystack.includes(part))
}

export function listingMatchesParsedSearch(listing: Listing, parsed: ParsedListingSearchQuery): boolean {
  if (parsed.cuisineIds.length > 0) {
    if (!listing.cuisineType || !parsed.cuisineIds.includes(listing.cuisineType)) return false
  }
  for (const amenityId of parsed.amenityIds) {
    if (!listingHasAmenity(listing, amenityId)) return false
  }
  return listingMatchesTextSearch(listing, parsed.freeText)
}
