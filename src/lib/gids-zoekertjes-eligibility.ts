import type { GidsListingRow } from '@/lib/gids-listings-db'
import { resolveDienstenListingActive } from '@/lib/gids-diensten-membership'
import { resolveListingPremiumActive } from '@/lib/gids-premium'

/** Premium horeca of actief diensten-lidmaatschap (€99/jaar). */
export function listingCanManageZoekertjes(row: {
  premium_member?: boolean | null
  premium_paused?: boolean | null
  premium_expires_at?: string | null
  listing_segment?: string | null
  diensten_expires_at?: string | null
  status?: string | null
}): boolean {
  if (
    resolveListingPremiumActive({
      premium_member: row.premium_member,
      premium_paused: row.premium_paused,
      premium_expires_at: row.premium_expires_at,
    })
  ) {
    return true
  }
  return resolveDienstenListingActive(row)
}

export function listingCanManageZoekertjesFromRow(row: GidsListingRow): boolean {
  return listingCanManageZoekertjes(row)
}
