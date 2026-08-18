import { NextResponse } from 'next/server'
import { drivingLegsFromOrigin } from '@/lib/osrm-driving'

export const dynamic = 'force-dynamic'

type Body = {
  from?: { lat?: number; lng?: number }
  destinations?: Array<{ lat?: number; lng?: number }>
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const lat = body.from?.lat
  const lng = body.from?.lng
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'missing_from' }, { status: 400 })
  }

  const destinations = (body.destinations ?? [])
    .filter((d) => typeof d.lat === 'number' && typeof d.lng === 'number')
    .map((d) => ({ lat: d.lat as number, lng: d.lng as number }))

  if (destinations.length === 0) {
    return NextResponse.json({ legs: [] as Array<{ km: number; minutes: number } | null> })
  }
  if (destinations.length > 25) {
    return NextResponse.json({ error: 'too_many_destinations' }, { status: 400 })
  }

  const legs = await drivingLegsFromOrigin({ lat, lng }, destinations)
  return NextResponse.json({ legs })
}
