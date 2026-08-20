import type { Listing } from '@/lib/listing-types'
import { geocodeBelgiumStreetAddress } from '@/lib/geocode-be-address'
import { distanceKmBetween } from '@/lib/listing-distance'
import { listingStoredCoordsAreFallback } from '@/lib/listing-geo-fallback'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'

/** Corrigeer opgeslagen pin als geocoding > deze afstand afwijkt (meter-nauwkeurigheid). */
const REFRESH_DRIFT_KM = 0.08

/** Zet lat/lng op basis van straat+postcode+gemeente (Photon / Nominatim). */
export async function geocodeListingAddress(parts: {
  address: string
  postcode: string
  city: string
  name?: string
}) {
  return geocodeBelgiumStreetAddress({
    address: parts.address,
    postcode: parts.postcode,
    city: parts.city,
  })
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

/** Geocoden en opslaan; herstelt verkeerde oude pins (zaaknaam, postcode-centrum). */
export async function ensureListingGeocoded(listing: Listing): Promise<Listing> {
  const streetCoords = await geocodeBelgiumStreetAddress({
    address: listing.address,
    postcode: listing.postcode,
    city: listing.city,
  })
  if (!streetCoords) return listing

  if (typeof listing.lat !== 'number' || typeof listing.lng !== 'number') {
    return persistListingCoords(listing, streetCoords)
  }

  if (listingStoredCoordsAreFallback(listing)) {
    return persistListingCoords(listing, streetCoords)
  }

  const drift = distanceKmBetween({ lat: listing.lat, lng: listing.lng }, streetCoords)
  if (drift >= REFRESH_DRIFT_KM) {
    return persistListingCoords(listing, streetCoords)
  }

  return listing
}

export function listingNeedsBackgroundGeocode(listing: Listing): boolean {
  return listingStoredCoordsAreFallback(listing)
}
