import type { Listing } from '@/lib/listing-types'
import { geocodeBelgiumAddress, geocodeBelgiumPostcodeCity } from '@/lib/geocode-be-address'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'

const SEARCH_GEOCODE_BATCH = 20

/** Zet lat/lng op basis van straat+postcode+gemeente (Nominatim). */
export async function geocodeListingAddress(parts: {
  address: string
  postcode: string
  city: string
}) {
  return geocodeBelgiumAddress(parts)
}

/** Bestaande zaken zonder coördinaten: eenmalig geocoden en opslaan. */
export async function ensureListingGeocoded(listing: Listing): Promise<Listing> {
  if (typeof listing.lat === 'number' && typeof listing.lng === 'number') {
    return listing
  }

  const coords =
    (await geocodeBelgiumAddress({
      address: listing.address,
      postcode: listing.postcode,
      city: listing.city,
    })) ??
    (await geocodeBelgiumPostcodeCity({
      postcode: listing.postcode,
      city: listing.city,
    }))
  if (!coords) return listing

  const admin = createGidsSupabaseAdmin()
  if (admin) {
    await admin
      .from('gids_listings')
      .update({ lat: coords.lat, lng: coords.lng, updated_at: new Date().toISOString() })
      .eq('slug', listing.slug)
  }

  return { ...listing, lat: coords.lat, lng: coords.lng }
}

/** Zoekresultaten: automatisch lat/lng voor zaken zonder coördinaten (max. batch, opslaan in DB). */
export async function geocodeListingsForSearchResults(listings: Listing[]): Promise<Listing[]> {
  const missing = listings.filter(
    (l) => typeof l.lat !== 'number' || typeof l.lng !== 'number',
  )
  if (missing.length === 0) return listings

  const batch = missing.slice(0, SEARCH_GEOCODE_BATCH)
  const updated = await Promise.all(batch.map((l) => ensureListingGeocoded(l)))
  const bySlug = new Map(updated.map((l) => [l.slug, l]))
  return listings.map((l) => bySlug.get(l.slug) ?? l)
}
