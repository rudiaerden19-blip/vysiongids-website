import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { fetchListingIdBySlugAdmin, fetchReviewsByListingSlug, insertReviewAdmin } from '@/lib/gids-reviews-db'
import { formatGidsTitleCase, formatReviewCommentText } from '@/lib/gids-text'
import { enforceRateLimit } from '@/lib/gids-rate-limit'

const REVIEW_WINDOW_MS = 60 * 60 * 1000
const REVIEW_MAX_PER_IP = 15

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug')?.trim()
  if (!slug) return NextResponse.json({ error: 'slug ontbreekt' }, { status: 400 })

  const reviews = await fetchReviewsByListingSlug(slug, 100)
  if (reviews === null) {
    return NextResponse.json({ error: 'Reviews niet beschikbaar.' }, { status: 503 })
  }

  return NextResponse.json({ reviews })
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'gids-review-post', REVIEW_WINDOW_MS, REVIEW_MAX_PER_IP)
  if (limited) return limited

  let body: { slug?: string; rating?: number; reviewerName?: string; body?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 })
  }

  const slug = String(body.slug ?? '').trim()
  if (body.rating == null || typeof body.rating !== 'number') {
    return NextResponse.json({ error: 'Kies eerst je score: 1 tot 5 sterren.' }, { status: 400 })
  }
  const rating = body.rating
  const comment = formatReviewCommentText(String(body.body ?? '').trim())
  const reviewerNameRaw = body.reviewerName ? String(body.reviewerName).trim().slice(0, 80) : ''
  const reviewerName = reviewerNameRaw ? formatGidsTitleCase(reviewerNameRaw) : null

  if (!slug) return NextResponse.json({ error: 'Zaak ontbreekt.' }, { status: 400 })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Kies een score van 1 tot 5 sterren.' }, { status: 400 })
  }
  if (comment.length < 10) {
    return NextResponse.json({ error: 'Schrijf minstens 10 tekens in je review.' }, { status: 400 })
  }
  if (comment.length > 2000) {
    return NextResponse.json({ error: 'Review is te lang (max. 2000 tekens).' }, { status: 400 })
  }

  const listingId = await fetchListingIdBySlugAdmin(slug)
  if (!listingId) {
    return NextResponse.json({ error: 'Deze zaak accepteert nog geen online reviews.' }, { status: 404 })
  }

  const result = await insertReviewAdmin({
    listingId,
    rating,
    reviewerName: reviewerName || null,
    body: comment,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  revalidateTag('gids-listings', 'max')
  revalidatePath(`/zaak/${slug}`)
  revalidatePath(`/zaak/${slug}/reviews`)

  return NextResponse.json({ ok: true, id: result.id })
}
