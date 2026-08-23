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
