import type { ListingCuisineId } from '@/lib/listing-cuisine-types'
import type { ListingInfoExtras } from '@/lib/listing-info-extras'

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
  { id: 'bakkerij', label: 'Bakkerij' },
  { id: 'slagerij', label: 'Slagerij' },
  { id: 'koffiehuis', label: 'Koffiehuis' },
  { id: 'lunchroom', label: 'Lunchroom' },
  { id: 'foodtruck', label: 'Foodtruck' },
  { id: 'ijssalon', label: 'Ijssalon' },
  { id: 'wijnhandel', label: 'Wijnhandel' },
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
  /** Alle gekozen horeca-types (primair = `type`); leeg in DB = alleen `type`. */
  horecaTypes?: Exclude<ListingTypeId, 'all'>[]
  /** horeca (default) of diensten/leverancier */
  listingSegment?: 'horeca' | 'diensten'
  serviceCategories?: string[]
  serviceDescription?: string
  /** Actief diensten-lidmaatschap (€99/jaar) */
  dienstenActive?: boolean
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
  /** Digitaal menu (categorieën/producten) in beheer */
  hasMenuCatalog?: boolean
  photoUrl: string
  /** Alle foto-URL's (sort_order), voor beheer */
  photoUrls?: string[]
  ratingAvg: number
  ratingCount: number
  deliveryTimeMin?: number
  deliveryTimeMax?: number
  pickupTimeMin?: number
  pickupTimeMax?: number
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
  infoExtras?: ListingInfoExtras
  /** Betalend Vysiongids-lid (vacatures, zoekertjes, …) */
  premiumMember?: boolean
  /** Laatste wijziging zaak (fallback vacature-datum) */
  updatedAt?: string
  /** Gezet na claim; NULL = «Claim je zaak» zichtbaar. */
  claimedAt?: string
}

export type ListingSearchParams = {
  q?: string
  type?: string
  prov?: string
  /** WGS84 — voor «dichtbij»-sorteer/filter */
  nearLat?: number
  nearLng?: number
  /** Max. afstand bij nearby (km), default 40 */
  nearMaxKm?: number
}

export type DienstenSearchParams = {
  q?: string
  /** service category slug */
  cat?: string
  prov?: string
}
