import type { Listing } from '@/lib/listing-types'

export function resolveJobListingEmail(listing: Listing): string | null {
  const hiringEmail = listing.infoExtras?.hiring?.email?.trim()
  if (hiringEmail) return hiringEmail
  const general = listing.email?.trim()
  return general || null
}

export function resolveJobListingPhone(listing: Listing): string | null {
  const hiringPhone = listing.infoExtras?.hiring?.phone?.trim()
  if (hiringPhone) return hiringPhone
  const general = listing.phone?.trim()
  return general || null
}

export function jobListingMailtoHref(listing: Listing, email: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Sollicitatie — ${listing.name}`)}`
}

export function jobListingTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}
