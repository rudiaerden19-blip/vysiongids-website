import { NextResponse } from 'next/server'
import { applyOwnerSessionRefresh, readGidsOwnerSession } from '@/lib/gids-session'
import { requireGidsChatOwner } from '@/lib/gids-chat-api-auth'
import { deleteGidsChatThreadForParticipantAdmin, fetchGidsChatThreadDetailAdmin } from '@/lib/gids-chat-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const owner = await requireGidsChatOwner()
  if (!owner.ok) return owner.response

  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: 'Ontbrekend id.' }, { status: 400 })

  const result = await fetchGidsChatThreadDetailAdmin(id, owner.listingId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const session = await readGidsOwnerSession()
  const res = NextResponse.json({ thread: result.detail })
  return session ? applyOwnerSessionRefresh(res, session) : res
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const owner = await requireGidsChatOwner()
  if (!owner.ok) return owner.response

  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: 'Ontbrekend id.' }, { status: 400 })

  const result = await deleteGidsChatThreadForParticipantAdmin(id, owner.listingId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const session = await readGidsOwnerSession()
  const res = NextResponse.json({ ok: true })
  return session ? applyOwnerSessionRefresh(res, session) : res
}
