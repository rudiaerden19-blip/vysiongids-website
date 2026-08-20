import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { isGidsStaffAuthenticated } from '@/lib/gids-staff-session'
import { fetchAllGidsListingsForStaffAdmin } from '@/lib/gids-staff-listings-db'

export async function GET() {
  if (!(await isGidsStaffAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const listings = await fetchAllGidsListingsForStaffAdmin()
    if (!listings) {
      return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
    }
    return NextResponse.json({ listings })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Onbekende databasefout'
    return NextResponse.json(
      { error: `Databasefout: ${msg}. Voer STAFF_PREMIUM_COLUMNS.sql uit in Supabase als kolommen ontbreken.` },
      { status: 503 },
    )
  }
}
