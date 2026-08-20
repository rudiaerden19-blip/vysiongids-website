export type GidsZoekertjePhoto = {
  sortOrder: number
  publicUrl: string
}

export type GidsZoekertje = {
  id: string
  listingId: string
  listingName: string
  listingCity: string
  title: string
  description: string
  category: string
  condition: string | null
  kind: string | null
  itemType: string | null
  brand: string | null
  /** Weergaveprijs (opgeslagen in kolom price_class). */
  price: string
  createdAt: string
  photos: GidsZoekertjePhoto[]
}

export const GIDS_ZOEKERTJE_MAX_PHOTOS = 24
export const GIDS_ZOEKERTJE_TITLE_MAX = 60
/** Max. actieve zoekertjes per premium-zaak (meerdere toegestaan). */
export const GIDS_ZOEKERTJE_MAX_PER_LISTING = 50
