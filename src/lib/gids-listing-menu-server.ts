import type { SupabaseClient } from '@supabase/supabase-js'
import { GIDS_LISTING_PHOTOS_BUCKET } from '@/lib/gids-listing-photos-server'

export const GIDS_MENU_PDF_MAX_BYTES = 12 * 1024 * 1024

export function gidsListingMenuPdfStoragePath(listingId: string): string {
  return `${listingId}/menu.pdf`
}

export async function uploadGidsListingMenuPdf(
  admin: SupabaseClient,
  listingId: string,
  file: File,
  origin: string,
): Promise<{ path: string; publicUrl: string }> {
  if (file.size > GIDS_MENU_PDF_MAX_BYTES) {
    throw new Error('Menu-PDF max. 12 MB.')
  }
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    throw new Error('Alleen PDF-bestanden toegestaan voor het menu.')
  }

  const path = gidsListingMenuPdfStoragePath(listingId)
  const buf = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).upload(path, buf, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (upErr) throw new Error(upErr.message)

  const { data: pub } = admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).getPublicUrl(path)
  const publicUrl = pub.publicUrl.startsWith('http') ? pub.publicUrl : `${origin}${pub.publicUrl}`

  return { path, publicUrl }
}

export async function removeGidsListingMenuPdfStorage(
  admin: SupabaseClient,
  storagePath: string | null | undefined,
): Promise<void> {
  if (!storagePath?.trim()) return
  await admin.storage.from(GIDS_LISTING_PHOTOS_BUCKET).remove([storagePath.trim()])
}
