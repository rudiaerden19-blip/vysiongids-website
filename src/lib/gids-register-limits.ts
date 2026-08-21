/** Vercel serverless request body ~4,5 MB — houd ruimte voor overige formuliervelden. */
export const GIDS_REGISTER_MAX_PHOTO_BYTES = 1_400_000

export const GIDS_REGISTER_MAX_TOTAL_PHOTO_BYTES = 4_000_000

export const GIDS_DIENSTEN_MAX_PHOTOS = 10

export const GIDS_DIENSTEN_MAX_TOTAL_PHOTO_BYTES = 14_000_000

export function formatPhotoSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}
