import listingsJson from '../../data/listings.json'
import type { Listing, ListingSearchParams, ListingTypeId } from '@/lib/listing-types'
import { LISTING_TYPES } from '@/lib/listing-types'
import { fetchListingBySlugFromDb, fetchPublishedListingsFromDb } from '@/lib/gids-listings-db'
import { normalizeSearchText } from '@/lib/gids-text'
import { parseListingSearchQuery, listingMatchesParsedSearch } from '@/lib/gids-listing-search'
import { formatDeliveryRadiusKm } from '@/lib/listing-delivery-radius'
import { unstable_cache } from 'next/cache'

const jsonFallback = listingsJson as Listing[]

const cachedDbListings = unstable_cache(
  async () => fetchPublishedListingsFromDb(),
  ['gids-published-listings'],
  { revalidate: 60, tags: ['gids-listings'] },
)

/** Supabase is leidend per slug; JSON vult ontbrekende demo-zaken aan tot volledige seed. */
async function loadListings(): Promise<Listing[]> {
  const fromDb = await cachedDbListings()
  const bySlug = new Map<string, Listing>()
  for (const listing of jsonFallback) bySlug.set(listing.slug, listing)
  if (fromDb?.length) {
    for (const listing of fromDb) bySlug.set(listing.slug, listing)
  }
  return Array.from(bySlug.values())
}

export async function getAllListings(): Promise<Listing[]> {
  return loadListings()
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  const fromDb = await fetchListingBySlugFromDb(slug)
  if (fromDb) return fromDb
  return jsonFallback.find((l) => l.slug === slug)
}

/** Alle foto-URL's voor slider (max. 3 in DB). */
export function listingPhotoUrls(listing: Listing): string[] {
  if (listing.photoUrls?.length) return listing.photoUrls
  if (listing.photoUrl?.trim()) return [listing.photoUrl.trim()]
  return []
}

/** Homepage «in de kijker»: eerst best beoordeeld, daarna andere gepubliceerde zaken. */
export async function getFeaturedListings(limit = 4): Promise<Listing[]> {
  const all = await getAllListings()
  if (all.length === 0) return []

  const withReviews = [...all]
    .filter((l) => l.ratingCount > 0)
    .sort((a, b) => {
      if (b.ratingAvg !== a.ratingAvg) return b.ratingAvg - a.ratingAvg
      return b.ratingCount - a.ratingCount
    })

  const picked = new Set<string>()
  const out: Listing[] = []

  const add = (listing: Listing) => {
    if (out.length >= limit || picked.has(listing.slug)) return
    picked.add(listing.slug)
    out.push(listing)
  }

  for (const l of withReviews) add(l)
  for (const l of all) add(l)

  return out
}

export function getListingTypeLabel(type: Listing['type']): string {
  return LISTING_TYPES.find((t) => t.id === type)?.label ?? type
}

/** Zoek op stad, postcode, naam, adres, keukentype of voorzieningen (query `q`). Filter op zaaktype / provincie. */
export async function searchListings(params: ListingSearchParams): Promise<Listing[]> {
  const listings = await loadListings()
  const parsed = parseListingSearchQuery(params.q ?? '')
  const type = (params.type ?? 'all') as ListingTypeId
  const prov = normalizeSearchText(params.prov ?? '')

  return listings.filter((listing) => {
    if (type !== 'all' && listing.type !== type) return false
    if (prov) {
      const listingProv = normalizeSearchText(listing.province ?? '')
      if (!listingProv || listingProv !== prov) return false
    }
    return listingMatchesParsedSearch(listing, parsed)
  })
}

/** Levering tonen alleen als minstens één leveringsveld is ingevuld (niet alleen DB-default). */
export function listingHasDeliveryInfo(listing: Listing): boolean {
  if (!listing.deliveryEnabled) return false
  if (listing.deliveryFeeEur != null) return true
  if (listing.minOrderEur != null) return true
  if (listing.deliveryTimeMin != null && listing.deliveryTimeMax != null) return true
  const km = listing.deliveryRadiusKm
  if (km != null && km > 0) return true
  return false
}

export function formatListingServiceMode(listing: Listing): string {
  const pickup = listing.pickupEnabled !== false
  const delivery = listingHasDeliveryInfo(listing)
  if (pickup && delivery) return 'Afhalen & levering'
  if (delivery) return 'Levering'
  return 'Afhalen'
}

export function formatDeliveryFee(listing: Listing): string | null {
  if (!listingHasDeliveryInfo(listing)) {
    return listing.deliveryEnabled ? null : 'Alleen afhalen'
  }
  if (listing.deliveryFeeEur == null) return null
  if (listing.deliveryFeeEur === 0) return 'Gratis levering'
  return `€${listing.deliveryFeeEur.toFixed(2).replace('.', ',')} levering`
}

export function formatMinOrder(listing: Listing): string | null {
  if (listing.minOrderEur == null) return null
  return `Min. €${listing.minOrderEur.toFixed(2).replace('.', ',')}`
}

export function formatDeliveryRadius(listing: Listing): string | null {
  const km = formatDeliveryRadiusKm(listing.deliveryRadiusKm)
  if (!km) return null
  return `Levering binnen ${km}`
}

/** Openingstijden voor panelen en profiel — altijd zichtbaar */
export function formatOpeningHours(listing: Listing): string {
  const hours = listing.openingHours?.trim()
  if (!hours) {
    return listing.closedDays?.trim()
      ? `Open · ${listing.closedDays} gesloten`
      : 'Openingstijden op aanvraag'
  }
  if (listing.closedDays?.trim() && !hours.toLowerCase().includes(listing.closedDays.toLowerCase())) {
    return `${hours} · ${listing.closedDays} gesloten`
  }
  return hours
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  pelt: { lat: 51.225, lng: 5.437 },
  neerpelt: { lat: 51.228, lng: 5.442 },
  genk: { lat: 50.965, lng: 5.497 },
  hasselt: { lat: 50.931, lng: 5.338 },
  opglabeek: { lat: 51.041, lng: 5.593 },
  dordrecht: { lat: 51.813, lng: 4.673 },
}

export function formatListingAddress(listing: Listing): string {
  const street = listing.address.trim()
  const cityLine = `${listing.postcode} ${listing.city}`.trim()
  return `${street}, ${cityLine}`
}

/** Eerste regel straat, tweede regel postcode + gemeente */
export function formatListingAddressLines(listing: Listing): { street: string; cityLine: string } {
  return {
    street: listing.address.trim(),
    cityLine: `${listing.postcode} ${listing.city}`.trim(),
  }
}

export function getListingCoordinates(listing: Listing): { lat: number; lng: number } {
  if (typeof listing.lat === 'number' && typeof listing.lng === 'number') {
    return { lat: listing.lat, lng: listing.lng }
  }
  const key = normalizeSearchText(listing.city)
  const hit = CITY_COORDS[key]
  if (hit) return hit
  return { lat: 50.85, lng: 4.35 }
}

export async function listingsDataSourceLabel(): Promise<'supabase' | 'json' | 'mixed'> {
  const fromDb = await cachedDbListings()
  const dbCount = fromDb?.length ?? 0
  if (dbCount === 0) return 'json'
  if (dbCount >= jsonFallback.length) return 'supabase'
  return 'mixed'
}
