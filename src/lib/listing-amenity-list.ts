import type { Listing, ListingAmenityId } from '@/lib/listing-types'
import { listingHasDeliveryInfo } from '@/lib/listings'

/** Amenities voor weergave (incl. afhalen/levering uit vlaggen indien niet expliciet gezet). */
export function resolveListingAmenityList(listing: Listing): ListingAmenityId[] {
  const amenities = listing.amenities ?? []
  const defaultAmenities: ListingAmenityId[] = []
  if (listing.pickupEnabled) defaultAmenities.push('takeaway')
  if (listingHasDeliveryInfo(listing)) defaultAmenities.push('delivery')
  if (amenities.length > 0) {
    const merged = [...amenities, ...defaultAmenities.filter((d) => !amenities.includes(d))]
    return listingHasDeliveryInfo(listing) ? merged : merged.filter((a) => a !== 'delivery')
  }
  return defaultAmenities
}
