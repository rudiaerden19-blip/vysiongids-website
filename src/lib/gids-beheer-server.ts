import type { Listing } from '@/lib/listing-types'
import { fetchListingRowByIdAdmin, mapGidsRowToListing } from '@/lib/gids-listings-db'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'
import { fetchGidsZoekertjesByListingIdAdmin } from '@/lib/gids-zoekertjes-db'
import { listingHasGidsPremium } from '@/lib/gids-premium'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'

export type BeheerServerSession = {
  authenticated: boolean
  listingId?: string
  slug?: string
  name?: string
  premiumMember?: boolean
  listing?: Listing
  initialZoekertjes?: GidsZoekertje[]
}

/** Eén server-roundtrip i.p.v. client → API → Supabase (beheer). */
export async function loadBeheerServerSession(): Promise<BeheerServerSession> {
  const listingId = await getGidsOwnerListingIdFromCookies({ touch: true })
  if (!listingId) return { authenticated: false }

  const row = await fetchListingRowByIdAdmin(listingId)
  if (!row) return { authenticated: false }

  const listing = mapGidsRowToListing(row)
  const premiumMember = listing.premiumMember === true

  let initialZoekertjes: GidsZoekertje[] | undefined
  if (listingHasGidsPremium(premiumMember)) {
    const mine = await fetchGidsZoekertjesByListingIdAdmin(listingId)
    if (mine) initialZoekertjes = mine
  }

  return {
    authenticated: true,
    listingId: row.id,
    slug: listing.slug,
    name: listing.name,
    premiumMember,
    listing,
    initialZoekertjes,
  }
}
