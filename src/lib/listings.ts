import listingsJson from '../../data/listings.json'
import type { Listing, ListingSearchParams, ListingTypeId } from '@/lib/listing-types'
import { LISTING_TYPES } from '@/lib/listing-types'
import { fetchListingBySlugFromDb, fetchPublishedListingsFromDb } from '@/lib/gids-listings-db'
import { normalizeSearchText } from '@/lib/gids-text'
import { unstable_cache } from 'next/cache'

const jsonFallback = listingsJson as Listing[]

const cachedDbListings = unstable_cache(
  async () => fetchPublishedListingsFromDb(),
  ['gids-published-listings'],
  { revalidate: 60, tags: ['gids-listings'] },
)

async function loadListings(): Promise<Listing[]> {
  const fromDb = await cachedDbListings()
  if (fromDb && fromDb.length > 0) return fromDb
  return jsonFallback
}

export async function getAllListings(): Promise<Listing[]> {
  return loadListings()
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  const fromDb = await fetchListingBySlugFromDb(slug)
  if (fromDb) return fromDb
  const all = await loadListings()
  return all.find((l) => l.slug === slug)
}

export function getListingTypeLabel(type: Listing['type']): string {
  return LISTING_TYPES.find((t) => t.id === type)?.label ?? type
}

/** Zoek op stad, postcode, naam of adres (query `q`). Filter op keukentype. */
export async function searchListings(params: ListingSearchParams): Promise<Listing[]> {
  const listings = await loadListings()
  const q = normalizeSearchText(params.q ?? '')
  const type = (params.type ?? 'all') as ListingTypeId
  const prov = normalizeSearchText(params.prov ?? '')

  return listings.filter((listing) => {
    if (type !== 'all' && listing.type !== type) return false
    if (prov) {
      const listingProv = normalizeSearchText(listing.province ?? '')
      if (!listingProv || listingProv !== prov) return false
    }
    if (!q) return true
    const haystack = normalizeSearchText(
      [listing.name, listing.city, listing.postcode, listing.address, listing.type].join(' '),
    )
    return haystack.includes(q) || q.split(/\s+/).every((part) => part.length >= 2 && haystack.includes(part))
  })
}

export function formatDeliveryFee(listing: Listing): string {
  if (!listing.deliveryEnabled) return 'Alleen afhalen'
  if (listing.deliveryFeeEur === null || listing.deliveryFeeEur === 0) return 'Gratis levering'
  return `€${listing.deliveryFeeEur.toFixed(2).replace('.', ',')} levering`
}

export function formatMinOrder(listing: Listing): string | null {
  if (listing.minOrderEur == null) return null
  return `Min. €${listing.minOrderEur.toFixed(2).replace('.', ',')}`
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

export async function listingsDataSourceLabel(): Promise<'supabase' | 'json'> {
  const fromDb = await cachedDbListings()
  return fromDb && fromDb.length > 0 ? 'supabase' : 'json'
}
