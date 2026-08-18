import type { Listing } from '@/lib/listing-types'
import { formatListingAddress, getListingCoordinates, listingCoordinatesForDistance } from '@/lib/listings'

export function listingGoogleMapsUrl(listing: Listing): string {
  const q = formatListingAddress(listing)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function listingWazeUrl(listing: Listing): string {
  const { lat, lng } = listingCoordinatesForDistance(listing) ?? getListingCoordinates(listing)
  const q = formatListingAddress(listing)
  return `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes&q=${encodeURIComponent(q)}`
}

/** Op mobiel opent dit meestal de Waze-app. */
export function openListingInWaze(listing: Listing): void {
  if (typeof window === 'undefined') return
  window.location.assign(listingWazeUrl(listing))
}
