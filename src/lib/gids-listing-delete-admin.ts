import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { fetchListingRowByIdAdmin } from '@/lib/gids-listings-db'
import { GIDS_LISTING_PHOTOS_BUCKET } from '@/lib/gids-listing-photos-server'
import { removeGidsListingMenuPdfStorage } from '@/lib/gids-listing-menu-server'

/** Verwijder één gids-listing inclusief foto’s en menu-PDF (service role). */
export async function deleteGidsListingByIdAdmin(listingId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.' }

  const { data: photos } = await admin.from('gids_listing_photos').select('storage_path').eq('listing_id', listingId)
  if (photos?.length) {
    const paths = photos.map((p) => p.storage_path).filter(Boolean)
    if (paths.length) await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).remove(paths)
  }

  const rowBeforeDelete = await fetchListingRowByIdAdmin(listingId)
  if (rowBeforeDelete?.menu_pdf_path) {
    await removeGidsListingMenuPdfStorage(admin, rowBeforeDelete.menu_pdf_path)
  }

  const { error } = await admin.from('gids_listings').delete().eq('id', listingId)
  if (error) return { ok: false, error: error.message }

  return { ok: true }
}
