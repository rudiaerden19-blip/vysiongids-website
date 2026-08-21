import { NextResponse } from 'next/server'
import { applyOwnerSessionRefresh, readGidsOwnerSession } from '@/lib/gids-session'
import { requireGidsChatOwner } from '@/lib/gids-chat-api-auth'
import { resolveGidsChatContextAdmin } from '@/lib/gids-chat-context'
import { findOrCreateGidsChatThreadAdmin, listGidsChatThreadsForListingAdmin } from '@/lib/gids-chat-db'
import type { GidsChatContextType } from '@/lib/gids-chat-types'
import { fetchListingRowByIdAdmin } from '@/lib/gids-listings-db'
import { listingCanUseGidsChatFromRow } from '@/lib/gids-chat-access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PostBody = {
  contextType?: GidsChatContextType
  contextId?: string
  contextSlug?: string
}

export async function GET() {
  const owner = await requireGidsChatOwner()
  if (!owner.ok) return owner.response

  const session = await readGidsOwnerSession()
  const result = await listGidsChatThreadsForListingAdmin(owner.listingId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 })
  }

  const res = NextResponse.json({ threads: result.threads })
  return session ? applyOwnerSessionRefresh(res, session) : res
}

export async function POST(req: Request) {
  const owner = await requireGidsChatOwner()
  if (!owner.ok) return owner.response

  let body: PostBody
  try {
    body = (await req.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const contextType = body.contextType
  if (contextType !== 'zoekertje' && contextType !== 'diensten_listing') {
    return NextResponse.json({ error: 'Ongeldig chattype.' }, { status: 400 })
  }

  const resolved = await resolveGidsChatContextAdmin({
    contextType,
    contextId: body.contextId,
    contextSlug: body.contextSlug,
  })
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status })
  }

  const { ctx } = resolved
  if (ctx.sellerListingId === owner.listingId) {
    return NextResponse.json({ error: 'Je kunt geen chat starten met jezelf.', code: 'self' }, { status: 400 })
  }

  const sellerRow = await fetchListingRowByIdAdmin(ctx.sellerListingId)
  if (!sellerRow) {
    return NextResponse.json({ error: 'Verkoper niet gevonden.' }, { status: 404 })
  }
  if (!listingCanUseGidsChatFromRow(sellerRow)) {
    return NextResponse.json(
      { error: 'De verkoper heeft geen actief lidmaatschap om chat te ontvangen.' },
      { status: 403 },
    )
  }

  const thread = await findOrCreateGidsChatThreadAdmin({
    contextType: ctx.contextType,
    contextId: ctx.contextId,
    sellerListingId: ctx.sellerListingId,
    buyerListingId: owner.listingId,
  })
  if (!thread.ok) {
    return NextResponse.json({ error: thread.error }, { status: 503 })
  }

  const session = await readGidsOwnerSession()
  const res = NextResponse.json({
    threadId: thread.threadId,
    created: thread.created,
    contextTitle: ctx.contextTitle,
  })
  return session ? applyOwnerSessionRefresh(res, session) : res
}
