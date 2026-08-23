/** Zaak in gids zonder goedgekeurde claim én zonder eigenaar-PIN (zaak toevoegen). */
export function listingAcceptsPublicClaim(row: {
  claimed_at?: string | null
  pin_hash?: string | null
}): boolean {
  if (row.claimed_at) return false
  return !Boolean(String(row.pin_hash ?? '').trim())
}

/** @deprecated Gebruik listingAcceptsPublicClaim; fallback als pin_hash niet geladen is. */
export function listingShowsClaimUi(claimedAt: string | null | undefined): boolean {
  return !claimedAt
}

/** Staff / intern: eigenaar actief (PIN of goedgekeurde claim). */
export function listingHasRegisteredOwner(row: {
  claimed_at?: string | null
  pin_hash?: string | null
}): boolean {
  if (row.claimed_at) return true
  return Boolean(String(row.pin_hash ?? '').trim())
}
