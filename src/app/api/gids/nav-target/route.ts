import { NextResponse } from 'next/server'
import { getListingBySlug } from '@/lib/listings'
import { listingWazeUrl } from '@/lib/gids-listing-navigation'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')?.trim()
  if (!slug) {
    return NextResponse.json({ error: 'slug verplicht' }, { status: 400 })
  }
  const listing = await getListingBySlug(slug)
  if (!listing) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  }
  return NextResponse.json({
    slug: listing.slug,
    name: listing.name,
    wazeUrl: listingWazeUrl(listing),
  })
}
