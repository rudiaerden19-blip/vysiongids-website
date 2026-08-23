import type { Listing, ListingAmenityId, ListingWeekday } from '@/lib/listing-types'
import { LISTING_CUISINE_TYPES } from '@/lib/listing-cuisine-types'
import { formatDeliveryRadiusKm } from '@/lib/listing-delivery-radius'
import { formatDistanceKm, estimateDriveMinutesFromDistanceKm } from '@/lib/listing-distance'
import {
  formatDeliveryFee,
  formatMinOrder,
  listingHasDeliveryInfo,
} from '@/lib/listing-display'
import { AMENITY_LABELS, getListingOpenStatus, type ListingOpenStatusLabelFns } from '@/lib/listing-info'

export type ListingTranslateFn = (key: string, vars?: Record<string, string | number>) => string

const WEEKDAY_I18N_KEY: Record<ListingWeekday, string> = {
  maandag: 'common.days.mon',
  dinsdag: 'common.days.tue',
  woensdag: 'common.days.wed',
  donderdag: 'common.days.thu',
  vrijdag: 'common.days.fri',
  zaterdag: 'common.days.sat',
  zondag: 'common.days.sun',
}

export function localizedListingWeekday(t: ListingTranslateFn, day: ListingWeekday): string {
  return t(WEEKDAY_I18N_KEY[day])
}

export function listingOpenStatusLabelFns(t: ListingTranslateFn): ListingOpenStatusLabelFns {
  return {
    closedLeave: () => t('listing.panel.closedLeave'),
    openNow: () => t('listing.panel.openNow'),
    closedNow: () => t('listing.panel.closedNow'),
    opensAt: (dayLabel, timeLabel) => t('listing.panel.opensAt', { day: dayLabel, time: timeLabel }),
    dayToday: () => t('listing.panel.today'),
    dayTomorrow: () => t('listing.panel.tomorrow'),
    weekday: (day) => localizedListingWeekday(t, day),
  }
}

export function getLocalizedListingOpenStatus(listing: Listing, t: ListingTranslateFn, now = new Date()) {
  return getListingOpenStatus(listing, now, listingOpenStatusLabelFns(t))
}

/** DB slaat «gesloten» op in het Nederlands — toon vertaald op kaarten. */
export function localizedListingHoursTime(t: ListingTranslateFn, hours: string): string {
  const trimmed = hours?.trim()
  if (!trimmed) return hours
  if (trimmed.toLowerCase() === 'gesloten') return t('listing.panel.closedHours')
  return hours
}

export function localizedListingAmenityLabel(t: ListingTranslateFn, id: ListingAmenityId): string {
  const key = `beheer.amenities.${id}`
  const hit = t(key)
  return hit !== key ? hit : AMENITY_LABELS[id]
}

const VALID_CUISINE = new Set<string>(LISTING_CUISINE_TYPES.map((c) => c.id))

export function localizedListingCuisineDisplay(
  t: ListingTranslateFn,
  id: string | null | undefined,
): string | null {
  if (!id?.trim()) return null
  const item = LISTING_CUISINE_TYPES.find((c) => c.id === id)
  if (!item) return null
  const key = `listing.cuisineTypes.${id}`
  const label = VALID_CUISINE.has(id) ? t(key) : item.label
  const resolved = label !== key ? label : item.label
  return `${item.emoji} ${resolved}`
}

export function localizedListingServiceMode(t: ListingTranslateFn, listing: Listing): string {
  const pickup = listing.pickupEnabled !== false
  const delivery = listingHasDeliveryInfo(listing)
  if (pickup && delivery) return t('listing.panel.servicePickupAndDelivery')
  if (delivery) return t('listing.panel.serviceDelivery')
  return t('listing.panel.servicePickup')
}

export function localizedListingPickupTime(t: ListingTranslateFn, listing: Listing): string | null {
  if (listing.pickupTimeMin == null || listing.pickupTimeMax == null) return null
  return t('listing.panel.pickupMinutes', {
    min: listing.pickupTimeMin,
    max: listing.pickupTimeMax,
  })
}

export function localizedListingDeliveryTime(t: ListingTranslateFn, listing: Listing): string | null {
  if (listing.deliveryTimeMin == null || listing.deliveryTimeMax == null) return null
  return t('listing.panel.deliveryMinutes', {
    min: listing.deliveryTimeMin,
    max: listing.deliveryTimeMax,
  })
}

export function localizedDeliveryFeeLabel(t: ListingTranslateFn, listing: Listing): string | null {
  const raw = formatDeliveryFee(listing)
  if (!raw) return null
  if (raw === 'Alleen afhalen') return t('listing.panel.pickupOnly')
  if (raw === 'Gratis levering') return t('listing.panel.freeDelivery')
  if (listing.deliveryFeeEur != null && listing.deliveryFeeEur > 0) {
    const amount = listing.deliveryFeeEur.toFixed(2).replace('.', ',')
    return t('listing.panel.deliveryFeeAmount', { amount })
  }
  return raw
}

export function localizedMinOrder(t: ListingTranslateFn, listing: Listing): string | null {
  const raw = formatMinOrder(listing)
  if (!raw || listing.minOrderEur == null) return null
  const amount = listing.minOrderEur.toFixed(2).replace('.', ',')
  return t('listing.panel.minOrderAmount', { amount })
}

export function localizedDeliveryRadiusLabel(t: ListingTranslateFn, listing: Listing): string | null {
  const km = formatDeliveryRadiusKm(listing.deliveryRadiusKm)
  if (!km) return null
  return t('listing.panel.deliveryWithin', { km })
}

function localizedDriveMinutes(t: ListingTranslateFn, minutes: number): string {
  if (minutes < 60) return t('listing.panel.driveMinutesOnly', { minutes })
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m > 0) {
    return t('listing.panel.driveHoursMinutes', { hours: h, minutes: m })
  }
  return t('listing.panel.driveHoursOnly', { hours: h })
}

export function localizedDistanceAndDriveTime(
  t: ListingTranslateFn,
  straightLineKm: number,
  driveMinutes?: number,
): string {
  const mins = driveMinutes ?? estimateDriveMinutesFromDistanceKm(straightLineKm)
  const approx = t('listing.panel.travelApprox')
  const drive = localizedDriveMinutes(t, mins)
  return t('listing.panel.travelSummary', {
    distance: formatDistanceKm(straightLineKm),
    approx,
    drive,
  })
}
