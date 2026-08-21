import listingsJson from '../../data/listings.json'
import type { Listing, ListingSearchParams, ListingTypeId } from '@/lib/listing-types'
import { LISTING_TYPES } from '@/lib/listing-types'
import {
  fetchFeaturedHorecaListingsFromDb,
  fetchListingBySlugFromDb,
  fetchPublishedHorecaListingCountFromDb,
  fetchPublishedHorecaListingsForVoiceFromDb,
  fetchPublishedJobListingsFromDb,
} from '@/lib/gids-listings-db'
import {
  fetchHorecaListingsForSearchFromDb,
  GIDS_SEARCH_DB_PREFETCH_MAX,
  planHorecaSearchDbQuery,
} from '@/lib/gids-listings-search-db'
import { isGidsSupabaseConfigured } from '@/lib/supabase-gids'
import { normalizeSearchText } from '@/lib/gids-text'
import { parseListingSearchQuery, listingMatchesParsedSearch } from '@/lib/gids-listing-search'
import { isHorecaListing } from '@/lib/listing-segment'
import { compareListingsByName } from '@/lib/listing-alphabetical-sort'
import { listingDistanceKmFrom } from '@/lib/listing-display'
import { listingHiringIsActive } from '@/lib/listing-hiring'
import { listingHasGidsPremium } from '@/lib/gids-premium'
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

/** Max. resultaten op /zoeken en search-API (rest via verfijnen). */
export const GIDS_SEARCH_MAX_RESULTS = 200

export type ListingSearchOutcome = {
  listings: Listing[]
  total: number
  capped: boolean
}

/** Geen volledige catalogus — max. prefetch voor scripts/diagnostics. */
export async function getAllListings(): Promise<Listing[]> {
  if (!isGidsSupabaseConfigured()) return jsonHorecaListings()
  const plan = planHorecaSearchDbQuery({ type: 'all' }, parseListingSearchQuery(''), GIDS_SEARCH_DB_PREFETCH_MAX)
  const fromDb = await fetchHorecaListingsForSearchFromDb(plan)
  return mergeDbWithJsonHoreca(fromDb ?? [])
}

function jsonHorecaListings(): Listing[] {
  return jsonFallback.filter(isHorecaListing)
}

export function jsonHorecaListingCount(): number {
  return jsonHorecaListings().length
}

function mergeVoiceListingsWithJson(fromDb: Listing[]): Listing[] {
  const bySlug = new Map<string, Listing>()
  for (const listing of jsonHorecaListings()) bySlug.set(listing.slug, listing)
  for (const listing of fromDb) bySlug.set(listing.slug, listing)
  return Array.from(bySlug.values())
}

/** Lichte catalogus voor spraakherkenning & intent (geen volledige DB-load). */
export async function getListingsForVoiceAction(): Promise<Listing[]> {
  return unstable_cache(
    async () => {
      const fromDb = await fetchPublishedHorecaListingsForVoiceFromDb()
      if (fromDb) return mergeVoiceListingsWithJson(fromDb)
      return jsonHorecaListings()
    },
    ['gids-voice-listings'],
    { revalidate: 300, tags: ['gids-listings'] },
  )()
}

/** Vacatures — alleen premium + hiring uit Supabase (geen foto’s / volledige catalogus). */
export async function getJobListings(): Promise<Listing[]> {
  return unstable_cache(
    async () => {
      const fromDb = await fetchPublishedJobListingsFromDb()
      const pool = fromDb ?? jsonHorecaListings()
      return pool.filter(
        (l) => listingHasGidsPremium(l.premiumMember) && listingHiringIsActive(l.infoExtras?.hiring),
      )
    },
    ['gids-job-listings'],
    { revalidate: 60, tags: ['gids-listings'] },
  )()
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
  const fromDb = await unstable_cache(
    async () => fetchFeaturedHorecaListingsFromDb(limit),
    ['gids-featured-listings', String(limit)],
    { revalidate: 60, tags: ['gids-listings'] },
  )()
  if (fromDb?.length) return fromDb.slice(0, limit)

  const horecaOnly = jsonHorecaListings()
  if (horecaOnly.length === 0) return []

  const withReviews = [...horecaOnly]
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
  for (const l of horecaOnly) add(l)

  return out
}

