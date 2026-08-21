import { NextResponse } from 'next/server'
import { applyOwnerSessionRefresh, readGidsOwnerSession } from '@/lib/gids-session'
import { normalizeGidsChatBody } from '@/lib/gids-chat-access'
import { requireGidsChatOwner } from '@/lib/gids-chat-api-auth'
import { postGidsChatMessageAdmin } from '@/lib/gids-chat-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PostBody = { body?: string }

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const owner = await requireGidsChatOwner()
  if (!owner.ok) return owner.response

  const { id } = await ctx.params
  if (!id) return NextResponse.json({ error: 'Ontbrekend id.' }, { status: 400 })

  let body: PostBody
  try {
    body = (await req.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const text = normalizeGidsChatBody(body.body ?? '')
  if (!text) {
    return NextResponse.json({ error: 'Bericht mag niet leeg zijn.' }, { status: 400 })
  }

  const result = await postGidsChatMessageAdmin({
    threadId: id,
    senderListingId: owner.listingId,
    body: text,
  })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const session = await readGidsOwnerSession()
  const res = NextResponse.json({ message: result.message })
  return session ? applyOwnerSessionRefresh(res, session) : res
}
