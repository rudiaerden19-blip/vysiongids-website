import { provinceLabel } from '@/lib/belgium-locations'
import type { Listing, ListingAmenityId, ListingTypeId } from '@/lib/listing-types'
import { LISTING_TYPES } from '@/lib/listing-types'
import type { ListingCuisineId } from '@/lib/listing-cuisine-types'
import { LISTING_CUISINE_TYPES } from '@/lib/listing-cuisine-types'
import { OWNER_PROFILE_AMENITIES, ownerAmenitiesFromListing } from '@/lib/gids-owner-amenities'
import { isListingOpenNow } from '@/lib/listing-info'
import { normalizeSearchText } from '@/lib/gids-text'

/** Extra zoektermen naast het formulierlabel (typo’s, synoniemen, spraak). */
const AMENITY_EXTRA_TERMS: Partial<Record<ListingAmenityId, string[]>> = {
  gluten_free: ['gluten vrij', 'glutten', 'glutten vrij', 'coeliakie', 'zonder gluten'],
  accessible: ['gehandicapten', 'gehandicapte', 'handicap', 'rolstoel', 'wheelchair', 'mindervaliden', 'toegankelijk'],
  parking: ['parkeren', 'parkeerplaats', 'parkeer'],
  vegetarian: ['vegetarisch', 'veggie'],
  vegan: ['veganistisch', 'plantbased', 'plant based'],
  halal: ['halal'],
  dogs_welcome: ['honden', 'hond welkom', 'honden welkom', 'hondvriendelijk'],
  child_friendly: ['kinderen', 'kindvriendelijk', 'kinderstoel'],
  terrace: ['terras', 'buiten zitten'],
  takeaway: ['afhalen', 'take away', 'takeaway', 'take-away', 'om mee te nemen', 'met afhalen', 'afhaal'],
  delivery: [
    'levering',
    'leveren',
    'bezorging',
    'bezorgen',
    'met levering',
    'met bezorging',
    'die leveren',
    'leveren aan huis',
    'thuisbezorgd',
    'thuis bezorgd',
    'aan huis',
  ],
  wifi: ['wi fi', 'wifi', 'internet', 'draadloos internet'],
  groups_welcome: ['groepen', 'groep', 'groepsbestelling'],
  gift_vouchers: ['cadeaubon', 'cadeaubonnen', 'cadeau bon'],
  bancontact: ['bancontact', 'payconiq', 'betaalkaart', 'pin betalen'],
}

const CUISINE_EXTRA_TERMS: Partial<Record<ListingCuisineId, string[]>> = {
  belgisch: ['belgische', 'belgisch', 'stoverij', 'stoofvlees'],
  frans: ['franse', 'frans'],
  italiaans: ['italiaanse', 'italiaans', 'pasta'],
  turks: ['turkse', 'turks'],
  grieks: ['griekse', 'grieks'],
  japans: ['japanse', 'japans'],
  chinees: ['chinese', 'chinees', 'wok'],
  indisch: ['indische', 'indisch', 'curry'],
  mexicaans: ['mexicaanse', 'mexicaans'],
  amerikaans: ['amerikaanse', 'amerikaans', 'burger', 'burgers'],
  grill: ['grill', 'bbq'],
  sushi: ['sushi', 'sushis'],
  pizzeria: ['pizzeria'],
  vegetarisch: ['vegetarische keuken'],
}

type ListingTypeSearchId = Exclude<ListingTypeId, 'all'>

