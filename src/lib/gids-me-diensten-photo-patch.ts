import type { SupabaseClient } from '@supabase/supabase-js'
import { GIDS_DIENSTEN_MAX_PHOTOS } from '@/lib/gids-register-limits'
import {
  removeGidsListingPhotoSlot,
  uploadGidsListingPhoto,
} from '@/lib/gids-listing-photos-server'

type PhotoUpload = { index: number; file: File }

type PhotoSlotRow = { sort_order: number; storage_path: string }

/** Foto-slots 0–9 voor diensten/leveranciers bij PATCH /api/gids/me. */
export async function applyGidsOwnerDienstenPhotoPatch(
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

  for (let index = 0; index < GIDS_DIENSTEN_MAX_PHOTOS; index++) {
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
