import type { SupabaseClient } from '@supabase/supabase-js'

export const GIDS_LISTING_PHOTOS_BUCKET = 'gids-listing-photos'

export function siteOriginFromRequest(req: Request): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_VYSIONGIDS_SITE_URL ?? 'https://www.vysiongids.be'
}

/** Registratie/uploads falen duidelijk als de bucket in Supabase ontbreekt. */
export async function ensureGidsPhotosBucket(
  admin: SupabaseClient,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await admin.storage.listBuckets()
  if (error) return { ok: false, message: error.message }
  const found = data?.some((b) => b.name === GIDS_LISTING_PHOTOS_BUCKET)
  if (!found) {
    return {
      ok: false,
      message:
        'Foto-opslag ontbreekt: maak in Supabase Storage een public bucket «gids-listing-photos» aan (zie DEPLOY.md).',
    }
  }
  return { ok: true }
}

export async function uploadGidsListingPhoto(
  admin: SupabaseClient,
  listingId: string,
  index: number,
  file: File,
  origin: string,
): Promise<void> {
  const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
  const path = `${listingId}/${index}.${ext}`
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: true,
  })
  if (upErr) throw new Error(upErr.message)

  const { data: pub } = admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).getPublicUrl(path)
  const publicUrl = pub.publicUrl.startsWith('http') ? pub.publicUrl : `${origin}${pub.publicUrl}`

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
