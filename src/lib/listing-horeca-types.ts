import type { Listing } from '@/lib/listing-types'
import { LISTING_TYPES, type ListingTypeId } from '@/lib/listing-types'

export type HorecaListingTypeId = Exclude<ListingTypeId, 'all'>

const VALID_HORECA_TYPE_IDS = new Set(
  LISTING_TYPES.filter((t) => t.id !== 'all').map((t) => t.id as HorecaListingTypeId),
)

export function isHorecaListingTypeId(value: string): value is HorecaListingTypeId {
  return VALID_HORECA_TYPE_IDS.has(value as HorecaListingTypeId)
}

/** Unieke, geldige types; minstens één; `type` kolom = eerste. */
export function normalizeHorecaTypes(raw: string[]): HorecaListingTypeId[] {
  const out: HorecaListingTypeId[] = []
  for (const item of raw) {
    const id = item.trim()
    if (!isHorecaListingTypeId(id)) continue
    if (!out.includes(id)) out.push(id)
  }
  return out
}

export function listingAllHorecaTypes(
  listing: Pick<Listing, 'type' | 'horecaTypes'>,
): HorecaListingTypeId[] {
  const fromArray = normalizeHorecaTypes(listing.horecaTypes ?? [])
  if (fromArray.length > 0) return fromArray
  if (isHorecaListingTypeId(listing.type)) return [listing.type]
  return []
}

export function listingHasHorecaType(
  listing: Pick<Listing, 'type' | 'horecaTypes'>,
  typeId: HorecaListingTypeId | string,
): boolean {
  const id = String(typeId).trim()
  if (!isHorecaListingTypeId(id)) return false
  return listingAllHorecaTypes(listing).includes(id)
}

export function horecaTypesFromDbRow(
  primaryType: string,
  horecaTypes: string[] | null | undefined,
): HorecaListingTypeId[] {
  const normalized = normalizeHorecaTypes(horecaTypes ?? [])
  if (normalized.length > 0) return normalized
  if (isHorecaListingTypeId(primaryType)) return [primaryType]
  return []
}

export function horecaTypesForDbWrite(types: HorecaListingTypeId[]): {
  type: HorecaListingTypeId
  horeca_types: HorecaListingTypeId[]
} {
  const list = normalizeHorecaTypes(types)
  if (list.length === 0) {
    throw new Error('Minstens één horeca-type vereist.')
  }
  return { type: list[0], horeca_types: list }
}

export function parseHorecaTypesFromForm(form: FormData): HorecaListingTypeId[] {
  const fromCheckboxes = form
    .getAll('horecaTypes')
    .map((v) => String(v).trim())
    .filter(Boolean)
  if (fromCheckboxes.length > 0) return normalizeHorecaTypes(fromCheckboxes)
  const legacy = String(form.get('type') ?? '').trim()
  return legacy ? normalizeHorecaTypes([legacy]) : []
}

export function listingHorecaTypeLabels(listing: Pick<Listing, 'type' | 'horecaTypes'>): string[] {
  return listingAllHorecaTypes(listing).map(
    (id) => LISTING_TYPES.find((t) => t.id === id)?.label ?? id,
  )
}
