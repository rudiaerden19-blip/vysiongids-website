import type { Listing, ListingAmenityId } from '@/lib/listing-types'
import { normalizeListingInfoExtras } from '@/lib/listing-info-extras'
import { gidsBusinessNameLookupKeys } from '@/lib/gids-text'
import { resolveListingPremiumActive } from '@/lib/gids-premium'
import { resolveDienstenListingActive } from '@/lib/gids-diensten-membership'
import { LISTING_SEGMENT_HORECA } from '@/lib/listing-segment'
import { horecaTypesFromDbRow } from '@/lib/listing-horeca-types'
import { createGidsSupabaseAdmin, createGidsSupabasePublic, isGidsSupabaseConfigured } from '@/lib/supabase-gids'

type PhotoRow = { sort_order: number; public_url: string }

export type GidsListingRow = {
  id: string
  slug: string
  name: string
  name_normalized?: string
  pin_hash?: string
  status?: string
  type: string
  horeca_types?: string[] | null
  cuisine_type?: string | null
  city: string
  postcode: string
  province: string | null
  address: string
  order_url: string
  menu_url?: string | null
  menu_pdf_path?: string | null
  menu_pdf_public_url?: string | null
  menu_catalog_active?: boolean | null
  website: string | null
  phone: string | null
  email: string | null
  opening_hours: string | null
  closed_days: string | null
  hours_by_day: Listing['hoursByDay'] | null
  amenities: ListingAmenityId[] | null
  rating_avg: number | null
  rating_count: number | null
  delivery_time_min: number | null
  delivery_time_max: number | null
  pickup_time_min: number | null
  pickup_time_max: number | null
  delivery_radius_km?: number | null
  delivery_fee_eur: number | null
  min_order_eur: number | null
  pickup_enabled: boolean | null
  delivery_enabled: boolean | null
  lat: number | null
  lng: number | null
  info_extras?: unknown
  premium_member?: boolean | null
  premium_paid_at?: string | null
  premium_expires_at?: string | null
  premium_paused?: boolean | null
  listing_segment?: string | null
  service_categories?: string[] | null
  service_description?: string | null
  diensten_paid_at?: string | null
  diensten_expires_at?: string | null
  created_at?: string
  updated_at?: string
  claimed_at?: string | null
  gids_listing_photos?: PhotoRow[] | null
}

const PUBLIC_LISTING_COLUMNS = `
  id,
  slug,
  name,
  status,
  type,
  cuisine_type,
  city,
  postcode,
  province,
  address,
  order_url,
  menu_url,
  menu_pdf_path,
  menu_pdf_public_url,
  menu_catalog_active,
  website,
  phone,
  email,
  opening_hours,
  closed_days,
  hours_by_day,
  amenities,
  rating_avg,
  rating_count,
  delivery_time_min,
  delivery_time_max,
  pickup_time_min,
  pickup_time_max,
  delivery_radius_km,
  delivery_fee_eur,
  min_order_eur,
  pickup_enabled,
  delivery_enabled,
  lat,
  lng,
  info_extras,
  premium_member,
  premium_paid_at,
  premium_expires_at,
  premium_paused,
  listing_segment,
  service_categories,
  service_description,
  diensten_paid_at,
  diensten_expires_at,
  created_at,
  updated_at,
  claimed_at
`.replace(/\s+/g, ' ')

/** Geen embedded foto's — browse/zoeken haalt thumbnails in batch (1 per zaak). */
export const LISTING_BROWSE_SELECT = `
  id,
  slug,
  name,
  status,
  type,
  cuisine_type,
  city,
  postcode,
  province,
  address,
  order_url,
  menu_url,
  menu_catalog_active,
  website,
  phone,
  email,
  opening_hours,
  closed_days,
  hours_by_day,
  amenities,
  info_extras,
  rating_avg,
  rating_count,
  delivery_time_min,
  delivery_time_max,
  pickup_time_min,
  pickup_time_max,
  delivery_radius_km,
  delivery_fee_eur,
  min_order_eur,
  pickup_enabled,
  delivery_enabled,
  lat,
  lng,
  premium_member,
  premium_paid_at,
  premium_expires_at,
  premium_paused,
  listing_segment,
  service_categories,
  service_description,
  diensten_expires_at,
  created_at,
  updated_at,
  claimed_at
`.replace(/\s+/g, ' ')

/** Service role: anon heeft kolom-grants (017) — horeca_types alleen via admin of extra GRANT. */
const LISTING_BROWSE_HORECA_TYPES_SUFFIX = ', horeca_types'

