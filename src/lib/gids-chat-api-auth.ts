import { NextResponse } from 'next/server'
import { readGidsOwnerSession } from '@/lib/gids-session'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import {
  gidsChatMembershipDeniedMessage,
  listingCanUseGidsChatFromRow,
} from '@/lib/gids-chat-access'
import { LISTING_SEGMENT_DIENSTEN } from '@/lib/listing-segment'

export type GidsChatOwnerContext =
  | { ok: true; listingId: string; segment: 'horeca' | 'diensten' }
  | { ok: false; response: NextResponse }

export async function requireGidsChatOwner(): Promise<GidsChatOwnerContext> {
  const session = await readGidsOwnerSession()
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Niet ingelogd.', code: 'auth' }, { status: 401 }),
    }
  }

  const admin = createGidsSupabaseAdmin()
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 }),
    }
  }

  const { data: row, error } = await admin
    .from('gids_listings')
    .select(
      'id, listing_segment, premium_member, premium_paused, premium_expires_at, diensten_expires_at, diensten_complimentary, status',
    )
    .eq('id', session.listingId)
    .maybeSingle()

  if (error || !row) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Profiel niet gevonden.' }, { status: 404 }),
    }
  }

  if (!listingCanUseGidsChatFromRow(row)) {
    const segment = row.listing_segment === LISTING_SEGMENT_DIENSTEN ? 'diensten' : 'horeca'
    return {
      ok: false,
      response: NextResponse.json(
        { error: gidsChatMembershipDeniedMessage(segment), code: 'membership' },
        { status: 403 },
      ),
    }
  }

  const segment = row.listing_segment === LISTING_SEGMENT_DIENSTEN ? 'diensten' : 'horeca'
  return { ok: true, listingId: row.id as string, segment }
}
