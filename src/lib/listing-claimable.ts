/** Claim-knop + claim-formulier: alleen zolang claimed_at leeg is. Geen PIN-checks. */
export function listingShowsClaimUi(claimedAt: string | null | undefined): boolean {
  return !claimedAt
}

export function listingAcceptsPublicClaim(row: { claimed_at?: string | null }): boolean {
  return listingShowsClaimUi(row.claimed_at)
}

/** Staff: groene rij na claim (claimed_at gezet). */
export function staffListingIsClaimedByClaim(claimedAt: string | null | undefined): boolean {
  return Boolean(claimedAt)
}
