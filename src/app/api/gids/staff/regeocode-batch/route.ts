import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { isGidsStaffAuthenticated } from '@/lib/gids-staff-session'
import { fetchPublishedListingSlugsBatchAdmin } from '@/lib/gids-listings-db'
import { getListingBySlug } from '@/lib/listings'
import { forceRefreshListingGeocode } from '@/lib/gids-listing-geocode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BATCH_LIMIT_MAX = 10
const STEP_DELAY_MS = 350

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Staff: hergeocode een chunk gepubliceerde zaken (batch over meerdere requests). */
export async function POST(req: Request) {
  if (!(await isGidsStaffAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let page = 1
  let limit = 8
  try {
    const body = (await req.json()) as { page?: unknown; limit?: unknown }
    if (typeof body.page === 'number' && Number.isFinite(body.page)) page = Math.max(1, Math.floor(body.page))
    if (typeof body.limit === 'number' && Number.isFinite(body.limit)) {
      limit = Math.min(BATCH_LIMIT_MAX, Math.max(1, Math.floor(body.limit)))
    }
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const batch = await fetchPublishedListingSlugsBatchAdmin(page, limit)
  if (!batch) {
    return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
  }

  const updates: Array<{ slug: string; lat: number; lng: number; changed: boolean }> = []
  let geocoded = 0
  let failed = 0

  for (let i = 0; i < batch.slugs.length; i++) {
    const slug = batch.slugs[i]!
    const listing = await getListingBySlug(slug)
    if (!listing) {
      failed++
      continue
    }
    const { listing: updated, changed, geocoded: ok } = await forceRefreshListingGeocode(listing)
    if (ok) geocoded++
    else failed++
    if (typeof updated.lat === 'number' && typeof updated.lng === 'number') {
      updates.push({ slug: updated.slug, lat: updated.lat, lng: updated.lng, changed })
    }
    if (i < batch.slugs.length - 1) await sleep(STEP_DELAY_MS)
  }

  const totalPages = Math.max(1, Math.ceil(batch.total / limit))
  const done = page >= totalPages

  if (done) {
    revalidateTag('gids-listings', 'max')
  }

  return NextResponse.json({
    page,
    limit,
    total: batch.total,
    totalPages,
    done,
    processed: batch.slugs.length,
    geocoded,
    failed,
    changed: updates.filter((u) => u.changed).length,
    updates,
  })
}
