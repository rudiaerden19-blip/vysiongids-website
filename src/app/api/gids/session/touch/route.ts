import { NextResponse } from 'next/server'
import { readGidsOwnerSession } from '@/lib/gids-session'

export const runtime = 'nodejs'

/** Houd beheer-sessie actief tijdens lang formulierwerk (sliding idle). */
export async function POST() {
  const session = await readGidsOwnerSession({ touch: true })
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ ok: true, listingId: session.listingId })
}
