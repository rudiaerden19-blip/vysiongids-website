import type { ListingCuisineId } from '@/lib/listing-cuisine-types'

export const LISTING_TYPES = [
  { id: 'all', label: 'Alles' },
  { id: 'frituur', label: 'Frituur' },
  { id: 'kebab', label: 'Kebab' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'snack', label: 'Snack' },
  { id: 'traiteur', label: 'Traiteur' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'sterrenzaak', label: 'Sterrenzaak' },
  { id: 'broodjeszaak', label: 'Broodjeszaak' },
  { id: 'chinees', label: 'Chinees restaurant' },
  { id: 'sushi', label: 'Sushi restaurant' },
  { id: 'cafe', label: 'Café' },
  { id: 'bistro', label: 'Bistro' },
] as const

export type ListingTypeId = (typeof LISTING_TYPES)[number]['id']

export type ListingAmenityId =
  | 'bancontact'
  | 'wifi'
  | 'chef'
  | 'wheelchair'
  | 'terrace'
  | 'takeaway'
  | 'delivery'
  | 'halal'
  | 'gluten_free'
  | 'accessible'
  | 'vegetarian'
  | 'vegan'
  | 'dogs_welcome'
  | 'child_friendly'
  | 'parking'
  | 'gift_vouchers'
  | 'groups_welcome'

export type ListingWeekday =
  | 'maandag'
  | 'dinsdag'
  | 'woensdag'
  | 'donderdag'
  | 'vrijdag'
  | 'zaterdag'
  | 'zondag'

export type ListingDayHours = {
  day: ListingWeekday
  hours: string
}

export type Listing = {
  slug: string
  name: string
  type: Exclude<ListingTypeId, 'all'>
  /** Optioneel keukentype (Frans, Italiaans, …) */
  cuisineType?: ListingCuisineId
  city: string
  postcode: string
  /** Straat + huisnummer (verplicht voor weergave en navigatie) */
  address: string
  /** Publieke bestel-URL (Vysion shop of eigen site) */
  orderUrl: string
  /** Optionele menu-URL (eigen menukaart) */
  menuUrl?: string
  /** Publieke URL van geüploade menu-PDF */
  menuPdfUrl?: string
  photoUrl: string
  /** Alle foto-URL's (sort_order), voor beheer */
  photoUrls?: string[]
  ratingAvg: number
  ratingCount: number
  deliveryTimeMin?: number
  deliveryTimeMax?: number
  /** Max. leverafstand in km */
  deliveryRadiusKm?: number | null
  deliveryFeeEur: number | null
  minOrderEur: number | null
  pickupEnabled: boolean
  deliveryEnabled: boolean
  /** Weergave openingstijden, bv. "Di–Zo 11:30–22:00" */
  openingHours: string
  closedDays?: string
  /** Belgische provincie-slug (voor regio-filter) */
  province?: string
  /** WGS84 — optioneel; anders stad-centrum */
  lat?: number
  lng?: number
  website?: string
  phone?: string
  email?: string
  /** Per dag (Resto-stijl); anders afgeleid uit openingHours */
  hoursByDay?: ListingDayHours[]
  amenities?: ListingAmenityId[]
}

export type ListingSearchParams = {
  q?: string
  type?: string
  prov?: string
}
