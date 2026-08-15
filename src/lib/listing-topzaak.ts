import type { Listing } from '@/lib/listing-types'

/** Minstens 4 sterren (weergave) op basis van gemiddelde; minstens 1 review. */
export function isTopZaakListing(listing: Pick<Listing, 'ratingAvg' | 'ratingCount'>): boolean {
  if (listing.ratingCount <= 0) return false
  const avg = Math.min(5, Math.max(0, listing.ratingAvg))
  const fullStars = Math.floor(avg + 0.25)
  return fullStars >= 4
}
