import type { Listing } from '@/lib/listing-types'
import { normalizeSearchText } from '@/lib/gids-text'
import { distanceKmBetween } from '@/lib/listing-distance'

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  pelt: { lat: 51.225, lng: 5.437 },
  neerpelt: { lat: 51.228, lng: 5.442 },
  lommel: { lat: 51.2307, lng: 5.3076 },
  overpelt: { lat: 51.213, lng: 5.415 },
  genk: { lat: 50.965, lng: 5.497 },
  hasselt: { lat: 50.931, lng: 5.338 },
  opglabeek: { lat: 51.041, lng: 5.593 },
  dordrecht: { lat: 51.813, lng: 4.673 },
}

const POSTCODE_COORDS: Record<string, { lat: number; lng: number }> = {
  '3900': { lat: 51.225, lng: 5.437 },
  '3910': { lat: 51.228, lng: 5.442 },
  '3920': { lat: 51.2307, lng: 5.3076 },
  '3930': { lat: 51.213, lng: 5.415 },
  '3600': { lat: 50.965, lng: 5.497 },
  '3500': { lat: 50.931, lng: 5.338 },
  '3660': { lat: 51.041, lng: 5.593 },
}

/** Alleen voor navigatie-fallback — geen echte zaak-pin. */
export function getListingFallbackCoordinates(listing: Listing): { lat: number; lng: number } {
  const pc = listing.postcode?.trim().slice(0, 4)
  if (pc && POSTCODE_COORDS[pc]) return POSTCODE_COORDS[pc]!
  const key = normalizeSearchText(listing.city)
  const hit = CITY_COORDS[key]
  if (hit) return hit
  return { lat: 50.85, lng: 4.35 }
}

/** DB-pin is waarschijnlijk gemeente/postcode-centrum i.p.v. straat. */
export function listingStoredCoordsAreFallback(listing: Listing): boolean {
  if (typeof listing.lat !== 'number' || typeof listing.lng !== 'number') return true
  const fb = getListingFallbackCoordinates(listing)
  return distanceKmBetween({ lat: listing.lat, lng: listing.lng }, fb) < 0.85
}
