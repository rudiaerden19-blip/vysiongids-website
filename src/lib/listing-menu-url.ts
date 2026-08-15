import type { Listing } from '@/lib/listing-types'

/** Online menukaart op OrderVysion: {tenant}.ordervysion.com/shop/{tenant}/menukaart */
export function listingMenuUrl(listing: Listing): string | null {
  const raw = listing.orderUrl?.trim()
  if (!raw) return null

  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    const host = url.hostname.toLowerCase()
    const sub = host.match(/^([a-z0-9-]+)\.ordervysion\.com$/i)
    if (!sub?.[1]) return null
    const tenant = sub[1]
    return `${url.origin}/shop/${tenant}/menukaart`
  } catch {
    return null
  }
}
