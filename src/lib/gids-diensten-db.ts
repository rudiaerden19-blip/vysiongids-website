import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { dienstenComplimentaryExpiresIso, dienstenMembershipDays } from '@/lib/gids-diensten-membership'

export async function activateGidsDienstenMembershipByIdAdmin(
  listingId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const now = new Date()
  const expires = new Date(now)
  expires.setDate(expires.getDate() + dienstenMembershipDays())

  const { error } = await admin
    .from('gids_listings')
    .update({
      status: 'published',
      diensten_paid_at: now.toISOString(),
      diensten_expires_at: expires.toISOString(),
    })
    .eq('id', listingId)
    .eq('listing_segment', 'diensten')

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Eigenaar/gratis: zichtbaar blijven na PIN-wijziging (complimentary-vlag + verre vervaldatum). */
export async function grantDienstenMembershipDevByIdAdmin(listingId: string): Promise<void> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return
  const now = new Date()
  await admin
    .from('gids_listings')
    .update({
      status: 'published',
      diensten_complimentary: true,
      diensten_paid_at: now.toISOString(),
      diensten_expires_at: dienstenComplimentaryExpiresIso(now),
    })
    .eq('id', listingId)
    .eq('listing_segment', 'diensten')
}

/** Na PIN-wijziging: complimentary-profiel blijft gratis (vlag niet wissen). */
export async function keepDienstenComplimentaryAfterPinChange(listingId: string): Promise<void> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return
  await admin
    .from('gids_listings')
    .update({
      diensten_complimentary: true,
      status: 'published',
      diensten_expires_at: dienstenComplimentaryExpiresIso(),
    })
    .eq('id', listingId)
    .eq('listing_segment', 'diensten')
    .eq('diensten_complimentary', true)
}
