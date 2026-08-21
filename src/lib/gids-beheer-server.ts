import type { Listing } from '@/lib/listing-types'
import { fetchListingRowByIdAdmin, mapGidsRowToListing } from '@/lib/gids-listings-db'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'

export type BeheerServerSession = {
  authenticated: boolean
  listingId?: string
  slug?: string
  name?: string
  premiumMember?: boolean
  listing?: Listing
}

/** Eén server-roundtrip i.p.v. client → API → Supabase (beheer). Zoekertjes/chat lazy via client-API. */
export async function loadBeheerServerSession(): Promise<BeheerServerSession> {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) return { authenticated: false }

  const row = await fetchListingRowByIdAdmin(listingId)
  if (!row) return { authenticated: false }

  const listing = mapGidsRowToListing(row)
  const premiumMember = listing.premiumMember === true

  return {
    authenticated: true,
    listingId: row.id,
    slug: listing.slug,
    name: listing.name,
    premiumMember,
    listing,
  }
}
