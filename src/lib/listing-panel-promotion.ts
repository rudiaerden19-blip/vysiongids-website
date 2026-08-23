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
  const offers = (p.offers ?? []).filter((r) => r.label.trim() || r.priceEur != null)
  if (!text && !imageUrl && offers.length === 0) return null
  return {
    enabled: true,
    text: text || undefined,
    ...(imageUrl ? { imageUrl } : {}),
    ...(offers.length ? { offers } : {}),
  }
}

function listingTypeLabelsLower(listing: Pick<Listing, 'type' | 'horecaTypes'>): string[] {
  return listingAllHorecaTypes(listing).map((id) => {
    const label = LISTING_TYPES.find((t) => t.id === id)?.label ?? id
    return label.toLowerCase()
  })
}

function formatHorecaTypePhrase(labels: string[]): string {
  if (labels.length === 0) return 'horecazaak'
  if (labels.length === 1) return labels[0]!
  if (labels.length === 2) return `${labels[0]} of ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} of ${labels[labels.length - 1]}`
}

/** Voorkom «Frituur X — frituur — …» als de naam het type al vermeldt. */
function listingNameAlreadyImpliesHorecaType(
  name: string,
  typeIds: ReturnType<typeof listingAllHorecaTypes>,
): boolean {
  const n = name.toLowerCase()
  for (const id of typeIds) {
    const label = (LISTING_TYPES.find((t) => t.id === id)?.label ?? id).toLowerCase()
    const hints = new Set<string>([label, id.replace(/_/g, ' ')])
    if (id === 'pizza') hints.add('pizzeria')
    if (id === 'chinees') hints.add('chinees')
    if (id === 'cafe') hints.add('café')
    for (const hint of hints) {
      if (hint.length < 3) continue
      const escaped = hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (new RegExp(`\\b${escaped}\\b`, 'iu').test(n)) return true
      if (hint.length >= 5 && n.includes(hint)) return true
    }
  }
  return false
}

/** Tekst in popup wanneer er geen actieve promotie is. */
export function listingPromotionEmptyMessage(listing: Pick<Listing, 'name' | 'type' | 'horecaTypes'>): string {
  const typeIds = listingAllHorecaTypes(listing)
  const labels = listingTypeLabelsLower(listing)

  if (typeIds.length === 0 || listingNameAlreadyImpliesHorecaType(listing.name, typeIds)) {
    return `${listing.name} heeft deze week geen promoties.`
  }

  const typePhrase = formatHorecaTypePhrase(labels)
  return `${listing.name} — ${typePhrase} — heeft deze week geen promoties.`
}
