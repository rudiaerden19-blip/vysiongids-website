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
  priceClass: string
  createdAt: string
  photos: GidsZoekertjePhoto[]
}

export const GIDS_ZOEKERTJE_MAX_PHOTOS = 24
export const GIDS_ZOEKERTJE_TITLE_MAX = 60
