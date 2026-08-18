import type { Listing } from '@/lib/listing-types'
import { geocodeBelgiumStreetAddress } from '@/lib/geocode-be-address'
import { distanceKmBetween } from '@/lib/listing-distance'
import { listingStoredCoordsAreFallback } from '@/lib/listing-geo-fallback'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'

const REFRESH_DRIFT_KM = 0.35

/** Zet lat/lng op basis van straat+postcode+gemeente (Photon / Nominatim). */
export async function geocodeListingAddress(parts: {
  address: string
  postcode: string
  city: string
  name?: string
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
  if (
    typeof listing.lat === 'number' &&
    typeof listing.lng === 'number' &&
    !listingStoredCoordsAreFallback(listing)
  ) {
    return listing
  }

  const streetCoords = await geocodeBelgiumStreetAddress({
    address: listing.address,
    postcode: listing.postcode,
    city: listing.city,
    name: listing.name,
  })
  if (!streetCoords) return listing

  const mustUpdate =
    listingStoredCoordsAreFallback(listing) || listingNeedsGeocodeRefresh(listing, streetCoords)
  if (!mustUpdate) return listing

  return persistListingCoords(listing, streetCoords)
}

export function listingNeedsBackgroundGeocode(listing: Listing): boolean {
  return listingStoredCoordsAreFallback(listing)
}
