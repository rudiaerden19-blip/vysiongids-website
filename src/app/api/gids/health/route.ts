import { NextResponse } from 'next/server'
import { isGidsSupabaseConfigured } from '@/lib/supabase-gids'
import { fetchPublishedListingsFromDb } from '@/lib/gids-listings-db'

export async function GET() {
  const configured = isGidsSupabaseConfigured()
  let dbCount: number | null = null
  if (configured) {
    const rows = await fetchPublishedListingsFromDb()
    dbCount = rows?.length ?? null
  }
  return NextResponse.json({
    ok: true,
    supabaseConfigured: configured,
    publishedListingsInDb: dbCount,
    sessionSecretSet: Boolean(process.env.VYSIONGIDS_SESSION_SECRET?.trim()),
  })
}
