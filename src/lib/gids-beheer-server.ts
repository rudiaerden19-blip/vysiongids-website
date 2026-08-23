import type { Listing } from '@/lib/listing-types'
import { fetchListingSessionByIdAdmin, fetchOwnerPinMustChangeAdmin } from '@/lib/gids-listings-db'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'
import { LISTING_SEGMENT_DIENSTEN } from '@/lib/listing-segment'

export type BeheerPageShell = {
  authenticated: boolean
  listingId?: string
  slug?: string
  name?: string
  premiumMember?: boolean
  listingSegment?: Listing['listingSegment']
  /** Alleen waar kolom pin_must_change bestaat (migratie 025). */
  pinMustChange?: boolean
}

/** Cookie + lichte rij — geen foto’s, geen volledig formulier (streamt daarna). */
export async function loadBeheerPageShell(): Promise<BeheerPageShell> {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) return { authenticated: false }

  const row = await fetchListingSessionByIdAdmin(listingId)
  if (!row) return { authenticated: false }

  const listingSegment =
    row.listing_segment === LISTING_SEGMENT_DIENSTEN ? ('diensten' as const) : ('horeca' as const)
  const pinMustChange = await fetchOwnerPinMustChangeAdmin(row.id)

  return {
    authenticated: true,
    listingId: row.id,
    slug: row.slug,
    name: row.name,
    premiumMember: row.premium_member,
    listingSegment,
    pinMustChange,
  }
}
