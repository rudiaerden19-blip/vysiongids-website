import type { Listing, ListingAmenityId } from '@/lib/listing-types'
import { listingHasDeliveryInfo } from '@/lib/listings'

/** Amenities voor klantkaarten / INFO — alleen opgeslagen keuzes, geen auto take-away/levering. */
export function resolveListingAmenityList(listing: Listing): ListingAmenityId[] {
  const stored = listing.amenities
  if (stored != null) {
    return stored.filter((id) => id !== 'delivery' || listingHasDeliveryInfo(listing))
  }
  const fallback: ListingAmenityId[] = []
  if (listing.pickupEnabled !== false) fallback.push('takeaway')
  if (listingHasDeliveryInfo(listing)) fallback.push('delivery')
  return fallback
}