export function listingBrowseSelect(includeHorecaTypes: boolean): string {
  return includeHorecaTypes ? `${LISTING_BROWSE_SELECT}${LISTING_BROWSE_HORECA_TYPES_SUFFIX}` : LISTING_BROWSE_SELECT
}

/** Server-side listing reads: admin (incl. horeca_types) → anders anon zonder horeca_types. */
export function gidsListingBrowseReader(): {
  client: NonNullable<ReturnType<typeof createGidsSupabasePublic>>
  select: string
} | null {
  if (!isGidsSupabaseConfigured()) return null
  const admin = createGidsSupabaseAdmin()
  if (admin) {
    return { client: admin, select: listingBrowseSelect(true) }
  }
  const pub = createGidsSupabasePublic()
  if (!pub) return null
  return { client: pub, select: listingBrowseSelect(false) }
}

const LISTING_VOICE_SELECT = `
  id,
  slug,
  name,
  type,
  city,
  postcode,
  province,
  address,
  order_url,
  lat,
  lng,
  status,
  listing_segment
`.replace(/\s+/g, ' ')

const LISTING_JOBS_SELECT = `
  id,
  slug,
  name,
  type,
  city,
  postcode,
  province,
  address,
  phone,
  email,
  info_extras,
  premium_member,
  premium_paused,
  premium_expires_at,
  updated_at,
  status,
  listing_segment
`.replace(/\s+/g, ' ')

const LISTING_PUBLIC_SELECT = `
  ${PUBLIC_LISTING_COLUMNS},
  gids_listing_photos ( sort_order, public_url )
`

const LISTING_SELECT = `
  *,
  gids_listing_photos ( sort_order, public_url )
`

type ListingPhotoClient = ReturnType<typeof createGidsSupabasePublic>

export async function fetchFirstListingPhotosMap(
  supabase: NonNullable<ListingPhotoClient>,
  listingIds: string[],
): Promise<Map<string, PhotoRow[]>> {
  const map = new Map<string, PhotoRow[]>()
  const unique = [...new Set(listingIds.filter(Boolean))]
  if (unique.length === 0) return map

  const chunkSize = 80
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize)
    const { data, error } = await supabase
      .from('gids_listing_photos')
      .select('listing_id, sort_order, public_url')
      .in('listing_id', chunk)
      .order('sort_order', { ascending: true })
    if (error) {
      console.error('[gids] batch listing photos:', error.message)
      continue
    }
    for (const row of data ?? []) {
      const lid = row.listing_id as string
      if (map.has(lid)) continue
      map.set(lid, [{ sort_order: row.sort_order as number, public_url: row.public_url as string }])
    }
  }
  return map
}

async function fetchAllListingPhotosForId(
  supabase: NonNullable<ListingPhotoClient>,
  listingId: string,
): Promise<PhotoRow[]> {
  const { data, error } = await supabase
    .from('gids_listing_photos')
    .select('sort_order, public_url')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true })
  if (error) {
    console.error('[gids] listing photos:', error.message)
    return []
  }
  return (data ?? []) as PhotoRow[]
}

export function rowsToListings(rows: GidsListingRow[], photosByListingId: Map<string, PhotoRow[]>): Listing[] {
  return rows.map((row) => {
    const photos = photosByListingId.get(row.id) ?? row.gids_listing_photos ?? []
    return mapGidsRowToListing({ ...row, gids_listing_photos: photos })
  })
}

export type GidsPublishedListingsFilter = {
  province?: string
  type?: string
  listingSegment?: 'horeca' | 'diensten'
  /** Alleen actieve diensten-lidmaatschappen (voor diensten-zoeken) */
  dienstenActiveOnly?: boolean
}

