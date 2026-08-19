import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { deleteReviewsForListingSlugsAdmin } from '@/lib/gids-reviews-db'

export const runtime = 'nodejs'

type Body = {
  secret?: string
  slugs?: string[]
  maxRating?: number
}

/** Eenmalig / intern: purge reviews (Vercel: zet VYSIONGIDS_PURGE_REVIEWS_SECRET). */
export async function POST(req: Request) {
  const expected = process.env.VYSIONGIDS_PURGE_REVIEWS_SECRET?.trim()
  if (!expected) {
    return NextResponse.json({ error: 'purge_not_configured' }, { status: 503 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (body.secret !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const slugs = Array.isArray(body.slugs) ? body.slugs.filter((s) => typeof s === 'string') : []
  if (slugs.length === 0) {
    return NextResponse.json({ error: 'missing_slugs' }, { status: 400 })
  }

  const result = await deleteReviewsForListingSlugsAdmin(slugs, {
    maxRating: typeof body.maxRating === 'number' ? body.maxRating : 1,
  })

  if ('ok' in result && result.ok === false) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  revalidateTag('gids-listings', 'max')
  for (const slug of slugs) {
    revalidatePath(`/zaak/${slug}`)
    revalidatePath(`/zaak/${slug}/reviews`)
  }

  return NextResponse.json(result)
}
