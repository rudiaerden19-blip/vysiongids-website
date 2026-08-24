import { GIDS_DIENSTEN_YEARLY_EUR } from '@/lib/gids-diensten-pricing'

export { GIDS_DIENSTEN_YEARLY_EUR }

export type DienstenMembershipRow = {
  listing_segment?: string | null
  diensten_paid_at?: string | null
  diensten_expires_at?: string | null
  diensten_complimentary?: boolean | null
  status?: string | null
}

/** Zichtbaar in diensten-zoeken: segment diensten + actief lidmaatschap + published. */
export function resolveDienstenListingActive(row: DienstenMembershipRow): boolean {
  if (row.listing_segment !== 'diensten') return false
  if (row.status && row.status !== 'published') return false
  if (row.diensten_complimentary === true) return true
  const exp = row.diensten_expires_at
  if (!exp) return false
  return new Date(exp).getTime() > Date.now()
}

export function dienstenMembershipDays(): number {
  return 365
}

/** Gratis eigenaar-profielen blijven zichtbaar, ook na PIN-wijziging. */
export function dienstenComplimentaryExpiresIso(from = new Date()): string {
  const expires = new Date(from)
  expires.setFullYear(expires.getFullYear() + 100)
  return expires.toISOString()
}
