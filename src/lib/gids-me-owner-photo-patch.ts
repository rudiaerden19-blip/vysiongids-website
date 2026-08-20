import type { SupabaseClient } from '@supabase/supabase-js'
import {
  removeGidsListingPhotoSlot,
  uploadGidsListingPhoto,
} from '@/lib/gids-listing-photos-server'

type PhotoUpload = { index: number; file: File }

type PhotoSlotRow = { sort_order: number; storage_path: string }

/** Foto-slots 0–2 bij PATCH /api/gids/me (owner). */
export async function applyGidsOwnerListingPhotoPatch(
  admin: SupabaseClient,
  listingId: string,
  opts: {
    uploads: PhotoUpload[]
    removePhotoSlots: number[]
    origin: string
  },
): Promise<void> {
  const { data: photoRows } = await admin
    .from('gids_listing_photos')
    .select('sort_order, storage_path')
    .eq('listing_id', listingId)

  const photosBySlot = new Map<number, { storage_path: string }>()
  for (const p of (photoRows ?? []) as PhotoSlotRow[]) {
    photosBySlot.set(p.sort_order, { storage_path: p.storage_path })
  }

  for (let index = 0; index < 3; index++) {
    const upload = opts.uploads.find((p) => p.index === index)
    if (upload) {
      await uploadGidsListingPhoto(admin, listingId, index, upload.file, opts.origin)
      continue
    }
    if (opts.removePhotoSlots.includes(index)) {
      const existing = photosBySlot.get(index)
      if (existing) {
        await removeGidsListingPhotoSlot(admin, listingId, index, existing.storage_path)
      }
    }
  }
}
