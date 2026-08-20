import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'

export const GIDS_LISTING_PHOTOS_BUCKET = 'gids-listing-photos'

export async function deleteGidsListingByIdAdmin(
  listingId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const { data: photos } = await admin.from('gids_listing_photos').select('storage_path').eq('listing_id', listingId)
  if (photos?.length) {
    const paths = photos.map((p) => p.storage_path).filter(Boolean)
    if (paths.length) await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).remove(paths)
  }

  const { data: listingRow } = await admin
    .from('gids_listings')
    .select('menu_pdf_path')
    .eq('id', listingId)
    .maybeSingle()
  const menuPdfPath = listingRow?.menu_pdf_path as string | null | undefined
  if (menuPdfPath?.trim()) {
    await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).remove([menuPdfPath.trim()])
  }

  const { error } = await admin.from('gids_listings').delete().eq('id', listingId)
  if (error) return { ok: false, error: error.message }

  return { ok: true }
}

/** Vraag de publieke gids-site om listing-cache te verversen. */
export async function revalidatePublicGidsSite(slug?: string): Promise<void> {
  const base = process.env.VYSIONGIDS_PUBLIC_SITE_URL?.trim()
  const secret = process.env.VYSIONGIDS_STAFF_PASSWORD?.trim()
  if (!base || !secret) return

  try {
    await fetch(`${base.replace(/\/$/, '')}/api/gids/internal/revalidate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug }),
    })
  } catch {
    /* best-effort */
  }
}
