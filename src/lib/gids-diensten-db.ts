import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { dienstenMembershipDays } from '@/lib/gids-diensten-membership'

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

/** Zonder Stripe (dev): direct zichtbaar met 1 jaar lidmaatschap. */
export async function grantDienstenMembershipDevByIdAdmin(listingId: string): Promise<void> {
  await activateGidsDienstenMembershipByIdAdmin(listingId)
}
