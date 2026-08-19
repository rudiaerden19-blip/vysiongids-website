import type { Listing } from '@/lib/listing-types'
import { distanceKmBetween } from '@/lib/listing-distance'
import { formatDeliveryRadiusKm } from '@/lib/listing-delivery-radius'
import { getListingFallbackCoordinates } from '@/lib/listing-geo-fallback'

/** Alle foto-URL's voor slider (max. 3 in DB). */
export function listingPhotoUrls(listing: Listing): string[] {
  if (listing.photoUrls?.length) return listing.photoUrls
  if (listing.photoUrl?.trim()) return [listing.photoUrl.trim()]
  return []
}

/** Alleen echte DB-coördinaten voor afstand (geen Brussel-fallback). */
export function listingCoordinatesForDistance(listing: Listing): { lat: number; lng: number } | null {
  if (typeof listing.lat === 'number' && typeof listing.lng === 'number') {
    return { lat: listing.lat, lng: listing.lng }
  }
  return null
}

/** Afstand tot zaak (km) vanaf een punt — null als zaak nog geen lat/lng heeft. */
export function listingDistanceKmFrom(
  listing: Listing,
  from: { lat: number; lng: number },
): number | null {
  const to = listingCoordinatesForDistance(listing)
  if (!to) return null
  return distanceKmBetween(from, to)
}

/** Levering tonen alleen als minstens één leveringsveld is ingevuld (niet alleen DB-default). */
export function listingHasDeliveryInfo(listing: Listing): boolean {
  if (!listing.deliveryEnabled) return false
  if (listing.deliveryFeeEur != null) return true
  if (listing.minOrderEur != null) return true
  if (listing.deliveryTimeMin != null && listing.deliveryTimeMax != null) return true
  const km = listing.deliveryRadiusKm
  if (km != null && km > 0) return true
  return false
}

export function formatListingServiceMode(listing: Listing): string {
  const pickup = listing.pickupEnabled !== false
  const delivery = listingHasDeliveryInfo(listing)
  if (pickup && delivery) return 'Afhalen & levering'
  if (delivery) return 'Levering'
  return 'Afhalen'
}

export function formatDeliveryFee(listing: Listing): string | null {
  if (!listingHasDeliveryInfo(listing)) {
    return listing.deliveryEnabled ? null : 'Alleen afhalen'
  }
  if (listing.deliveryFeeEur == null) return null
  if (listing.deliveryFeeEur === 0) return 'Gratis levering'
  return `€${listing.deliveryFeeEur.toFixed(2).replace('.', ',')} levering`
}

export function formatMinOrder(listing: Listing): string | null {
  if (listing.minOrderEur == null) return null
  return `Min. €${listing.minOrderEur.toFixed(2).replace('.', ',')}`
}

export function formatListingPickupTime(listing: Listing): string | null {
  if (listing.pickupTimeMin == null || listing.pickupTimeMax == null) return null
  return `Afhaal ${listing.pickupTimeMin}–${listing.pickupTimeMax} min`
}

export function formatListingDeliveryTime(listing: Listing): string | null {
  if (listing.deliveryTimeMin == null || listing.deliveryTimeMax == null) return null
  return `Levering ${listing.deliveryTimeMin}–${listing.deliveryTimeMax} min`
}

export function formatDeliveryRadius(listing: Listing): string | null {
  const km = formatDeliveryRadiusKm(listing.deliveryRadiusKm)
  if (!km) return null
  return `Levering binnen ${km}`
}

/** Openingstijden voor panelen en profiel — altijd zichtbaar */
export function formatOpeningHours(listing: Listing): string {
  const hours = listing.openingHours?.trim()
  if (!hours) {
    return listing.closedDays?.trim()
      ? `Open · ${listing.closedDays} gesloten`
      : 'Openingstijden op aanvraag'
  }
  if (listing.closedDays?.trim() && !hours.toLowerCase().includes(listing.closedDays.toLowerCase())) {
    return `${hours} · ${listing.closedDays} gesloten`
  }
  return hours
}

export function formatListingAddress(listing: Listing): string {
  const street = listing.address.trim()
  const cityLine = `${listing.postcode} ${listing.city}`.trim()
  return `${street}, ${cityLine}`
}

/** Eerste regel straat, tweede regel postcode + gemeente */
export function formatListingAddressLines(listing: Listing): { street: string; cityLine: string } {
  return {
    street: listing.address.trim(),
    cityLine: `${listing.postcode} ${listing.city}`.trim(),
  }
}

export function getListingCoordinates(listing: Listing): { lat: number; lng: number } {
  if (typeof listing.lat === 'number' && typeof listing.lng === 'number') {
    return { lat: listing.lat, lng: listing.lng }
  }
  return getListingFallbackCoordinates(listing)
}
