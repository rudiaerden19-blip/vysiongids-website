import type { ParsedGidsDienstenForm } from '@/lib/gids-diensten-form-server'
import { DIENSTEN_LISTING_TYPE, LISTING_SEGMENT_DIENSTEN } from '@/lib/listing-segment'

type InsertExtras = {
  slug: string
  nameNormalized: string
  pinHash: string
  lat?: number | null
  lng?: number | null
  /** hidden tot betaling, published na webhook of zonder Stripe */
  status: 'published' | 'hidden'
  dienstenComplimentary?: boolean
}

export function buildGidsDienstenInsertRow(
  d: ParsedGidsDienstenForm,
  extras: InsertExtras,
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    slug: extras.slug,
    name: d.name,
    name_normalized: extras.nameNormalized,
    pin_hash: extras.pinHash,
    type: DIENSTEN_LISTING_TYPE,
    listing_segment: LISTING_SEGMENT_DIENSTEN,
    service_categories: d.serviceCategories,
    service_description: d.serviceDescription,
    city: d.city,
    postcode: d.postcode,
    province: d.province,
    address: d.address,
    order_url: '',
    website: d.websiteFinal,
    phone: d.phone,
    email: d.email,
    opening_hours: 'Op afspraak',
    closed_days: null,
    hours_by_day: null,
    amenities: [],
    status: extras.status,
    rating_avg: 0,
    rating_count: 0,
    pickup_enabled: false,
    delivery_enabled: false,
  }
  if (extras.dienstenComplimentary) {
    row.diensten_complimentary = true
  }
  if (typeof extras.lat === 'number' && typeof extras.lng === 'number') {
    row.lat = extras.lat
    row.lng = extras.lng
  }
  return row
}
