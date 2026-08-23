import type { Listing } from '@/lib/listing-types'
import { listingPhotoUrls } from '@/lib/listings'

export function buildZaakListingJsonLd(listing: Listing, origin: string): Record<string, unknown> {
  const url = `${origin.replace(/\/$/, '')}/zaak/${encodeURIComponent(listing.slug)}`
  const images = listingPhotoUrls(listing).slice(0, 3)
  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: listing.name,
    url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      postalCode: listing.postcode,
      addressCountry: 'BE',
    },
  }
  if (listing.phone?.trim()) payload.telephone = listing.phone.trim()
  if (listing.website?.trim()) payload.sameAs = [listing.website.trim()]
  if (typeof listing.lat === 'number' && typeof listing.lng === 'number') {
    payload.geo = {
      '@type': 'GeoCoordinates',
      latitude: listing.lat,
      longitude: listing.lng,
    }
  }
  if (images.length === 1) payload.image = images[0]
  else if (images.length > 1) payload.image = images
  return payload
}

export function buildDienstenListingJsonLd(
  listing: Pick<Listing, 'name' | 'slug' | 'address' | 'city' | 'postcode' | 'phone' | 'website'>,
  origin: string,
): Record<string, unknown> {
  const url = `${origin.replace(/\/$/, '')}/diensten/${encodeURIComponent(listing.slug)}`
  const payload: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: listing.name,
    url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      postalCode: listing.postcode,
      addressCountry: 'BE',
    },
  }
  if (listing.phone?.trim()) payload.telephone = listing.phone.trim()
  if (listing.website?.trim()) payload.sameAs = [listing.website.trim()]
  return payload
}
