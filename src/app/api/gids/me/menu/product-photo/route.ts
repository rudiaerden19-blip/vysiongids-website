import { NextResponse } from 'next/server'
import { getGidsOwnerListingIdFromCookies } from '@/lib/gids-session'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { ensureGidsPhotosBucket, GIDS_LISTING_PHOTOS_BUCKET, siteOriginFromRequest } from '@/lib/gids-listing-photos-server'

export const maxDuration = 60

const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: Request) {
  const listingId = await getGidsOwnerListingIdFromCookies({ touch: true })
  if (!listingId) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createGidsSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: 'Database niet geconfigureerd.' }, { status: 503 })

  const bucketReady = await ensureGidsPhotosBucket(admin)
  if (!bucketReady.ok) return NextResponse.json({ error: bucketReady.message }, { status: 503 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ongeldig formulier.' }, { status: 400 })
  }

  const productId = String(form.get('productId') ?? '').trim()
  const file = form.get('photo')
  if (!productId || !/^[a-f0-9-]{36}$/i.test(productId)) {
    return NextResponse.json({ error: 'Ongeldig product.' }, { status: 400 })
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Kies een foto.' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Alleen afbeeldingen.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Foto max. 5 MB.' }, { status: 400 })
  }

  const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
  const path = `${listingId}/menu/${productId}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: true,
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const origin = siteOriginFromRequest(req)
  const { data: pub } = admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).getPublicUrl(path)
  let publicUrl = pub.publicUrl
  if (!publicUrl.startsWith('http')) {
    publicUrl = `${origin}${publicUrl.startsWith('/') ? '' : '/'}${publicUrl}`
  }

  await admin
    .from('gids_menu_products')
    .update({ image_url: publicUrl })
    .eq('id', productId)
    .eq('listing_id', listingId)
    .then(({ error }) => {
      if (error) console.warn('[gids menu photo] db image_url update:', error.message)
    })

  return NextResponse.json({ publicUrl })
}
