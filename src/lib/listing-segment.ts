export const LISTING_SEGMENT_HORECA = 'horeca' as const
export const LISTING_SEGMENT_DIENSTEN = 'diensten' as const

export type ListingSegment = typeof LISTING_SEGMENT_HORECA | typeof LISTING_SEGMENT_DIENSTEN

/** DB `type` voor leveranciers (niet in horeca-zoekfilter). */
export const DIENSTEN_LISTING_TYPE = 'leverancier'

export function isDienstenListing(listing: { listingSegment?: string }): boolean {
  return listing.listingSegment === LISTING_SEGMENT_DIENSTEN
}

export function isHorecaListing(listing: { listingSegment?: string }): boolean {
  return !listing.listingSegment || listing.listingSegment === LISTING_SEGMENT_HORECA
}
