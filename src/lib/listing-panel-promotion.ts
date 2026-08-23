import type { Listing } from '@/lib/listing-types'
import { LISTING_TYPES } from '@/lib/listing-types'
import { listingAllHorecaTypes } from '@/lib/listing-horeca-types'
import type { ListingInfoExtras } from '@/lib/listing-info-extras'

/** Zoekkaart: actieve promotie met tekst en/of foto. */
export function listingPanelPromotionActive(
  extras: ListingInfoExtras | undefined,
): NonNullable<ListingInfoExtras['promotion']> | null {
  const p = extras?.promotion
  if (!p?.enabled) return null
  const text = p.text?.trim() ?? ''
  const imageUrl = p.imageUrl?.trim() ?? ''
  if (!text && !imageUrl) return null
  return { enabled: true, text: text || undefined, imageUrl: imageUrl || undefined }
}

function listingTypeLabelsLower(listing: Pick<Listing, 'type' | 'horecaTypes'>): string[] {
  return listingAllHorecaTypes(listing).map((id) => {
    const label = LISTING_TYPES.find((t) => t.id === id)?.label ?? id
    return label.toLowerCase()
  })
}

/** Tekst in popup wanneer er geen actieve promotie is. */
export function listingPromotionEmptyMessage(listing: Pick<Listing, 'name' | 'type' | 'horecaTypes'>): string {
  const labels = listingTypeLabelsLower(listing)
  let typePhrase = 'horecazaak'
  if (labels.length === 1) typePhrase = labels[0]!
  else if (labels.length === 2) typePhrase = `${labels[0]} of ${labels[1]}`
  else if (labels.length > 2) {
    typePhrase = `${labels.slice(0, -1).join(', ')} of ${labels[labels.length - 1]}`
  }

  return `${listing.name} — ${typePhrase} — heeft deze week geen promoties.`
}
