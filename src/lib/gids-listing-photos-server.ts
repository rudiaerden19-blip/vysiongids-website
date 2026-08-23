import type { SupabaseClient } from '@supabase/supabase-js'
import { siteOriginFromRequest } from '@/lib/gids-site-origin'

export { siteOriginFromRequest }

export const GIDS_LISTING_PHOTOS_BUCKET = 'gids-listing-photos'

/** Registratie/uploads falen duidelijk als de bucket in Supabase ontbreekt of niet public is. */
export async function ensureGidsPhotosBucket(
  admin: SupabaseClient,
): Promise<{ ok: true; public: boolean } | { ok: false; message: string }> {
  const { data: bucket, error } = await admin.storage.getBucket(GIDS_LISTING_PHOTOS_BUCKET)
  if (error || !bucket) {
    return {
      ok: false,
      message:
        'Foto-opslag ontbreekt: maak in Supabase Storage een bucket «gids-listing-photos» aan (zie DEPLOY.md).',
    }
  }
  if (!bucket.public) {
    return {
      ok: false,
      message:
        'Bucket gids-listing-photos is niet public (POLICIES 0). Zet «Public bucket» aan in Supabase Storage, of run supabase/migrations/005_storage_gids_listing_photos_public.sql in de SQL Editor.',
    }
  }
  return { ok: true, public: true }
}

export async function uploadGidsListingPhoto(
  admin: SupabaseClient,
  listingId: string,
  index: number,
  file: File,
  origin: string,
): Promise<void> {
  const { data: existingRow } = await admin
    .from('gids_listing_photos')
    .select('storage_path')
    .eq('listing_id', listingId)
    .eq('sort_order', index)
    .maybeSingle()

  if (existingRow?.storage_path) {
    await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).remove([existingRow.storage_path])
  }

  const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
  const version = Date.now().toString(36)
  const path = `${listingId}/${index}-${version}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: false,
  })
  if (upErr) throw new Error(upErr.message)

  const { data: pub } = admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).getPublicUrl(path)
  const publicUrlBase = pub.publicUrl.startsWith('http') ? pub.publicUrl : `${origin}${pub.publicUrl}`
  const publicUrl = `${publicUrlBase}${publicUrlBase.includes('?') ? '&' : '?'}v=${Date.now()}`

  const { error: delErr } = await admin.from('gids_listing_photos').delete().eq('listing_id', listingId).eq('sort_order', index)
  if (delErr) throw new Error(delErr.message)

  const { error: photoErr } = await admin.from('gids_listing_photos').insert({
    listing_id: listingId,
    sort_order: index,
    storage_path: path,
    public_url: publicUrl,
  })
  if (photoErr) throw new Error(photoErr.message)
}

/** Specialiteiten-foto's (INFO-pagina) — URL staat in info_extras JSON. */
export async function uploadGidsListingSpecialtyPhoto(
  admin: SupabaseClient,
  listingId: string,
  index: number,
  file: File,
  origin: string,
): Promise<string> {
  const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
  const path = `${listingId}/specialty-${index}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: true,
  })
  if (upErr) throw new Error(upErr.message)

  const { data: pub } = admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).getPublicUrl(path)
  return pub.publicUrl.startsWith('http') ? pub.publicUrl : `${origin}${pub.publicUrl}`
}

/** Promotie-foto (INFO / beheer) — URL in info_extras.promotion. */
export async function uploadGidsListingPromotionPhoto(
  admin: SupabaseClient,
  listingId: string,
  file: File,
  origin: string,
): Promise<string> {
  const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
  const path = `${listingId}/promotion-0.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: true,
  })
  if (upErr) throw new Error(upErr.message)

  const { data: pub } = admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).getPublicUrl(path)
  return pub.publicUrl.startsWith('http') ? pub.publicUrl : `${origin}${pub.publicUrl}`
}

export async function removeGidsListingPhotoSlot(
  admin: SupabaseClient,
  listingId: string,
  index: number,
  storagePath?: string | null,
): Promise<void> {
  if (storagePath) {
    await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).remove([storagePath])
  }
  await admin.from('gids_listing_photos').delete().eq('listing_id', listingId).eq('sort_order', index)
}
