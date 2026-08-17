import { NextResponse } from 'next/server'
import { searchListings } from '@/lib/listings'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? undefined
  const type = searchParams.get('type') ?? undefined
  const prov = searchParams.get('prov') ?? undefined
  const nearLat = Number(searchParams.get('nearLat'))
  const nearLng = Number(searchParams.get('nearLng'))

  const results = await searchListings({
    q,
    type,
    prov,
    nearLat: Number.isFinite(nearLat) ? nearLat : undefined,
    nearLng: Number.isFinite(nearLng) ? nearLng : undefined,
  })
  const top = results[0]
  return NextResponse.json({
    count: results.length,
    top: top ? { slug: top.slug, name: top.name } : null,
  })
}
