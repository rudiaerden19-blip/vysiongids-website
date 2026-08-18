import type { Listing } from '@/lib/listing-types'
import { geocodeBelgiumStreetAddress } from '@/lib/geocode-be-address'
import { distanceKmBetween } from '@/lib/listing-distance'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'

const SEARCH_GEOCODE_BATCH = 15
/** Bestaande DB-pin dicht bij verkeerd postcode-centrum → opnieuw geocoden. */
const REFRESH_DRIFT_KM = 0.35

/** Zet lat/lng op basis van straat+postcode+gemeente (Nominatim / Photon). */
export async function geocodeListingAddress(parts: {
  address: string
  postcode: string
  city: string
}) {
  return geocodeBelgiumStreetAddress(parts)
}

async function persistListingCoords(listing: Listing, coords: { lat: number; lng: number }): Promise<Listing> {
  const admin = createGidsSupabaseAdmin()
  if (admin) {
    await admin
      .from('gids_listings')
      .update({ lat: coords.lat, lng: coords.lng, updated_at: new Date().toISOString() })
      .eq('slug', listing.slug)
  }
  return { ...listing, lat: coords.lat, lng: coords.lng }
}

function listingNeedsGeocodeRefresh(listing: Listing, streetCoords: { lat: number; lng: number }): boolean {
  if (typeof listing.lat !== 'number' || typeof listing.lng !== 'number') return true
  const drift = distanceKmBetween({ lat: listing.lat, lng: listing.lng }, streetCoords)
  return drift >= REFRESH_DRIFT_KM
}

/** Geocoden en opslaan; corrigeert ook oude «postcode-centrum»-pins in de DB. */
export async function ensureListingGeocoded(listing: Listing): Promise<Listing> {
  const streetCoords = await geocodeBelgiumStreetAddress({
    address: listing.address,
    postcode: listing.postcode,
    city: listing.city,
  })
  if (!streetCoords) return listing

  if (!listingNeedsGeocodeRefresh(listing, streetCoords)) {
    return listing
  }

  return persistListingCoords(listing, streetCoords)
}

/** Zoekresultaten: straat-geocode voor zichtbare zaken (batch, sequentieel i.v.m. rate limits). */
export async function geocodeListingsForSearchResults(listings: Listing[]): Promise<Listing[]> {
  if (listings.length === 0) return listings

  const batch = listings.slice(0, SEARCH_GEOCODE_BATCH)
  const bySlug = new Map<string, Listing>()

  for (const listing of batch) {
    const updated = await ensureListingGeocoded(listing)
    bySlug.set(listing.slug, updated)
    await sleep(220)
  }

  return listings.map((l) => bySlug.get(l.slug) ?? l)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
