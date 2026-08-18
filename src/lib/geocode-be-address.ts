/** Adres → WGS84 (België): Nominatim + Photon (OSM). Geen postcode-centrum voor zaak-pinnen. */

import { normalizeSearchText } from '@/lib/gids-text'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const PHOTON = 'https://photon.komoot.io/api/'
const USER_AGENT = 'Vysiongids/1.0 (+https://vysiongids.be; contact@webvysion.tech)'

export type GeocodedPoint = { lat: number; lng: number }

function buildQuery(parts: { address: string; postcode: string; city: string }): string {
  const street = parts.address.trim()
  const cityLine = `${parts.postcode.trim()} ${parts.city.trim()}`.trim()
  return [street, cityLine, 'België'].filter(Boolean).join(', ')
}

function postcodeKey(postcode: string): string {
  return postcode.trim().slice(0, 4)
}

function cityKey(city: string): string {
  return normalizeSearchText(city)
}

/** Straatniveau — voor km/Waze; faalt liever dan verkeerd gemeente-centrum. */
export async function geocodeBelgiumStreetAddress(parts: {
  address: string
  postcode: string
  city: string
}): Promise<GeocodedPoint | null> {
  if (!parts.address.trim() || !parts.city.trim()) return null

  const structured = await fetchNominatimStructured(parts)
  if (structured) return structured

  const q = buildQuery(parts)
  const freeText = await fetchNominatim(q)
  if (freeText) return freeText

  return geocodeBelgiumAddressViaPhoton(parts)
}

/** @deprecated gebruik geocodeBelgiumStreetAddress */
export async function geocodeBelgiumAddress(parts: {
  address: string
  postcode: string
  city: string
}): Promise<GeocodedPoint | null> {
  return geocodeBelgiumStreetAddress(parts)
}

/** Alleen voor navigatie-fallback (niet opslaan als zaak-locatie). */
export async function geocodeBelgiumPostcodeCity(parts: {
  postcode: string
  city: string
}): Promise<GeocodedPoint | null> {
  const cityLine = `${parts.postcode.trim()} ${parts.city.trim()}`.trim()
  if (!parts.city.trim()) return null
  return fetchNominatim(`${cityLine}, België`)
}

async function fetchNominatimStructured(parts: {
  address: string
  postcode: string
  city: string
}): Promise<GeocodedPoint | null> {
  const url = new URL(NOMINATIM)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'be')
  url.searchParams.set('street', parts.address.trim())
  url.searchParams.set('city', parts.city.trim())
  const pc = parts.postcode.trim()
  if (pc) url.searchParams.set('postalcode', pc)

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ lat?: string; lon?: string; type?: string; class?: string }>
    const hit = data[0]
    if (!hit?.lat || !hit.lon) return null
    if (hit.class === 'boundary' && hit.type === 'postal_code') return null
    return parseLatLng(hit.lat, hit.lon)
  } catch {
    return null
  }
}

async function fetchNominatim(q: string): Promise<GeocodedPoint | null> {
  const url = new URL(NOMINATIM)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'be')
  url.searchParams.set('q', q)

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ lat?: string; lon?: string; type?: string; class?: string }>
    const hit = data[0]
    if (!hit?.lat || !hit.lon) return null
    if (hit.class === 'boundary' && hit.type === 'postal_code') return null
    return parseLatLng(hit.lat, hit.lon)
  } catch {
    return null
  }
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    postcode?: string
    city?: string
    name?: string
    housenumber?: string
    street?: string
    type?: string
    osm_key?: string
    countrycode?: string
  }
}

async function geocodeBelgiumAddressViaPhoton(parts: {
  address: string
  postcode: string
  city: string
}): Promise<GeocodedPoint | null> {
  const q = buildQuery(parts)
  const url = new URL(PHOTON)
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '8')
  url.searchParams.set('lang', 'nl')

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { features?: PhotonFeature[] }
    const features = data.features ?? []
    const wantPc = postcodeKey(parts.postcode)
    const wantCity = cityKey(parts.city)
    const streetNeedle = normalizeSearchText(parts.address)

    const scored = features
      .map((f) => ({ f, score: scorePhotonHit(f, wantPc, wantCity, streetNeedle) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)

    const best = scored[0]?.f
    const coords = best?.geometry?.coordinates
    if (!coords || coords.length < 2) return null
    const [lng, lat] = coords
    return parseLatLng(String(lat), String(lng))
  } catch {
    return null
  }
}

function scorePhotonHit(
  feature: PhotonFeature,
  wantPc: string,
  wantCity: string,
  streetNeedle: string,
): number {
  const p = feature.properties
  if (!p || p.countrycode !== 'BE') return 0
  const gotPc = p.postcode ? postcodeKey(p.postcode) : ''
  if (wantPc && gotPc && gotPc !== wantPc) return 0
  const gotCity = p.city ? cityKey(p.city) : ''
  if (wantCity && gotCity && gotCity !== wantCity) return 0

  let score = 10
  if (wantPc && gotPc === wantPc) score += 40
  if (wantCity && gotCity === wantCity) score += 30
  if (p.housenumber) score += 25
  if (p.street && streetNeedle.includes(normalizeSearchText(p.street))) score += 20
  if (p.osm_key === 'amenity' || p.type === 'house') score += 15
  if (p.name && streetNeedle.includes(normalizeSearchText(p.name))) score += 10
  return score
}

function parseLatLng(latStr: string, lonStr: string): GeocodedPoint | null {
  const lat = Number(latStr)
  const lng = Number(lonStr)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}
