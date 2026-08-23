import type { SupabaseClient } from '@supabase/supabase-js'

/** Nieuwste claim-e-mail per listing (claim-formulier staat niet altijd op gids_listings.email). */
export async function fetchLatestClaimEmailByListingIds(
  admin: SupabaseClient,
  listingIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const unique = [...new Set(listingIds.filter(Boolean))]
  if (unique.length === 0) return map

  const chunkSize = 100
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize)
    const { data, error } = await admin
      .from('gids_listing_claim_requests')
      .select('listing_id, contact_email, created_at')
      .in('listing_id', chunk)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[gids-staff] claim emails:', error.message)
      continue
    }
    for (const row of data ?? []) {
      const lid = row.listing_id as string
      if (map.has(lid)) continue
      const email = String(row.contact_email ?? '').trim()
      if (email) map.set(lid, email)
    }
  }
  return map
}

export function staffListingDisplayEmail(row: {
  email: string | null
  claim_contact_email?: string | null
}): string | null {
  const fromListing = row.email?.trim()
  if (fromListing) return fromListing
  const fromClaim = row.claim_contact_email?.trim()
  return fromClaim || null
}

/** Listing_ids met minstens één goedgekeurde claim (staff groene rij). */
export async function fetchApprovedClaimListingIds(
  admin: SupabaseClient,
  listingIds: string[],
): Promise<Set<string>> {
  const out = new Set<string>()
  const unique = [...new Set(listingIds.filter(Boolean))]
  if (unique.length === 0) return out

  const chunkSize = 100
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize)
    const { data, error } = await admin
      .from('gids_listing_claim_requests')
      .select('listing_id')
      .in('listing_id', chunk)
      .eq('status', 'approved')

    if (error) {
      console.error('[gids-staff] approved claims:', error.message)
      continue
    }
    for (const row of data ?? []) {
      const lid = row.listing_id as string
      if (lid) out.add(lid)
    }
  }
  return out
}
