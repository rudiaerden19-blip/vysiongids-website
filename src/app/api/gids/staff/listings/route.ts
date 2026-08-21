import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { isGidsStaffAuthenticated } from '@/lib/gids-staff-session'
import { fetchGidsListingsForStaffAdminPaginated } from '@/lib/gids-staff-listings-db'

export async function GET(req: Request) {
  if (!(await isGidsStaffAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const page = Number(url.searchParams.get('page') ?? '1')
  const limit = Number(url.searchParams.get('limit') ?? '80')
  const search = url.searchParams.get('search') ?? undefined
  const segmentParam = url.searchParams.get('segment')
  const segment =
    segmentParam === 'diensten' ? 'diensten' : segmentParam === 'horeca' ? 'horeca' : undefined

  try {
    const result = await fetchGidsListingsForStaffAdminPaginated({ page, limit, search, segment })
    if (!result) {
      return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
    }
    return NextResponse.json({
      listings: result.rows,
      total: result.total,
      page: Math.max(1, Math.floor(page) || 1),
      limit: Math.min(200, Math.max(1, Math.floor(limit) || 80)),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Onbekende databasefout'
    return NextResponse.json(
      { error: `Databasefout: ${msg}. Voer STAFF_PREMIUM_COLUMNS.sql uit in Supabase als kolommen ontbreken.` },
      { status: 503 },
    )
  }
}
