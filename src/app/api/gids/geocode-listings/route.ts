import { NextResponse } from 'next/server'
import { ensureListingGeocoded } from '@/lib/gids-listing-geocode'
import { listingStoredCoordsAreFallback } from '@/lib/listing-geo-fallback'
import { getListingBySlug } from '@/lib/listings'
import { enforceRateLimit } from '@/lib/gids-rate-limit'

export const dynamic = 'force-dynamic'

const MAX_SLUGS = 6
const GEO_WINDOW_MS = 60 * 60 * 1000
const GEO_MAX_PER_IP = 40

/** Achtergrond-geocode (niet op kritiek pad van zoeken/home). */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'gids-geocode-listings', GEO_WINDOW_MS, GEO_MAX_PER_IP)
  if (limited) return limited

  let slugs: unknown
  try {
    const body = (await req.json()) as { slugs?: unknown }
    slugs = body.slugs
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!Array.isArray(slugs)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const updates: Array<{ slug: string; lat: number; lng: number }> = []

  for (const raw of slugs.slice(0, MAX_SLUGS)) {
    if (typeof raw !== 'string' || !raw.trim()) continue
    const listing = await getListingBySlug(raw.trim())
    if (!listing) continue
    if (
      typeof listing.lat === 'number' &&
      typeof listing.lng === 'number' &&
      !listingStoredCoordsAreFallback(listing)
    ) {
      continue
    }
    const updated = await ensureListingGeocoded(listing)
    if (typeof updated.lat === 'number' && typeof updated.lng === 'number') {
      updates.push({ slug: updated.slug, lat: updated.lat, lng: updated.lng })
    }
  }

  return NextResponse.json({ updates })
}
