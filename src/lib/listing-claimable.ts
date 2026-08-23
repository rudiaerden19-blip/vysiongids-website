/** Publieke claim-knop: alleen zolang de zaak nog niet officieel geclaimd is. */
export function listingShowsClaimUi(claimedAt: string | null | undefined): boolean {
  return !claimedAt
}

/** API/staff: eigenaar via zaak toevoegen (PIN) of goedgekeurde claim. */
export function listingHasRegisteredOwner(row: {
  claimed_at?: string | null
  pin_hash?: string | null
}): boolean {
  if (row.claimed_at) return true
  return Boolean(String(row.pin_hash ?? '').trim())
}
