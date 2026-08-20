import { NextResponse } from 'next/server'
import { searchListings } from '@/lib/listings'

export const revalidate = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? undefined
  const type = searchParams.get('type') ?? undefined
  const prov = searchParams.get('prov') ?? undefined
  const nearLat = Number(searchParams.get('nearLat'))
  const nearLng = Number(searchParams.get('nearLng'))

  const search = await searchListings({
    q,
    type,
    prov,
    nearLat: Number.isFinite(nearLat) ? nearLat : undefined,
    nearLng: Number.isFinite(nearLng) ? nearLng : undefined,
  })
  const top = search.listings[0]
  return NextResponse.json(
    {
      count: search.total,
      shown: search.listings.length,
      capped: search.capped,
      top: top ? { slug: top.slug, name: top.name } : null,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    },
  )
}
