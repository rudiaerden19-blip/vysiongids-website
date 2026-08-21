import { resolveListingPremiumActive } from '@/lib/gids-premium'

/** Alleen premium horeca — geen zoekertjes voor diensten/leveranciers. */
export function listingCanManageZoekertjes(row: {
  premium_member?: boolean | null
  premium_paused?: boolean | null
  premium_expires_at?: string | null
  listing_segment?: string | null
}): boolean {
  if (row.listing_segment === 'diensten') return false
  return resolveListingPremiumActive({
    premium_member: row.premium_member,
    premium_paused: row.premium_paused,
    premium_expires_at: row.premium_expires_at,
  })
}

export function listingCanManageZoekertjesFromRow(row: Parameters<typeof listingCanManageZoekertjes>[0]): boolean {
  return listingCanManageZoekertjes(row)
}
