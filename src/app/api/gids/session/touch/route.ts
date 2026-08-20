import { NextResponse } from 'next/server'
import { applyOwnerSessionRefresh, readGidsOwnerSession } from '@/lib/gids-session'

export const runtime = 'nodejs'

/** Houd beheer-sessie actief tijdens lang formulierwerk (sliding idle). */
export async function POST() {
  const session = await readGidsOwnerSession()
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return applyOwnerSessionRefresh(
    NextResponse.json({ ok: true, listingId: session.listingId }),
    session,
  )
}