export function mapGidsRowToListing(row: GidsListingRow): Listing {
  const photos = [...(row.gids_listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const photoUrl = photos[0]?.public_url ?? '/images/placeholder-frituur.svg'
  const photoUrls = photos.map((p) => p.public_url).filter(Boolean)

  return {
    slug: row.slug,
    name: row.name,
    type: row.type as Listing['type'],
    horecaTypes: horecaTypesFromDbRow(row.type, row.horeca_types),
    cuisineType: (row.cuisine_type as Listing['cuisineType']) ?? undefined,
    city: row.city,
    postcode: row.postcode,
    province: row.province ?? undefined,
    address: row.address,
    orderUrl: row.order_url,
    menuUrl: row.menu_url?.trim() || undefined,
    menuPdfUrl: row.menu_pdf_public_url?.trim() || undefined,
    hasMenuCatalog: Boolean(row.menu_catalog_active),
    photoUrl,
    photoUrls,
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    deliveryTimeMin: row.delivery_time_min ?? undefined,
    deliveryTimeMax: row.delivery_time_max ?? undefined,
    pickupTimeMin: row.pickup_time_min ?? undefined,
    pickupTimeMax: row.pickup_time_max ?? undefined,
    deliveryRadiusKm:
      row.delivery_radius_km == null ? null : Number(row.delivery_radius_km),
    deliveryFeeEur: row.delivery_fee_eur == null ? null : Number(row.delivery_fee_eur),
    minOrderEur: row.min_order_eur == null ? null : Number(row.min_order_eur),
    pickupEnabled: row.pickup_enabled ?? true,
    deliveryEnabled: row.delivery_enabled ?? true,
    openingHours: row.opening_hours?.trim() || 'Openingstijden op aanvraag',
    closedDays: row.closed_days ?? undefined,
    website: row.website ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    hoursByDay: row.hours_by_day ?? undefined,
    amenities: row.amenities ?? undefined,
    infoExtras: normalizeListingInfoExtras(row.info_extras),
    premiumMember: resolveListingPremiumActive({
      premium_member: row.premium_member,
      premium_paused: row.premium_paused,
      premium_expires_at: row.premium_expires_at,
    }),
    listingSegment:
      row.listing_segment === 'diensten' ? 'diensten' : (LISTING_SEGMENT_HORECA as 'horeca'),
    serviceCategories: row.service_categories?.length ? [...row.service_categories] : undefined,
    serviceDescription: row.service_description?.trim() || undefined,
    dienstenActive: resolveDienstenListingActive({
      listing_segment: row.listing_segment,
      diensten_expires_at: row.diensten_expires_at,
      status: row.status ?? 'published',
    }),
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    claimedAt: row.claimed_at ?? undefined,
  }
}

export async function fetchPublishedListingCountFromDb(): Promise<number> {
  if (!isGidsSupabaseConfigured()) return 0
  const supabase = createGidsSupabasePublic()
  if (!supabase) return 0
  const { count, error } = await supabase
    .from('gids_listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
  if (error) {
    console.error('[gids] count listings:', error.message)
    return 0
  }
  return count ?? 0
}

/** Server-only: alle gepubliceerde listings (horeca + diensten), zonder RLS-beperking. */
export async function fetchPublishedListingCountAdmin(): Promise<number | null> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return null
  const { count, error } = await admin
    .from('gids_listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
  if (error) {
    console.error('[gids] count listings admin:', error.message)
    return null
  }
  return count ?? 0
}

/** Server-only: som van horeca-type-slots (kebab+frituur = 2) + 1 per diensten-zaak. */
export async function fetchPublishedListingTypeSlotsAdmin(): Promise<number | null> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return null
  const { data, error } = await admin
    .from('gids_listings')
    .select('type, horeca_types, listing_segment')
    .eq('status', 'published')
  if (error) {
    console.error('[gids] type slots admin:', error.message)
    return null
  }
  let total = 0
  for (const row of data ?? []) {
    if (row.listing_segment === 'diensten') {
      total += 1
      continue
    }
    const slots = horecaTypesFromDbRow(row.type as string, row.horeca_types as string[] | null).length
    total += slots > 0 ? slots : 1
  }
  return total
}

/** Gepubliceerde horeca-zaken (geen diensten/leveranciers). */
export async function fetchPublishedHorecaListingCountFromDb(): Promise<number> {
  if (!isGidsSupabaseConfigured()) return 0
  const supabase = createGidsSupabasePublic()
  if (!supabase) return 0
  const { count, error } = await supabase
    .from('gids_listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .or('listing_segment.is.null,listing_segment.eq.horeca')
  if (error) {
    console.error('[gids] count horeca listings:', error.message)
    return 0
  }
  return count ?? 0
}

function applyPublishedListingTypeFilter<T extends { or: (f: string) => T; eq: (c: string, v: string) => T }>(
  query: T,
  typeId: string,
  includeHorecaTypes: boolean,
): T {
  if (includeHorecaTypes) {
    return query.or(`type.eq.${typeId},horeca_types.cs.{${typeId}}`)
  }
  return query.eq('type', typeId)
}

export async function fetchPublishedListingsFromDb(
  filter?: GidsPublishedListingsFilter,
): Promise<Listing[] | null> {
  const reader = gidsListingBrowseReader()
  if (!reader) return null
  const includeHorecaTypes = reader.select.includes('horeca_types')

  let query = reader.client.from('gids_listings').select(reader.select).eq('status', 'published')

  if (filter?.listingSegment === 'diensten') {
    query = query.eq('listing_segment', 'diensten')
  } else if (filter?.listingSegment === 'horeca') {
    query = query.or('listing_segment.is.null,listing_segment.eq.horeca')
  }

  if (filter?.province?.trim()) {
    query = query.eq('province', filter.province.trim())
  }
  if (filter?.type?.trim()) {
    query = applyPublishedListingTypeFilter(query, filter.type.trim(), includeHorecaTypes)
  }

  let { data, error } = await query.order('name')

  if (error && includeHorecaTypes && filter?.type?.trim()) {
    console.error('[gids] fetch listings type filter:', error.message)
    let fallback = reader.client.from('gids_listings').select(reader.select).eq('status', 'published')
    if (filter?.listingSegment === 'diensten') fallback = fallback.eq('listing_segment', 'diensten')
    else if (filter?.listingSegment === 'horeca') {
      fallback = fallback.or('listing_segment.is.null,listing_segment.eq.horeca')
    }
    if (filter?.province?.trim()) fallback = fallback.eq('province', filter.province.trim())
    fallback = fallback.eq('type', filter.type.trim())
    ;({ data, error } = await fallback.order('name'))
  }

  if (error) {
    console.error('[gids] fetch listings:', error.message)
    return null
  }

  const rawRows = (data ?? []) as unknown as GidsListingRow[]
  const photosById = await fetchFirstListingPhotosMap(
    reader.client,
    rawRows.map((r) => r.id),
  )
  let rows = rowsToListings(rawRows, photosById)
  if (filter?.dienstenActiveOnly) {
    rows = rows.filter((l) => l.dienstenActive)
  }
  return rows
}

function mapLightRowToListing(row: GidsListingRow): Listing {
  return mapGidsRowToListing({ ...row, gids_listing_photos: [] })
}

/** Spraak/intent: alle horeca-namen — geen foto’s, geen zware velden. */
export async function fetchPublishedHorecaListingsForVoiceFromDb(): Promise<Listing[] | null> {
  if (!isGidsSupabaseConfigured()) return null
  const supabase = createGidsSupabasePublic()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('gids_listings')
    .select(LISTING_VOICE_SELECT)
    .eq('status', 'published')
    .or('listing_segment.is.null,listing_segment.eq.horeca')
    .order('name')

  if (error) {
    console.error('[gids] voice listings:', error.message)
    return null
  }

  const rows = (data ?? []) as unknown as GidsListingRow[]
  return rows.map(mapLightRowToListing)
}

/** Jobs-pagina: premium + actieve vacature in DB voorfilter, daarna JS-validatie. */
export async function fetchPublishedJobListingsFromDb(): Promise<Listing[] | null> {
  if (!isGidsSupabaseConfigured()) return null
  const supabase = createGidsSupabasePublic()
  if (!supabase) return null

  let query = supabase
    .from('gids_listings')
    .select(LISTING_JOBS_SELECT)
    .eq('status', 'published')
    .or('listing_segment.is.null,listing_segment.eq.horeca')
    .eq('premium_member', true)
    .or('premium_paused.is.null,premium_paused.eq.false')
    .filter('info_extras->hiring->>enabled', 'eq', 'true')

  const { data, error } = await query.order('name')

  if (error) {
    console.error('[gids] job listings:', error.message)
    return null
  }

  const rows = (data ?? []) as unknown as GidsListingRow[]
  return rows.map(mapLightRowToListing)
}

/** Homepage «in de kijker» — geen volledige catalogus laden. */
export async function fetchFeaturedHorecaListingsFromDb(limit: number): Promise<Listing[] | null> {
  const reader = gidsListingBrowseReader()
  if (!reader) return null
  const take = Math.min(50, Math.max(4, limit * 4))

  const { data, error } = await reader.client
    .from('gids_listings')
    .select(reader.select)
    .eq('status', 'published')
    .or('listing_segment.is.null,listing_segment.eq.horeca')
    .order('rating_avg', { ascending: false })
    .order('rating_count', { ascending: false })
    .limit(take)

  if (error) {
    console.error('[gids] featured listings:', error.message)
    return null
  }

  const rawRows = (data ?? []) as unknown as GidsListingRow[]
  const photosById = await fetchFirstListingPhotosMap(
    reader.client,
    rawRows.map((r) => r.id),
  )
  return rowsToListings(rawRows, photosById).slice(0, limit)
}

/** Staff/batch: gepubliceerde zaken per pagina (slug-only). */
export async function fetchPublishedListingSlugsBatchAdmin(
  page: number,
  limit: number,
): Promise<{ slugs: string[]; total: number } | null> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase) return null
  const p = Math.max(1, Math.floor(page) || 1)
  const lim = Math.min(50, Math.max(1, Math.floor(limit) || 10))
  const from = (p - 1) * lim
  const to = from + lim - 1
  const { data, error, count } = await supabase
    .from('gids_listings')
    .select('slug', { count: 'exact' })
    .eq('status', 'published')
    .order('slug')
    .range(from, to)
  if (error) {
    console.error('[gids] batch slugs:', error.message)
    return null
  }
  const slugs = (data ?? []).map((r) => String(r.slug)).filter(Boolean)
  return { slugs, total: count ?? slugs.length }
}

export async function fetchListingBySlugFromDb(slug: string): Promise<Listing | null> {
  const reader = gidsListingBrowseReader()
  if (!reader) return null

  const { data, error } = await reader.client
    .from('gids_listings')
    .select(reader.select)
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('[gids] listing by slug:', error.message)
    return null
  }
  const row = data as unknown as GidsListingRow
  const photos = await fetchAllListingPhotosForId(reader.client, row.id)
  return mapGidsRowToListing({ ...row, gids_listing_photos: photos })
}

