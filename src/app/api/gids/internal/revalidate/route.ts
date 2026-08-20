import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'

/** Alleen voor het aparte medewerkersportaal (zelfde wachtwoord als VYSIONGIDS_STAFF_PASSWORD). */
export async function POST(req: Request) {
  const expected = process.env.VYSIONGIDS_STAFF_PASSWORD?.trim()
  if (!expected) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  if (a.length !== b.length) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let slug: string | undefined
  try {
    const body = (await req.json()) as { slug?: string }
    if (typeof body.slug === 'string' && body.slug.trim()) slug = body.slug.trim()
  } catch {
    /* lege body ok */
  }

  revalidateTag('gids-listings', 'max')
  revalidatePath('/')
  if (slug) {
    revalidatePath(`/zaak/${slug}`)
    revalidatePath(`/zaak/${slug}/reviews`)
  }

  return NextResponse.json({ ok: true })
}
