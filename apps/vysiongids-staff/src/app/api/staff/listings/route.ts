import { NextResponse } from 'next/server'
import { isGidsStaffAuthenticated } from '@/lib/gids-staff-session'
import { fetchAllGidsListingsForStaffAdmin } from '@/lib/gids-staff-listings-db'

export async function GET() {
  if (!(await isGidsStaffAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const listings = await fetchAllGidsListingsForStaffAdmin()
  if (!listings) {
    return NextResponse.json({ error: 'Database niet beschikbaar.' }, { status: 503 })
  }

  return NextResponse.json({ listings })
}
