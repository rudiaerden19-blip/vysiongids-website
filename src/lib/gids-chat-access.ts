import type { GidsListingRow } from '@/lib/gids-listings-db'
import { resolveDienstenListingActive } from '@/lib/gids-diensten-membership'
import { GIDS_DIENSTEN_YEARLY_EUR } from '@/lib/gids-diensten-pricing'
import { isDienstenListing } from '@/lib/listing-segment'
import type { Listing } from '@/lib/listing-types'

/** Horeca: chat gratis voor elke zaakkaart in de gids. Diensten: actief €99-profiel om te chatten. */
export function listingCanUseGidsChat(
  listing: Pick<Listing, 'listingSegment' | 'dienstenActive'>,
): boolean {
  if (isDienstenListing(listing)) return listing.dienstenActive === true
  return true
}

export function listingCanUseGidsChatFromRow(
  row: Pick<
    GidsListingRow,
    | 'listing_segment'
    | 'premium_member'
    | 'premium_paused'
    | 'premium_expires_at'
    | 'diensten_expires_at'
    | 'status'
  >,
): boolean {
  if (row.listing_segment === 'diensten') {
    return resolveDienstenListingActive({
      listing_segment: row.listing_segment,
      diensten_expires_at: row.diensten_expires_at,
      status: row.status ?? 'published',
    })
  }
  return (row.status ?? 'published') !== 'hidden'
}

export function gidsChatMembershipDeniedMessage(segment: 'horeca' | 'diensten' | undefined): string {
  if (segment === 'diensten') {
    return `Chat vereist een actief leveranciersprofiel (€${GIDS_DIENSTEN_YEARLY_EUR}/jaar). Log in via beheer.`
  }
  return 'Chat is niet beschikbaar voor dit profiel.'
}

export function normalizeGidsChatBody(raw: string): string | null {
  const body = raw.replace(/\0/g, '').trim()
  if (!body) return null
  if (body.length > 2000) return body.slice(0, 2000)
  return body
}
