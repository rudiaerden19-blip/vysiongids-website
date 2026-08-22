import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import type { Listing, ListingSearchParams, ListingTypeId } from '@/lib/listing-types'
import type { ParsedListingSearchQuery } from '@/lib/gids-listing-search'
import {
  fetchFirstListingPhotosMap,
  LISTING_BROWSE_SELECT,
  rowsToListings,
  type GidsListingRow,
} from '@/lib/gids-listings-db'
import { normalizeSearchText } from '@/lib/gids-text'
import { createGidsSupabasePublic, isGidsSupabaseConfigured } from '@/lib/supabase-gids'

/** Max rijen uit Supabase vóór amenity/openNow-filter in Node (complexe queries). */
export const GIDS_SEARCH_DB_PREFETCH_MAX = 500

export type HorecaSearchDbPlan = {
  province?: string
  listingType?: string
  cuisineType?: string
  locationKey?: string
  textToken?: string
  limit: number
  needsMemoryFilter: boolean
  simpleBrowseAll: boolean
}

function provinceSlugFromLocationKey(key: string): string | undefined {
  const normalized = normalizeSearchText(key)
  const slugLike = normalized.replace(/\s+/g, '-')
  for (const p of BELGIUM_PROVINCES) {
    if (p.slug === slugLike || normalizeSearchText(p.label) === normalized) return p.slug
  }
  return undefined
}

function escapeIlike(value: string): string {
  return value.replace(/[%_,\\]/g, '').trim()
}

export function planHorecaSearchDbQuery(
  params: ListingSearchParams,
  parsed: ParsedListingSearchQuery,
  maxResults: number,
): HorecaSearchDbPlan {
  const formType = (params.type ?? 'all') as ListingTypeId
  const provForm = params.prov?.trim()

  let listingType: string | undefined
  if (formType !== 'all') listingType = formType
  else if (parsed.typeIds.length === 1) listingType = parsed.typeIds[0]

  let cuisineType: string | undefined
  if (parsed.cuisineIds.length === 1) cuisineType = parsed.cuisineIds[0]

  let province = provForm || undefined
  let locationKey: string | undefined
  if (parsed.locationKeys.length === 1) {
    const key = parsed.locationKeys[0]!
    const provFromLoc = provinceSlugFromLocationKey(key)
    if (provFromLoc) province = province || provFromLoc
    else locationKey = key
  }

  const tokens = parsed.freeText
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
  const textToken = tokens.length === 1 ? tokens[0] : undefined

  const needsMemoryFilter =
    parsed.amenityIds.length > 0 ||
    parsed.openNow ||
    parsed.freeDelivery ||
    parsed.typeIds.length > 1 ||
    parsed.cuisineIds.length > 1 ||
    parsed.locationKeys.length > 1 ||
    tokens.length > 1

  const simpleBrowseAll = !params.q?.trim() && !provForm && formType === 'all'

  const limit = needsMemoryFilter
    ? GIDS_SEARCH_DB_PREFETCH_MAX
    : simpleBrowseAll
      ? maxResults
      : Math.min(GIDS_SEARCH_DB_PREFETCH_MAX, maxResults + 80)

  return {
    province,
    listingType,
    cuisineType,
    locationKey,
    textToken,
    limit,
    needsMemoryFilter,
    simpleBrowseAll,
  }
}

export async function fetchHorecaListingsForSearchFromDb(plan: HorecaSearchDbPlan): Promise<Listing[] | null> {
  if (!isGidsSupabaseConfigured()) return null
  const supabase = createGidsSupabasePublic()
  if (!supabase) return null

  let query = supabase
    .from('gids_listings')
    .select(LISTING_BROWSE_SELECT)
    .eq('status', 'published')
    .or('listing_segment.is.null,listing_segment.eq.horeca')

  if (plan.province) {
    query = query.eq('province', plan.province)
  }
  if (plan.listingType) {
    const t = plan.listingType
    query = query.or(`type.eq.${t},horeca_types.cs.{${t}}`)
  }
  if (plan.cuisineType) {
    query = query.eq('cuisine_type', plan.cuisineType)
  }

  if (plan.locationKey) {
    const key = normalizeSearchText(plan.locationKey)
    if (/^\d{4}$/.test(key)) {
      query = query.ilike('postcode', `${key}%`)
    } else if (key === 'pelt') {
      query = query.or('city.ilike.pelt,city.ilike.overpelt,city.ilike.neerpelt')
    } else {
      const safe = escapeIlike(key)
      if (safe.length >= 2) {
        query = query.ilike('city', `%${safe}%`)
      }
    }
  }

  if (plan.textToken) {
    const safe = escapeIlike(plan.textToken)
    if (safe.length >= 2) {
      query = query.or(
        `name.ilike.%${safe}%,city.ilike.%${safe}%,postcode.ilike.%${safe}%,address.ilike.%${safe}%`,
      )
    }
  }

  const { data, error } = await query.order('name').limit(plan.limit)
  if (error) {
    console.error('[gids] search listings:', error.message)
    return null
  }

  const rawRows = (data ?? []) as unknown as GidsListingRow[]
  const photosById = await fetchFirstListingPhotosMap(
    supabase,
    rawRows.map((r) => r.id),
  )
  return rowsToListings(rawRows, photosById)
}