export async function fetchListingRowByIdAdmin(id: string): Promise<GidsListingRow | null> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('gids_listings')
    .select(`${LISTING_SELECT}, name_normalized`)
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return data as GidsListingRow
}

/** Snelle sessie-check voor beheer (geen foto-join). */
export async function fetchListingSessionByIdAdmin(
  id: string,
): Promise<{
  id: string
  slug: string
  name: string
  premium_member: boolean
  premium_paused: boolean
  premium_expires_at: string | null
} | null> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('gids_listings')
    .select('id, slug, name, premium_member, premium_paused, premium_expires_at')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  const premium_member = data.premium_member === true
  const premium_paused = data.premium_paused === true
  const premium_expires_at = (data.premium_expires_at as string | null) ?? null
  return {
    id: data.id as string,
    slug: data.slug as string,
    name: data.name as string,
    premium_member: resolveListingPremiumActive({
      premium_member,
      premium_paused,
      premium_expires_at,
    }),
    premium_paused,
    premium_expires_at,
  }
}

export async function fetchListingByNormalizedNameAdmin(nameNormalized: string): Promise<GidsListingRow | null> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('gids_listings')
    .select('id, name, name_normalized, pin_hash, slug')
    .eq('name_normalized', nameNormalized)
    .maybeSingle()
  if (error || !data) return null
  return data as GidsListingRow
}

