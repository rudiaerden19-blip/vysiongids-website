import listingsJson from '../../data/listings.json'
import type { Listing, ListingSearchParams, ListingTypeId } from '@/lib/listing-types'
import { LISTING_TYPES } from '@/lib/listing-types'
import { fetchListingBySlugFromDb, fetchPublishedListingsFromDb } from '@/lib/gids-listings-db'
import { normalizeSearchText } from '@/lib/gids-text'
import { parseListingSearchQuery, listingMatchesParsedSearch } from '@/lib/gids-listing-search'
import { compareListingsByName } from '@/lib/listing-alphabetical-sort'
import { listingDistanceKmFrom } from '@/lib/listing-display'
import { unstable_cache } from 'next/cache'

export {
  formatDeliveryFee,
  formatDeliveryRadius,
  formatListingAddress,
  formatListingAddressLines,
  formatListingDeliveryTime,
  formatListingPickupTime,
  formatListingServiceMode,
  formatMinOrder,
  formatOpeningHours,
  getListingCoordinates,
  listingCoordinatesForDistance,
  listingDistanceKmFrom,
  listingHasDeliveryInfo,
  listingPhotoUrls,
} from '@/lib/listing-display'

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
  return unstable_cache(
    async () => {
      const fromDb = await fetchListingBySlugFromDb(slug)
      if (fromDb) return fromDb
      return jsonFallback.find((l) => l.slug === slug)
    },
    ['gids-listing-by-slug', slug],
    { revalidate: 60, tags: ['gids-listings', `gids-listing-${slug}`] },
  )()
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

/** Zoek op stad, postcode, naam, keukentype of voorzieningen (query `q`). Filter op zaaktype / provincie. */
export async function searchListings(params: ListingSearchParams): Promise<Listing[]> {
  const listings = await loadListings()
  const parsed = parseListingSearchQuery(params.q ?? '')
  const prov = normalizeSearchText(params.prov ?? '')

  let results = listings.filter((listing) => {
    const formType = (params.type ?? 'all') as ListingTypeId
    if (formType !== 'all' && parsed.typeIds.length === 0 && listing.type !== formType) {
      return false
    }
    if (prov) {
      const listingProv = normalizeSearchText(listing.province ?? '')
      if (!listingProv || listingProv !== prov) return false
    }
    return listingMatchesParsedSearch(listing, parsed)
  })

  const nearLat = params.nearLat
  const nearLng = params.nearLng
  const hasNearPoint = typeof nearLat === 'number' && typeof nearLng === 'number'
  if (hasNearPoint && (parsed.nearby || parsed.openNow)) {
    const from = { lat: nearLat, lng: nearLng }
    const maxKm = params.nearMaxKm ?? 40
    results = results
      .map((listing) => ({
        listing,
        km: listingDistanceKmFrom(listing, from) ?? Infinity,
      }))
      .filter(({ km }) => km <= maxKm)
      .sort((a, b) => a.km - b.km)
      .map(({ listing }) => listing)
  } else {
    results.sort(compareListingsByName)
  }

  return results
}

export async function listingsDataSourceLabel(): Promise<'supabase' | 'json' | 'mixed'> {
  const fromDb = await cachedDbListings()
  const dbCount = fromDb?.length ?? 0
  if (dbCount === 0) return 'json'
  if (dbCount >= jsonFallback.length) return 'supabase'
  return 'mixed'
}
