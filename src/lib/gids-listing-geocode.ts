import { revalidateTag } from 'next/cache'
import type { Listing } from '@/lib/listing-types'
import { geocodeBelgiumStreetAddress } from '@/lib/geocode-be-address'
import { distanceKmBetween } from '@/lib/listing-distance'
import {
  getListingFallbackCoordinates,
  listingStoredCoordsAreFallback,
} from '@/lib/listing-geo-fallback'
import { getListingMapCoordinates } from '@/lib/listing-display'
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
    revalidateTag('gids-listings', 'max')
    revalidateTag(`gids-listing-${listing.slug}`, 'max')
  }
  return { ...listing, lat: coords.lat, lng: coords.lng }
}

/** Straat-pin voor satelliet — geen externe geocode als DB al een goede pin heeft. */
export async function resolveListingMapPin(listing: Listing): Promise<{
  listing: Listing
  pin: { lat: number; lng: number }
}> {
  const stored = getListingMapCoordinates(listing)
  if (stored && !listingStoredCoordsAreFallback(listing)) {
    return { listing, pin: stored }
  }

  const streetCoords = await geocodeBelgiumStreetAddress({
    address: listing.address,
    postcode: listing.postcode,
    city: listing.city,
  })

  if (streetCoords) {
    const updated = await applyStreetCoordsToListing(listing, streetCoords)
    return { listing: updated, pin: streetCoords }
  }

  const geocoded = await ensureListingGeocoded(listing)
  const precise = getListingMapCoordinates(geocoded)
  if (precise) return { listing: geocoded, pin: precise }

  return { listing: geocoded, pin: getListingFallbackCoordinates(geocoded) }
}

async function applyStreetCoordsToListing(
  listing: Listing,
  streetCoords: { lat: number; lng: number },
): Promise<Listing> {
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

/** Geocoden en opslaan; herstelt verkeerde oude pins (zaaknaam, postcode-centrum). */
export async function ensureListingGeocoded(listing: Listing): Promise<Listing> {
  const streetCoords = await geocodeBelgiumStreetAddress({
    address: listing.address,
    postcode: listing.postcode,
    city: listing.city,
  })
  if (!streetCoords) return listing
  return applyStreetCoordsToListing(listing, streetCoords)
}

/** Batch: altijd opnieuw geocoden op straatadres en opslaan bij wijziging. */
export async function forceRefreshListingGeocode(listing: Listing): Promise<{
  listing: Listing
  changed: boolean
  geocoded: boolean
}> {
  const streetCoords = await geocodeBelgiumStreetAddress({
    address: listing.address,
    postcode: listing.postcode,
    city: listing.city,
  })
  if (!streetCoords) {
    return { listing, changed: false, geocoded: false }
  }

  if (typeof listing.lat === 'number' && typeof listing.lng === 'number') {
    const drift = distanceKmBetween({ lat: listing.lat, lng: listing.lng }, streetCoords)
    if (drift < 0.001) {
      return { listing, changed: false, geocoded: true }
    }
  }

  const updated = await persistListingCoords(listing, streetCoords)
  return { listing: updated, changed: true, geocoded: true }
}

export function listingNeedsBackgroundGeocode(listing: Listing): boolean {
  return listingStoredCoordsAreFallback(listing)
}
