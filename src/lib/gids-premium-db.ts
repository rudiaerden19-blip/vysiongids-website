import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { addPremiumTermDays } from '@/lib/gids-premium'

/** Na succesvolle Stripe-betaling of handmatig door medewerker. */
export async function activateGidsListingPremiumByIdAdmin(
  listingId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const now = new Date()
  const { error } = await admin
    .from('gids_listings')
    .update({
      premium_member: true,
      premium_paused: false,
      premium_paid_at: now.toISOString(),
      premium_expires_at: addPremiumTermDays(now).toISOString(),
    })
    .eq('id', listingId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
