import { NextResponse } from 'next/server'
import { resolveListingActionIntent } from '@/lib/gids-listing-action-intent'
import { getAllListings } from '@/lib/listings'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (!q) {
    return NextResponse.json({ kind: 'search' })
  }
  const listings = await getAllListings()
  const intent = resolveListingActionIntent(q, listings)
  return NextResponse.json(intent)
}
