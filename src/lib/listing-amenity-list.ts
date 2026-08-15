import type { Listing, ListingAmenityId } from '@/lib/listing-types'

/** Amenities voor weergave (incl. afhalen/levering uit vlaggen indien niet expliciet gezet). */
export function resolveListingAmenityList(listing: Listing): ListingAmenityId[] {
  const amenities = listing.amenities ?? []
  const defaultAmenities: ListingAmenityId[] = []
  if (listing.pickupEnabled) defaultAmenities.push('takeaway')
  if (listing.deliveryEnabled) defaultAmenities.push('delivery')
  if (amenities.length > 0) {
    return [...amenities, ...defaultAmenities.filter((d) => !amenities.includes(d))]
  }
  return defaultAmenities
}
