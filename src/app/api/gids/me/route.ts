import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { mapGidsRowToListing, fetchListingRowByIdAdmin } from '@/lib/gids-listings-db'

export async function GET() {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) return NextResponse.json({ authenticated: false })

  const row = await fetchListingRowByIdAdmin(listingId)
  if (!row) return NextResponse.json({ authenticated: false })

  const listing = mapGidsRowToListing(row)
  return NextResponse.json({
    authenticated: true,
    listingId: row.id,
    slug: listing.slug,
    name: listing.name,
    listing,
  })
}

export async function DELETE() {
  const listingId = await getGidsOwnerListingIdFromCookies()
  if (!listingId) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const admin = createGidsSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })
  }

  const { data: photos } = await admin.from('gids_listing_photos').select('storage_path').eq('listing_id', listingId)
  if (photos?.length) {
    const paths = photos.map((p) => p.storage_path).filter(Boolean)
    if (paths.length) await admin.storage.from('gids-listing-photos').remove(paths)
  }

  const { error } = await admin.from('gids_listings').delete().eq('id', listingId)
  if (error) {
    return NextResponse.json({ error: 'Verwijderen mislukt.' }, { status: 500 })
  }

  revalidateTag('gids-listings', 'max')

  const res = NextResponse.json({ ok: true })
  res.cookies.set('gids_owner_session', '', { maxAge: 0, path: '/' })
  return res
}
