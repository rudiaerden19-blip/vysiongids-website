import type { Listing } from '@/lib/listing-types'
import { geocodeBelgiumAddress } from '@/lib/geocode-be-address'
import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'

/** Zet lat/lng op basis van straat+postcode+gemeente (Nominatim). */
export async function geocodeListingAddress(parts: {
  address: string
  postcode: string
  city: string
}) {
  return geocodeBelgiumAddress(parts)
}

/** Bestaande zaken zonder coördinaten: eenmalig geocoden en opslaan. */
export async function ensureListingGeocoded(listing: Listing): Promise<Listing> {
  if (typeof listing.lat === 'number' && typeof listing.lng === 'number') {
    return listing
  }

  const coords = await geocodeBelgiumAddress({
    address: listing.address,
    postcode: listing.postcode,
    city: listing.city,
  })
  if (!coords) return listing

  const admin = createGidsSupabaseAdmin()
  if (admin) {
    await admin
      .from('gids_listings')
      .update({ lat: coords.lat, lng: coords.lng, updated_at: new Date().toISOString() })
      .eq('slug', listing.slug)
  }

  return { ...listing, lat: coords.lat, lng: coords.lng }
}
