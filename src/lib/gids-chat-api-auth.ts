import { NextResponse } from 'next/server'
import { readGidsOwnerSession } from '@/lib/gids-session'
import { fetchListingRowByIdAdmin } from '@/lib/gids-listings-db'
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

  const row = await fetchListingRowByIdAdmin(session.listingId)
  if (!row) {
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
  return { ok: true, listingId: row.id, segment }
}