export function getListingTypeLabel(type: Listing['type']): string {
  return LISTING_TYPES.find((t) => t.id === type)?.label ?? type
}

function mergeDbWithJsonHoreca(fromDb: Listing[]): Listing[] {
  const bySlug = new Map<string, Listing>()
  for (const listing of jsonFallback) {
    if (isHorecaListing(listing)) bySlug.set(listing.slug, listing)
  }
  for (const listing of fromDb) bySlug.set(listing.slug, listing)
  return Array.from(bySlug.values())
}

async function loadListingsForSearch(params: ListingSearchParams, parsed: ReturnType<typeof parseListingSearchQuery>): Promise<{
  listings: Listing[]
  dbSimpleBrowseAll: boolean
  prefetchCapped: boolean
}> {
  if (isGidsSupabaseConfigured()) {
    const plan = planHorecaSearchDbQuery(params, parsed, GIDS_SEARCH_MAX_RESULTS)
    const fromDb = await unstable_cache(
      async () => fetchHorecaListingsForSearchFromDb(plan),
      [
        'gids-search-horeca',
        plan.province ?? '',
        plan.listingType ?? '',
        plan.cuisineType ?? '',
        plan.locationKey ?? '',
        plan.textToken ?? '',
        String(plan.limit),
        params.q?.trim() ?? '',
        params.prov?.trim() ?? '',
        params.type ?? 'all',
      ],
      { revalidate: 60, tags: ['gids-listings'] },
    )()
    if (fromDb) {
      return {
        listings: mergeDbWithJsonHoreca(fromDb),
        dbSimpleBrowseAll: plan.simpleBrowseAll,
        prefetchCapped: plan.needsMemoryFilter && fromDb.length >= GIDS_SEARCH_DB_PREFETCH_MAX,
      }
    }

    const retry = await fetchHorecaListingsForSearchFromDb(plan)
    if (retry) {
      return {
        listings: mergeDbWithJsonHoreca(retry),
        dbSimpleBrowseAll: plan.simpleBrowseAll,
        prefetchCapped: plan.needsMemoryFilter && retry.length >= GIDS_SEARCH_DB_PREFETCH_MAX,
      }
    }
  }

  return {
    listings: mergeDbWithJsonHoreca([]),
    dbSimpleBrowseAll: false,
    prefetchCapped: false,
  }
}

/** Zoek op stad, postcode, naam, keukentype of voorzieningen (query `q`). Filter op zaaktype / provincie. */
export async function searchListings(params: ListingSearchParams): Promise<ListingSearchOutcome> {
  const parsed = parseListingSearchQuery(params.q ?? '')
  const loaded = await loadListingsForSearch(params, parsed)
  const listings = loaded.listings
  const prov = normalizeSearchText(params.prov ?? '')

  let results = listings.filter((listing) => {
    if (!isHorecaListing(listing)) return false
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

  const total = loaded.dbSimpleBrowseAll
    ? Math.max(results.length, await fetchPublishedHorecaListingCountFromDb())
    : results.length
  let capped = total > GIDS_SEARCH_MAX_RESULTS || loaded.prefetchCapped
  if (capped && results.length > GIDS_SEARCH_MAX_RESULTS) {
    results = results.slice(0, GIDS_SEARCH_MAX_RESULTS)
  } else if (loaded.dbSimpleBrowseAll && total > GIDS_SEARCH_MAX_RESULTS) {
    results = results.slice(0, GIDS_SEARCH_MAX_RESULTS)
    capped = true
  }

  return { listings: results, total, capped }
}

export async function listingsDataSourceLabel(): Promise<'supabase' | 'json' | 'mixed'> {
  if (!isGidsSupabaseConfigured()) return 'json'
  const dbCount = await fetchPublishedHorecaListingCountFromDb()
  if (dbCount === 0) return 'json'
  if (dbCount >= jsonFallback.length) return 'supabase'
  return 'mixed'
}
