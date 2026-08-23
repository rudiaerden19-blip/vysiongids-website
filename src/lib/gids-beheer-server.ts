import type { Listing } from '@/lib/listing-types'
import { fetchListingRowByIdAdmin, fetchListingSessionByIdAdmin, mapGidsRowToListing } from '@/lib/gids-listings-db'
import { resolveListingPremiumActive } from '@/lib/gids-premium'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'

export type BeheerServerSession = {
  authenticated: boolean
  listingId?: string
  slug?: string
  name?: string
  premiumMember?: boolean
  pinMustChange?: boolean
  listing?: Listing
}

/** Cookie + volledige listing voor beheer-formulier (één server-trip, geen wachten op client-API). */
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
    pinMustChange: row.pin_must_change === true,
    listing,
  }
}

/** Alleen sessie-kolom — bv. health; beheer gebruikt loadBeheerServerSession. */
export async function loadBeheerServerSessionBrief(): Promise<BeheerServerSession> {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) return { authenticated: false }

  const row = await fetchListingSessionByIdAdmin(listingId)
  if (!row) return { authenticated: false }

  const premiumMember = resolveListingPremiumActive({
    premium_member: row.premium_member,
    premium_paused: row.premium_paused,
    premium_expires_at: row.premium_expires_at,
  })

  return {
    authenticated: true,
    listingId: row.id,
    slug: row.slug,
    name: row.name,
    premiumMember,
  }
}
