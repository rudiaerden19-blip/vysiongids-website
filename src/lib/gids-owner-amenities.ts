import type { ListingAmenityId } from '@/lib/listing-types'

/** Opties die de ondernemer op zaak toevoegen / beheer kan aanvinken. */
export const OWNER_PROFILE_AMENITIES = [
  { id: 'halal', label: 'Wij verkopen halal producten' },
  { id: 'gluten_free', label: 'Wij verkopen glutenvrije producten' },
  { id: 'accessible', label: 'Aangepast aan gehandicapten' },
  { id: 'vegetarian', label: 'Vegetarische producten' },
] as const satisfies ReadonlyArray<{ id: ListingAmenityId; label: string }>

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
): ListingAmenityId[] | null {
  const kept = (existing ?? []).filter((id) => !OWNER_IDS.has(id))
  const merged = [...kept, ...ownerSelected]
  return merged.length ? merged : null
}

export function ownerAmenitiesFromListing(amenities: ListingAmenityId[] | undefined): Set<ListingAmenityId> {
  const set = new Set<ListingAmenityId>()
  for (const id of amenities ?? []) {
    if (OWNER_IDS.has(id)) set.add(id)
  }
  return set
}
