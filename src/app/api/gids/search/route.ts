import { NextResponse } from 'next/server'
import { searchListings } from '@/lib/listings'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? undefined
  const type = searchParams.get('type') ?? undefined
  const prov = searchParams.get('prov') ?? undefined

  const results = await searchListings({ q, type, prov })
  return NextResponse.json({ count: results.length })
}
