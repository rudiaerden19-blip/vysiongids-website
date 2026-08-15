import { NextResponse } from 'next/server'
import { isGidsSupabaseConfigured } from '@/lib/supabase-gids'
import { fetchPublishedListingsFromDb } from '@/lib/gids-listings-db'
import { isGidsSessionConfigured } from '@/lib/gids-session'

export async function GET() {
  const configured = isGidsSupabaseConfigured()
  let dbCount: number | null = null
  if (configured) {
    const rows = await fetchPublishedListingsFromDb()
    dbCount = rows?.length ?? null
  }
  const explicitSecret = Boolean(process.env.VYSIONGIDS_SESSION_SECRET?.trim())
  return NextResponse.json({
    ok: true,
    supabaseConfigured: configured,
    publishedListingsInDb: dbCount,
    sessionSecretSet: isGidsSessionConfigured(),
    sessionSecretExplicit: explicitSecret,
  })
}
