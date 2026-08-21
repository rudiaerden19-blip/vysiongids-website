import { NextResponse } from 'next/server'
import { applyOwnerSessionRefresh, readGidsOwnerSession } from '@/lib/gids-session'
import { requireGidsChatOwner } from '@/lib/gids-chat-api-auth'
import { countGidsChatUnreadAdmin } from '@/lib/gids-chat-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const owner = await requireGidsChatOwner()
  if (!owner.ok) return owner.response

  const count = await countGidsChatUnreadAdmin(owner.listingId)
  const session = await readGidsOwnerSession()
  const res = NextResponse.json({ unread: count })
  return session ? applyOwnerSessionRefresh(res, session) : res
}
