export const LISTING_TYPES = [
  { id: 'all', label: 'Alles' },
  { id: 'frituur', label: 'Frituur' },
  { id: 'kebab', label: 'Kebab' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'snack', label: 'Snack' },
  { id: 'traiteur', label: 'Traiteur' },
  { id: 'restaurant', label: 'Restaurant' },
] as const

export type ListingTypeId = (typeof LISTING_TYPES)[number]['id']

export type Listing = {
  slug: string
  name: string
  type: Exclude<ListingTypeId, 'all'>
  city: string
  postcode: string
  address: string
  /** Publieke bestel-URL (Vysion shop of eigen site) */
  orderUrl: string
  photoUrl: string
  ratingAvg: number
  ratingCount: number
  deliveryTimeMin: number
  deliveryTimeMax: number
  deliveryFeeEur: number | null
  minOrderEur: number | null
  pickupEnabled: boolean
  deliveryEnabled: boolean
  closedDays?: string
}

export type ListingSearchParams = {
  q?: string
  type?: string
}
