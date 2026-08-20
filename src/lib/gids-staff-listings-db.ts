import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { addPremiumTermDays, resolveListingPremiumActive } from '@/lib/gids-premium'

export type GidsStaffListingRow = {
  id: string
  slug: string
  name: string
  address: string
  city: string
  postcode: string
  status: string
  premium_member: boolean
  premium_paid_at: string | null
  premium_expires_at: string | null
  premium_paused: boolean
  premiumActive: boolean
  created_at: string
}

const STAFF_LISTING_SELECT =
  'id, slug, name, address, city, postcode, status, premium_member, premium_paid_at, premium_expires_at, premium_paused, created_at'

export async function fetchAllGidsListingsForStaffAdmin(): Promise<GidsStaffListingRow[] | null> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return null

  const { data, error } = await admin.from('gids_listings').select(STAFF_LISTING_SELECT).order('name')

  if (error) {
    console.error('[gids-staff] list:', error.message)
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => {
    const premium_member = row.premium_member === true
    const premium_paused = row.premium_paused === true
    const premium_paid_at = (row.premium_paid_at as string | null) ?? null
    const premium_expires_at = (row.premium_expires_at as string | null) ?? null
    return {
      id: row.id as string,
      slug: row.slug as string,
      name: row.name as string,
      address: row.address as string,
      city: row.city as string,
      postcode: row.postcode as string,
      status: (row.status as string) ?? 'published',
      premium_member,
      premium_paid_at,
      premium_expires_at,
      premium_paused,
      premiumActive: resolveListingPremiumActive({
        premium_member,
        premium_paused,
        premium_expires_at,
      }),
      created_at: row.created_at as string,
    }
  })
}

export type StaffListingAction = 'mark_paid' | 'pause' | 'resume' | 'revoke_premium'

export async function applyGidsStaffListingActionAdmin(
  listingId: string,
  action: StaffListingAction,
): Promise<{ ok: true; row: GidsStaffListingRow } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const { data: existing, error: fetchErr } = await admin
    .from('gids_listings')
    .select(STAFF_LISTING_SELECT)
    .eq('id', listingId)
    .maybeSingle()

  if (fetchErr || !existing) return { ok: false, error: 'Zaak niet gevonden.' }

  let patch: Record<string, unknown> = {}

  if (action === 'mark_paid') {
    const now = new Date()
    patch = {
      premium_member: true,
      premium_paused: false,
      premium_paid_at: now.toISOString(),
      premium_expires_at: addPremiumTermDays(now).toISOString(),
    }
  } else if (action === 'pause') {
    patch = { premium_paused: true }
  } else if (action === 'resume') {
    patch = { premium_paused: false }
  } else if (action === 'revoke_premium') {
    patch = {
      premium_member: false,
      premium_paused: false,
      premium_paid_at: null,
      premium_expires_at: null,
    }
  }

  const { data: updated, error: updErr } = await admin
    .from('gids_listings')
    .update(patch)
    .eq('id', listingId)
    .select(STAFF_LISTING_SELECT)
    .single()

  if (updErr || !updated) return { ok: false, error: updErr?.message ?? 'Opslaan mislukt.' }

  const premium_member = updated.premium_member === true
  const premium_paused = updated.premium_paused === true
  const premium_paid_at = (updated.premium_paid_at as string | null) ?? null
  const premium_expires_at = (updated.premium_expires_at as string | null) ?? null

  return {
    ok: true,
    row: {
      id: updated.id as string,
      slug: updated.slug as string,
      name: updated.name as string,
      address: updated.address as string,
      city: updated.city as string,
      postcode: updated.postcode as string,
      status: (updated.status as string) ?? 'published',
      premium_member,
      premium_paid_at,
      premium_expires_at,
      premium_paused,
      premiumActive: resolveListingPremiumActive({
        premium_member,
        premium_paused,
        premium_expires_at,
      }),
      created_at: updated.created_at as string,
    },
  }
}

export async function setGidsListingPausedAdmin(
  listingId: string,
  hidden: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }
  const { error } = await admin
    .from('gids_listings')
    .update({ status: hidden ? 'hidden' : 'published' })
    .eq('id', listingId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function fetchGidsListingSlugByIdAdmin(listingId: string): Promise<string | undefined> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return undefined
  const { data } = await admin.from('gids_listings').select('slug').eq('id', listingId).maybeSingle()
  return (data?.slug as string | undefined) ?? undefined
}
