import type { SupabaseClient } from '@supabase/supabase-js'
import { listingAcceptsPublicClaim } from '@/lib/listing-claimable'
import { generateGidsOwnerPin, hashGidsPin, isValidGidsPin } from '@/lib/gids-pin'

export type ActivateGidsListingFromClaimInput = {
  listingId: string
  contactEmail: string
  contactPhone: string
  /** PIN die al naar de klant gemaild is (zelfde hash in DB). */
  pin: string
}

export type ActivateGidsListingFromClaimResult =
  | { ok: true }
  | { ok: false; reason: 'already_owned' | 'invalid_pin' | 'db_error'; message?: string }

/** Zet eigenaar-PIN + claimed_at; keur pending claims goed. Alleen zonder bestaande eigenaar. */
export async function activateGidsListingFromClaim(
  admin: SupabaseClient,
  input: ActivateGidsListingFromClaimInput,
): Promise<ActivateGidsListingFromClaimResult> {
  if (!isValidGidsPin(input.pin)) {
    return { ok: false, reason: 'invalid_pin' }
  }

  const { data: row, error: readErr } = await admin
    .from('gids_listings')
    .select('id, claimed_at')
    .eq('id', input.listingId)
    .maybeSingle()

  if (readErr || !row) {
    return { ok: false, reason: 'db_error', message: readErr?.message }
  }

  if (!listingAcceptsPublicClaim({ claimed_at: row.claimed_at })) {
    return { ok: false, reason: 'already_owned' }
  }

  const pinHash = hashGidsPin(input.pin)
  const now = new Date().toISOString()

  const patch: Record<string, unknown> = {
    pin_hash: pinHash,
    claimed_at: now,
    email: input.contactEmail.trim().toLowerCase(),
    phone: input.contactPhone.trim(),
  }
  patch.pin_must_change = true

  const { error: updateErr } = await admin.from('gids_listings').update(patch).eq('id', input.listingId)

  if (updateErr) {
    if (/pin_must_change/i.test(updateErr.message)) {
      delete patch.pin_must_change
      const { error: retryErr } = await admin.from('gids_listings').update(patch).eq('id', input.listingId)
      if (retryErr) {
        return { ok: false, reason: 'db_error', message: retryErr.message }
      }
    } else {
      return { ok: false, reason: 'db_error', message: updateErr.message }
    }
  }

  const { error: approveErr } = await admin
    .from('gids_listing_claim_requests')
    .update({ status: 'approved' })
    .eq('listing_id', input.listingId)
    .eq('status', 'pending')

  if (approveErr) {
    console.warn('[gids claim activate] approve requests:', approveErr.message)
  }

  return { ok: true }
}

export function newClaimOwnerPin(): string {
  return generateGidsOwnerPin()
}
