import type { Listing, ListingAmenityId } from '@/lib/listing-types'
import { normalizeListingInfoExtras } from '@/lib/listing-info-extras'
import { createGidsSupabaseAdmin, createGidsSupabasePublic, isGidsSupabaseConfigured } from '@/lib/supabase-gids'

type PhotoRow = { sort_order: number; public_url: string }

export type GidsListingRow = {
  id: string
  slug: string
  name: string
  name_normalized?: string
  pin_hash?: string
  type: string
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
  delivery_radius_km?: number | null
  delivery_fee_eur: number | null
  min_order_eur: number | null
  pickup_enabled: boolean | null
  delivery_enabled: boolean | null
  lat: number | null
  lng: number | null
  info_extras?: unknown
  gids_listing_photos?: PhotoRow[] | null
}

const LISTING_SELECT = `
  *,
  gids_listing_photos ( sort_order, public_url )
`

export function mapGidsRowToListing(row: GidsListingRow): Listing {
  const photos = [...(row.gids_listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const photoUrl = photos[0]?.public_url ?? '/images/placeholder-frituur.svg'
  const photoUrls = photos.map((p) => p.public_url).filter(Boolean)

  return {
    slug: row.slug,
    name: row.name,
    type: row.type as Listing['type'],
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
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
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

export async function fetchPublishedListingsFromDb(): Promise<Listing[] | null> {
  if (!isGidsSupabaseConfigured()) return null
  const supabase = createGidsSupabasePublic()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('gids_listings')
    .select(LISTING_SELECT)
    .eq('status', 'published')
    .order('name')

  if (error) {
    console.error('[gids] fetch listings:', error.message)
    return null
  }

  return (data as GidsListingRow[]).map(mapGidsRowToListing)
}

export async function fetchListingBySlugFromDb(slug: string): Promise<Listing | null> {
  if (!isGidsSupabaseConfigured()) return null
  const supabase = createGidsSupabasePublic()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('gids_listings')
    .select(LISTING_SELECT)
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return mapGidsRowToListing(data as GidsListingRow)
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
