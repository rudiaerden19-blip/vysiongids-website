import { NextResponse } from 'next/server'
import { resolveListingActionIntentAsync } from '@/lib/gids-listing-action-intent'
import { getAllListings } from '@/lib/listings'

export const revalidate = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  if (!q) {
    return NextResponse.json({ kind: 'search' })
  }
  const nearLat = Number(searchParams.get('nearLat'))
  const nearLng = Number(searchParams.get('nearLng'))
  const near =
    Number.isFinite(nearLat) && Number.isFinite(nearLng)
      ? { lat: nearLat, lng: nearLng }
      : undefined

  const listings = await getAllListings()
  const intent = await resolveListingActionIntentAsync(q, listings, near)
  return NextResponse.json(intent)
}
