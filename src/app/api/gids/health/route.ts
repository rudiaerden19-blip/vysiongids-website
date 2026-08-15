import { NextResponse } from 'next/server'
import { isGidsSupabaseConfigured, createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { fetchPublishedListingsFromDb } from '@/lib/gids-listings-db'
import { isGidsSessionConfigured } from '@/lib/gids-session'
import { ensureGidsPhotosBucket } from '@/lib/gids-listing-photos-server'

export async function GET() {
  const configured = isGidsSupabaseConfigured()
  let dbCount: number | null = null
  let photosBucketReady: boolean | null = null
  if (configured) {
    const rows = await fetchPublishedListingsFromDb()
    dbCount = rows?.length ?? null
    const admin = createGidsSupabaseAdmin()
    if (admin) {
      const bucket = await ensureGidsPhotosBucket(admin)
      photosBucketReady = bucket.ok
    }
  }
  const explicitSecret = Boolean(process.env.VYSIONGIDS_SESSION_SECRET?.trim())
  return NextResponse.json({
    ok: true,
    supabaseConfigured: configured,
    publishedListingsInDb: dbCount,
    sessionSecretSet: isGidsSessionConfigured(),
    sessionSecretExplicit: explicitSecret,
    photosBucketReady,
  })
}
