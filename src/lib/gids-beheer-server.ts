import type { Listing } from '@/lib/listing-types'
import { fetchListingSessionByIdAdmin } from '@/lib/gids-listings-db'
import { resolveListingPremiumActive } from '@/lib/gids-premium'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'

export type BeheerServerSession = {
  authenticated: boolean
  listingId?: string
  slug?: string
  name?: string
  premiumMember?: boolean
  /** Volledige listing alleen via client `/api/gids/me` — snellere beheer-pagina na login. */
  listing?: Listing
}

/** Snelle cookie-check + minimale listing-kolom — geen foto-join (beheer-formulier laadt via API). */
export async function loadBeheerServerSession(): Promise<BeheerServerSession> {
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
