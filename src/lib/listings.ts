import listingsJson from '../../data/listings.json'
import type { Listing, ListingSearchParams, ListingTypeId } from '@/lib/listing-types'
import { LISTING_TYPES } from '@/lib/listing-types'

const listings = listingsJson as Listing[]

export function getAllListings(): Listing[] {
  return listings
}

export function getListingBySlug(slug: string): Listing | undefined {
  return listings.find((l) => l.slug === slug)
}

export function getListingTypeLabel(type: Listing['type']): string {
  return LISTING_TYPES.find((t) => t.id === type)?.label ?? type
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/** Zoek op stad, postcode, naam of adres (query `q`). Filter op keukentype. */
export function searchListings(params: ListingSearchParams): Listing[] {
  const q = normalize(params.q ?? '')
  const type = (params.type ?? 'all') as ListingTypeId

  return listings.filter((listing) => {
    if (type !== 'all' && listing.type !== type) return false
    if (!q) return true
    const haystack = normalize(
      [listing.name, listing.city, listing.postcode, listing.address, listing.type].join(' '),
    )
    return haystack.includes(q) || q.split(/\s+/).every((part) => part.length >= 2 && haystack.includes(part))
  })
}

export function formatDeliveryFee(listing: Listing): string {
  if (!listing.deliveryEnabled) return 'Alleen afhalen'
  if (listing.deliveryFeeEur === null || listing.deliveryFeeEur === 0) return 'Gratis levering'
  return `€${listing.deliveryFeeEur.toFixed(2).replace('.', ',')} levering`
}

export function formatMinOrder(listing: Listing): string | null {
  if (listing.minOrderEur == null) return null
  return `Min. €${listing.minOrderEur.toFixed(2).replace('.', ',')}`
}
