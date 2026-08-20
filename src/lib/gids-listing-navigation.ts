import type { Listing } from '@/lib/listing-types'
import { formatListingAddress } from '@/lib/listing-display'
import { getListingCoordinates, listingCoordinatesForDistance } from '@/lib/listings'

export function listingGoogleMapsUrl(listing: Listing): string {
  const q = formatListingAddress(listing)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/** Zelfde adres als Google Maps-knop — Google kiest satelliet + pin (geen Esri/OSM-offset). */
export function listingGoogleSatelliteEmbedUrl(listing: Listing): string {
  const q = formatListingAddress(listing)
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=19&t=k&hl=nl&output=embed`
}

export function listingWazeUrl(
  listing: Listing,
  pin?: { lat: number; lng: number } | null,
): string {
  const fromPin = pin ?? undefined
  const { lat, lng } =
    fromPin ?? listingCoordinatesForDistance(listing) ?? getListingCoordinates(listing)
  const q = formatListingAddress(listing)
  return `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes&q=${encodeURIComponent(q)}`
}

/** Op mobiel opent dit meestal de Waze-app. */
export function openListingInWaze(listing: Listing): void {
  if (typeof window === 'undefined') return
  window.location.assign(listingWazeUrl(listing))
}
