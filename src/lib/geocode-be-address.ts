/** Adres → WGS84 (België): Geopunt (basisregisters) + Nominatim + Photon. */

import { normalizeSearchText } from '@/lib/gids-text'

const GEOPUNT = 'https://geo.api.vlaanderen.be/geolocation/v4/Location'
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const PHOTON = 'https://photon.komoot.io/api/'
const USER_AGENT = 'Vysiongids/1.0 (+https://vysiongids.be; contact@webvysion.tech)'

export type GeocodedPoint = { lat: number; lng: number }

function buildQuery(parts: { address: string; postcode: string; city: string }): string {
  const street = parts.address.trim()
  const cityLine = `${parts.postcode.trim()} ${parts.city.trim()}`.trim()
  return [street, cityLine, 'België'].filter(Boolean).join(', ')
}

function normalizeHouseNumber(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

/** Huisnummer uit Belgisch adres (bv. «Zonnedauwlaan 1» → «1»). */
export function extractBelgiumHouseNumber(address: string): string | null {
  const t = address.trim()
  const tail = t.match(/\s(\d+[a-zA-Z]?)\s*$/)
  if (tail?.[1]) return normalizeHouseNumber(tail[1])
  const head = t.match(/^(\d+[a-zA-Z]?)\s+/)
  if (head?.[1]) return normalizeHouseNumber(head[1])
  return null
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
  /** @deprecated niet gebruiken — zaaknaam geeft verkeerde OSM-treffers */
  name?: string
}): Promise<GeocodedPoint | null> {
  if (!parts.address.trim() || !parts.city.trim()) return null

  const geopunt = await fetchGeopuntBelgium(parts)
  if (geopunt) return geopunt

  const structured = await fetchNominatimStructured(parts)
  if (structured) return structured

  const photon = await geocodeBelgiumAddressViaPhoton(parts)
  if (photon) return photon

  const q = buildQuery(parts)
  return fetchNominatim(q)
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

type GeopuntHit = {
  Zipcode?: string
  Housenumber?: string
  Thoroughfarename?: string
  Location?: { Lat_WGS84?: number; Lon_WGS84?: number }
}

/** Officiële Vlaanderen-locatie (basisregisters huisnummer). */
async function fetchGeopuntBelgium(parts: {
  address: string
  postcode: string
  city: string
}): Promise<GeocodedPoint | null> {
  const q = buildQuery(parts)
  const url = new URL(GEOPUNT)
  url.searchParams.set('q', q)

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = (await res.json()) as { LocationResult?: GeopuntHit[] }
    const hit = data.LocationResult?.[0]
    if (!hit) return null
    const loc = hit.Location
    if (loc?.Lat_WGS84 == null || loc.Lon_WGS84 == null) return null

    const wantPc = postcodeKey(parts.postcode)
    const gotPc = hit.Zipcode ? postcodeKey(hit.Zipcode) : ''
    if (wantPc && gotPc && gotPc !== wantPc) return null

    const wantHouse = extractBelgiumHouseNumber(parts.address)
    const gotHouse = hit.Housenumber ? normalizeHouseNumber(hit.Housenumber) : ''
    if (wantHouse && gotHouse && gotHouse !== wantHouse) return null

    const lat = loc.Lat_WGS84
    const lng = loc.Lon_WGS84
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}

function municipalityCityVariants(city: string, postcode: string): string[] {
  const primary = city.trim()
  if (!primary) return []
  const pc = postcode.trim().slice(0, 4)
  const key = cityKey(primary)
  const extra: string[] = []
  if (pc === '3900') {
    if (key === 'pelt' || key === 'neerpelt') extra.push('Overpelt')
    if (key === 'overpelt') extra.push('Pelt')
  }
  if (pc === '3910' && key === 'pelt') extra.push('Neerpelt')
  if (pc === '3930' && key === 'pelt') extra.push('Overpelt')
  return [...new Set([primary, ...extra])]
}

async function fetchNominatimStructured(parts: {
  address: string
  postcode: string
  city: string
}): Promise<GeocodedPoint | null> {
  const cities = municipalityCityVariants(parts.city, parts.postcode)
  for (const cityTry of cities) {
    const hit = await fetchNominatimStructuredOnce(parts.address, parts.postcode, cityTry)
    if (hit) return hit
  }
  return null
}

async function fetchNominatimStructuredOnce(
  streetAddress: string,
  postcode: string,
  city: string,
): Promise<GeocodedPoint | null> {
  const url = new URL(NOMINATIM)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'be')
  url.searchParams.set('street', streetAddress.trim())
  url.searchParams.set('city', city.trim())
  const pc = postcode.trim()
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
  url.searchParams.set('limit', '12')

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { features?: PhotonFeature[] }
    const features = data.features ?? []
    const wantPc = postcodeKey(parts.postcode)
    const wantCity = cityKey(parts.city)
    const streetNeedle = normalizeSearchText(parts.address)
    const wantHouse = extractBelgiumHouseNumber(parts.address)

    const scored = features
      .map((f) => ({ f, score: scorePhotonHit(f, wantPc, wantCity, streetNeedle, wantHouse) }))
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

function municipalityKeysCompatible(want: string, got: string): boolean {
  if (!want || !got) return true
  if (want === got) return true
  if (got.includes(want) || want.includes(got)) return true
  return false
}

function scorePhotonHit(
  feature: PhotonFeature,
  wantPc: string,
  wantCity: string,
  streetNeedle: string,
  wantHouse: string | null,
): number {
  const p = feature.properties
  if (!p || p.countrycode !== 'BE') return 0
  const gotPc = p.postcode ? postcodeKey(p.postcode) : ''
  if (wantPc && gotPc && gotPc !== wantPc) return 0
  const gotCity = p.city ? cityKey(p.city) : ''
  if (wantCity && gotCity && !municipalityKeysCompatible(wantCity, gotCity)) return 0

  const gotHouse = p.housenumber ? normalizeHouseNumber(p.housenumber) : ''
  if (wantHouse) {
    if (!gotHouse) return 0
    if (gotHouse !== wantHouse) return 0
  }

  let score = 10
  if (wantPc && gotPc === wantPc) score += 40
  if (wantCity && gotCity && municipalityKeysCompatible(wantCity, gotCity)) score += 30
  if (p.housenumber) score += 25
  if (p.street && streetNeedle.includes(normalizeSearchText(p.street))) score += 20
  if (p.osm_key === 'building' || p.type === 'house') score += 15
  if (p.osm_key === 'amenity') score -= 5
  return score
}

function parseLatLng(latStr: string, lonStr: string): GeocodedPoint | null {
  const lat = Number(latStr)
  const lng = Number(lonStr)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}
