import type { Listing } from '@/lib/listing-types'
import { belgiumPhoneTelHref, formatBelgiumPhoneDisplay } from '@/lib/belgium-phone'

export function resolveJobListingEmail(listing: Listing): string | null {
  const hiringEmail = listing.infoExtras?.hiring?.email?.trim()
  if (hiringEmail) return hiringEmail
  const general = listing.email?.trim()
  return general || null
}

export function resolveJobListingPhone(listing: Listing): string | null {
  const hiringPhone = listing.infoExtras?.hiring?.phone?.trim()
  const raw = hiringPhone || listing.phone?.trim()
  return raw ? formatBelgiumPhoneDisplay(raw) : null
}

export function resolveJobListingPhoneRaw(listing: Listing): string | null {
  const hiringPhone = listing.infoExtras?.hiring?.phone?.trim()
  if (hiringPhone) return hiringPhone
  return listing.phone?.trim() || null
}

export function jobListingMailtoHref(listing: Listing, email: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Sollicitatie — ${listing.name}`)}`
}

export function jobListingTelHref(phone: string): string {
  return belgiumPhoneTelHref(phone) ?? `tel:${phone.replace(/[^\d+]/g, '')}`
}
