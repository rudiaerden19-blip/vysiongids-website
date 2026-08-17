import type { ListingAmenityId } from '@/lib/listing-types'

/** Opties die de ondernemer op zaak toevoegen / beheer kan aanvinken (volgorde = formulier). */
export const OWNER_PROFILE_AMENITIES = [
  { id: 'vegetarian', emoji: '🥗', label: 'Vegetarisch' },
  { id: 'vegan', emoji: '🌱', label: 'Vegan' },
  { id: 'halal', emoji: '☪️', label: 'Halal' },
  { id: 'gluten_free', emoji: '🌾', label: 'Glutenvrij' },
  { id: 'dogs_welcome', emoji: '🐕', label: 'Honden welkom' },
  { id: 'accessible', emoji: '♿', label: 'Toegankelijk' },
  { id: 'child_friendly', emoji: '👶', label: 'Kindvriendelijk' },
  { id: 'parking', emoji: '🅿️', label: 'Parking' },
  { id: 'terrace', emoji: '🌳', label: 'Terras' },
  { id: 'takeaway', emoji: '🍴', label: 'Take-away' },
  { id: 'delivery', emoji: '🚚', label: 'Levering' },
  { id: 'bancontact', emoji: '💳', label: 'Bancontact' },
  { id: 'gift_vouchers', emoji: '🎁', label: 'Cadeaubonnen' },
  { id: 'wifi', emoji: '📶', label: 'Wi-Fi' },
  { id: 'groups_welcome', emoji: '🪑', label: 'Groepen welkom' },
] as const satisfies ReadonlyArray<{ id: ListingAmenityId; emoji: string; label: string }>

const OWNER_IDS = new Set<ListingAmenityId>(OWNER_PROFILE_AMENITIES.map((a) => a.id))

export function parseOwnerAmenitiesFromForm(form: FormData): ListingAmenityId[] {
  const selected: ListingAmenityId[] = []
  for (const { id } of OWNER_PROFILE_AMENITIES) {
    if (form.get(`amenity_${id}`) === 'on') selected.push(id)
  }
  return selected
}

export function mergeListingAmenitiesWithOwnerChoices(
  existing: ListingAmenityId[] | null | undefined,
  ownerSelected: ListingAmenityId[],
): ListingAmenityId[] {
  const kept = (existing ?? []).filter((id) => !OWNER_IDS.has(id) && id !== 'wheelchair')
  return [...kept, ...ownerSelected]
}

export function ownerAmenitiesFromListing(amenities: ListingAmenityId[] | undefined): Set<ListingAmenityId> {
  const set = new Set<ListingAmenityId>()
  for (const id of amenities ?? []) {
    if (OWNER_IDS.has(id)) set.add(id)
    if (id === 'wheelchair') set.add('accessible')
  }
  return set
}
