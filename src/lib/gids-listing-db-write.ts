import type { ListingAmenityId } from '@/lib/listing-types'
import type { ParsedGidsListingForm } from '@/lib/gids-listing-form-server'

export function gidsListingSaveErrorMessage(message: string | undefined): string {
  if (!message) return 'Opslaan mislukt. Probeer later opnieuw.'
  if (/duplicate|unique/i.test(message)) return 'Deze zaaknaam of slug bestaat al.'
  if (/cuisine_type/i.test(message)) {
    return 'Type keuken kan niet opgeslagen worden: voer in Supabase SQL uit: supabase/migrations/006_gids_listings_cuisine_type.sql — of laat type keuken leeg en probeer opnieuw.'
  }
  return 'Opslaan mislukt. Probeer later opnieuw.'
}

type InsertExtras = {
  slug: string
  nameNormalized: string
  pinHash: string
}

/** Geen `cuisine_type: null` — anders faalt insert als kolom nog niet bestaat. */
export function buildGidsListingInsertRow(d: ParsedGidsListingForm, extras: InsertExtras): Record<string, unknown> {
  const row: Record<string, unknown> = {
    slug: extras.slug,
    name: d.name,
    name_normalized: extras.nameNormalized,
    pin_hash: extras.pinHash,
    type: d.type,
    city: d.city,
    postcode: d.postcode,
    province: d.province,
    address: d.address,
    order_url: d.orderUrlFinal,
    website: d.websiteFinal,
    phone: d.phone,
    email: d.email,
    opening_hours: d.openingHours,
    closed_days: d.closedDays,
    hours_by_day: d.hoursByDay,
    amenities: d.ownerAmenities.length ? (d.ownerAmenities as ListingAmenityId[]) : null,
    status: 'published',
    rating_avg: 0,
    rating_count: 0,
    pickup_enabled: true,
    delivery_enabled: true,
    delivery_fee_eur: d.deliveryFeeValue,
    min_order_eur: d.minOrderValue,
    delivery_time_min: d.deliveryTimeMinValue,
    delivery_time_max: d.deliveryTimeMaxValue,
  }
  if (d.cuisineType) row.cuisine_type = d.cuisineType
  return row
}

export function applyCuisineTypeToUpdatePayload(
  payload: Record<string, unknown>,
  cuisineType: ParsedGidsListingForm['cuisineType'],
): void {
  if (cuisineType) payload.cuisine_type = cuisineType
}