const LISTING_TYPE_SEARCH: Array<{ type: ListingTypeSearchId; phrases: string[] }> = [
  { type: 'frituur', phrases: ['frituur', 'friet', 'friture', 'frieten', 'frituurzaak'] },
  { type: 'kebab', phrases: ['kebab', 'kebap', 'doner', 'döner', 'durum'] },
  { type: 'pizza', phrases: ['pizza', 'pizzas'] },
  { type: 'snack', phrases: ['snack', 'snackbar', 'snack bar'] },
  { type: 'traiteur', phrases: ['traiteur', 'catering'] },
  { type: 'restaurant', phrases: ['restaurant', 'restaurants', 'resto'] },
  { type: 'sterrenzaak', phrases: ['sterrenzaak', 'sterren restaurant', 'michelin'] },
  { type: 'broodjeszaak', phrases: ['broodjeszaak', 'broodjes', 'sandwich'] },
  { type: 'chinees', phrases: ['chinees restaurant', 'chinees'] },
  { type: 'sushi', phrases: ['sushi restaurant'] },
  { type: 'cafe', phrases: ['cafe', 'café', 'koffiehuis'] },
  { type: 'bistro', phrases: ['bistro'] },
]

const OPEN_NOW_PHRASES = [
  'nu open',
  'nu geopend',
  'open nu',
  'momenteel open',
  'is open',
  'nu nog open',
  'open now',
  'vandaag open',
  'nog open',
]

const GRATIS_LEVERING_PHRASES = ['gratis levering', 'geen leveringskosten', 'free delivery', 'gratis bezorging']

const QUERY_STOPWORDS = new Set([
  'met',
  'in',
  'te',
  'bij',
  'de',
  'het',
  'een',
  'van',
  'voor',
  'op',
  'aan',
  'die',
  'dat',
  'waar',
  'naar',
  'zo',
  'en',
  'of',
  'maar',
  'ook',
  'alle',
  'allemaal',
])

export type ParsedListingSearchQuery = {
  cuisineIds: ListingCuisineId[]
  amenityIds: ListingAmenityId[]
  typeIds: ListingTypeSearchId[]
  openNow: boolean
  freeDelivery: boolean
  /** Resttekst na verwijderen van herkende termen (stad, naam, …) */
  freeText: string
  strippedPhrases: string[]
}

function normalizeQueryWithTypoFix(raw: string): string {
  let q = normalizeSearchText(raw)
  if (!q) return q
  if (q === 'alles' || q === 'alle' || q === 'all') return ''
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
  if (!qNorm) return false
  const p = normalizeSearchText(phrase)
  if (p.length < 3) return false
  if (qNorm.includes(p)) return true
  if (p.includes(' ')) return false
  return qNorm.split(/\s+/).some((w) => {
    if (!w) return false
    return w === p || w.startsWith(p) || (w.length >= 3 && p.startsWith(w))
  })
}

function stripPhrasesFromQuery(qNorm: string, phrases: string[]): string {
  let out = qNorm
  for (const phrase of [...new Set(phrases)].sort((a, b) => b.length - a.length)) {
    const p = normalizeSearchText(phrase)
    if (p.length < 3) continue
    out = out.split(p).join(' ')
  }
  return out.replace(/\s+/g, ' ').trim()
}

function listingHasDeliveryInfoForSearch(listing: Listing): boolean {
  if (!listing.deliveryEnabled) return false
  if (listing.deliveryFeeEur != null) return true
  if (listing.minOrderEur != null) return true
  if (listing.deliveryTimeMin != null && listing.deliveryTimeMax != null) return true
  const km = listing.deliveryRadiusKm
  if (km != null && km > 0) return true
  return false
}

function listingHasAmenity(listing: Listing, id: ListingAmenityId): boolean {
  const stored = listing.amenities
  if (stored != null) {
    return ownerAmenitiesFromListing(stored).has(id)
  }
  if (id === 'takeaway') return listing.pickupEnabled !== false
  if (id === 'delivery') return listingHasDeliveryInfoForSearch(listing)
  return false
}