type GidsLoginLookupRow = Pick<GidsListingRow, 'id' | 'name' | 'name_normalized' | 'pin_hash' | 'slug'>

async function fetchListingsByNormalizedNamesAdmin(keys: string[]): Promise<GidsLoginLookupRow[]> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase || keys.length === 0) return []
  const { data, error } = await supabase
    .from('gids_listings')
    .select('id, name, name_normalized, pin_hash, slug')
    .in('name_normalized', keys)
  if (error || !data?.length) return []
  return data as GidsLoginLookupRow[]
}

export async function fetchListingBySlugAdmin(slug: string): Promise<GidsListingRow | null> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase) return null
  const key = slug.trim().toLowerCase()
  if (!key) return null
  const { data, error } = await supabase
    .from('gids_listings')
    .select('id, name, name_normalized, pin_hash, slug')
    .eq('slug', key)
    .maybeSingle()
  if (error || !data) return null
  return data as GidsListingRow
}

export async function fetchListingByLoginNameAdmin(rawName: string): Promise<GidsListingRow | null> {
  const keys = gidsBusinessNameLookupKeys(rawName)
  if (keys.length > 0) {
    const hits = await fetchListingsByNormalizedNamesAdmin(keys)
    if (hits.length > 0) {
      for (const key of keys) {
        const row = hits.find((h) => h.name_normalized === key)
        if (row) return row as GidsListingRow
      }
      return hits[0] as GidsListingRow
    }
  }

  const slugLike = rawName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (slugLike.length >= 3 && slugLike.includes('-')) {
    const bySlug = await fetchListingBySlugAdmin(slugLike)
    if (bySlug) return bySlug
  }

  return null
}
