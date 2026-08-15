import type { Listing } from '@/lib/listing-types'

export type ListingMenuTarget =
  | { kind: 'external'; href: string }
  | { kind: 'pdf'; href: string }

function inferOrdervysionMenuUrl(orderUrl: string | undefined): string | null {
  const raw = orderUrl?.trim()
  if (!raw) return null
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    const host = url.hostname.toLowerCase()
    const sub = host.match(/^([a-z0-9-]+)\.ordervysion\.com$/i)
    if (!sub?.[1]) return null
    return `${url.origin}/shop/${sub[1]}/menukaart`
  } catch {
    return null
  }
}

/** Waar de Menu-knop naartoe gaat (PDF-pagina op gids, externe link, of lege menu-pagina). */
export function resolveListingMenuTarget(listing: Listing): ListingMenuTarget {
  if (listing.menuPdfUrl?.trim()) {
    return { kind: 'pdf', href: `/zaak/${listing.slug}/menu` }
  }
  const custom = listing.menuUrl?.trim()
  if (custom) {
    return { kind: 'external', href: custom }
  }
  const auto = inferOrdervysionMenuUrl(listing.orderUrl)
  if (auto) {
    return { kind: 'external', href: auto }
  }
  return { kind: 'pdf', href: `/zaak/${listing.slug}/menu` }
}
