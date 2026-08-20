import { NextResponse } from 'next/server'
import { isGidsSupabaseConfigured, createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { fetchPublishedListingCountFromDb } from '@/lib/gids-listings-db'
import { isGidsSessionConfigured } from '@/lib/gids-session'
import { ensureGidsPhotosBucket } from '@/lib/gids-listing-photos-server'

export async function GET() {
  const configured = isGidsSupabaseConfigured()
  let dbCount: number | null = null
  let photosBucketReady: boolean | null = null
  if (configured) {
    dbCount = await fetchPublishedListingCountFromDb()
    const admin = createGidsSupabaseAdmin()
    if (admin) {
      const bucket = await ensureGidsPhotosBucket(admin)
      photosBucketReady = bucket.ok
    }
  }
  return NextResponse.json({
    ok: configured && isGidsSessionConfigured(),
    supabaseConfigured: configured,
    publishedListingsInDb: dbCount,
    sessionConfigured: isGidsSessionConfigured(),
    photosBucketReady,
  })
}