export function parseListingSearchQuery(raw: string): ParsedListingSearchQuery {
  const qNorm = normalizeQueryWithTypoFix(raw)
  if (!qNorm) {
    return {
      cuisineIds: [],
      amenityIds: [],
      typeIds: [],
      openNow: false,
      freeDelivery: false,
      freeText: '',
      strippedPhrases: [],
    }
  }

  const cuisineIds: ListingCuisineId[] = []
  const amenityIds: ListingAmenityId[] = []
  const typeIds: ListingTypeSearchId[] = []
  const strippedPhrases: string[] = []
  let openNow = false
  let freeDelivery = false

  for (const phrase of GRATIS_LEVERING_PHRASES) {
    if (phraseInQuery(qNorm, phrase)) {
      freeDelivery = true
      if (!amenityIds.includes('delivery')) amenityIds.push('delivery')
      strippedPhrases.push(normalizeSearchText(phrase))
      break
    }
  }

  for (const phrase of OPEN_NOW_PHRASES) {
    if (phraseInQuery(qNorm, phrase)) {
      openNow = true
      strippedPhrases.push(normalizeSearchText(phrase))
      break
    }
  }

  if (qNorm.length >= 3) {
    for (const { type, phrases } of LISTING_TYPE_SEARCH) {
      for (const phrase of phrases) {
        if (phraseInQuery(qNorm, phrase)) {
          if (!typeIds.includes(type)) typeIds.push(type)
          strippedPhrases.push(normalizeSearchText(phrase))
          break
        }
      }
    }

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
  }

  let freeText = stripPhrasesFromQuery(qNorm, strippedPhrases)
  freeText = freeText
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !QUERY_STOPWORDS.has(w))
    .join(' ')

  const amenityIdsFinal =
    cuisineIds.includes('vegetarisch') && amenityIds.includes('vegetarian')
      ? amenityIds.filter((id) => id !== 'vegetarian')
      : amenityIds

  return {
    cuisineIds,
    amenityIds: amenityIdsFinal,
    typeIds,
    openNow,
    freeDelivery,
    freeText,
    strippedPhrases,
  }
}

export function listingSearchHaystack(listing: Listing): string {
  const cuisineLabel =
    LISTING_CUISINE_TYPES.find((c) => c.id === listing.cuisineType)?.label ?? ''
  const amenityLabels = (listing.amenities ?? [])
    .map((id) => OWNER_PROFILE_AMENITIES.find((a) => a.id === id)?.label)
    .filter(Boolean)
    .join(' ')
  const provLabel = listing.province ? provinceLabel(listing.province) : ''

  return normalizeSearchText(
    [
      listing.name,
      listing.city,
      listing.postcode,
      listing.address,
      listing.province ?? '',
      provLabel,
      listing.type,
      LISTING_TYPES.find((t) => t.id === listing.type)?.label ?? listing.type,
      listing.cuisineType ?? '',
      cuisineLabel,
      amenityLabels,
    ].join(' '),
  )
}

export function listingMatchesTextSearch(listing: Listing, freeText: string): boolean {
  const q = normalizeSearchText(freeText)
  if (!q) return true
  const haystack = listingSearchHaystack(listing)
  if (haystack.includes(q)) return true
  return q.split(/\s+/).every((part) => part.length >= 2 && haystack.includes(part))
}

export function listingMatchesParsedSearch(listing: Listing, parsed: ParsedListingSearchQuery): boolean {
  if (parsed.openNow && !isListingOpenNow(listing)) return false

  if (parsed.typeIds.length > 0 && !parsed.typeIds.includes(listing.type)) return false

  if (parsed.cuisineIds.length > 0) {
    if (!listing.cuisineType || !parsed.cuisineIds.includes(listing.cuisineType)) return false
  }

  for (const amenityId of parsed.amenityIds) {
    if (!listingHasAmenity(listing, amenityId)) return false
  }

  if (parsed.freeDelivery) {
    if (!listingHasDeliveryInfoForSearch(listing)) return false
    if (listing.deliveryFeeEur !== 0) return false
  }

  return listingMatchesTextSearch(listing, parsed.freeText)
}
