import type { SupabaseClient } from '@supabase/supabase-js'
import { listingAcceptsPublicClaim } from '@/lib/listing-claimable'
import {
  GIDS_DEFAULT_STARTER_PIN,
  generateGidsOwnerPin,
  hashGidsPin,
  isValidGidsPin,
  verifyGidsPin,
} from '@/lib/gids-pin'

export type ActivateGidsListingFromClaimInput = {
  listingId: string
  contactEmail: string
  contactPhone: string
  /** Alleen als de listing nog geen pin_hash heeft. */
  pin?: string
}

export type ActivateGidsListingFromClaimResult =
  | { ok: true; keptExistingPin: boolean }
  | { ok: false; reason: 'already_owned' | 'invalid_pin' | 'db_error'; message?: string }

/**
 * Na claim: claimed_at zetten (knop weg, staff-rij groen).
 * Bestaande PIN (123456 van staff) blijft staan tot de ondernemer die in beheer wijzigt.
 */
export async function activateGidsListingFromClaim(
  admin: SupabaseClient,
  input: ActivateGidsListingFromClaimInput,
): Promise<ActivateGidsListingFromClaimResult> {
  const { data: row, error: readErr } = await admin
    .from('gids_listings')
    .select('id, claimed_at, pin_hash')
    .eq('id', input.listingId)
    .maybeSingle()

  if (readErr || !row) {
    return { ok: false, reason: 'db_error', message: readErr?.message }
  }

  if (!listingAcceptsPublicClaim({ claimed_at: row.claimed_at })) {
    return { ok: false, reason: 'already_owned' }
  }

  const existingHash = typeof row.pin_hash === 'string' ? row.pin_hash.trim() : ''
  const keptExistingPin = existingHash.length > 0
  if (!keptExistingPin) {
    if (!input.pin || !isValidGidsPin(input.pin)) {
      return { ok: false, reason: 'invalid_pin' }
    }
  }

  const isStarterPin = keptExistingPin && verifyGidsPin(GIDS_DEFAULT_STARTER_PIN, existingHash)
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = {
    claimed_at: now,
    email: input.contactEmail.trim().toLowerCase(),
    phone: input.contactPhone.trim(),
    // Alleen 123456 of nieuwe PIN: eigen PIN van zaak-toevoegen niet forceren.
    pin_must_change: !keptExistingPin || isStarterPin,
  }
  if (!keptExistingPin && input.pin) {
    patch.pin_hash = hashGidsPin(input.pin)
  }

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

  return { ok: true, keptExistingPin }
}

export function newClaimOwnerPin(): string {
  return generateGidsOwnerPin()
}
