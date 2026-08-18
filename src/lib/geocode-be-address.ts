/** OpenStreetMap Nominatim — adres → WGS84 voor kaart/Waze (België). */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'Vysiongids/1.0 (+https://vysiongids.be; contact@webvysion.tech)'

export type GeocodedPoint = { lat: number; lng: number }

function buildQuery(parts: { address: string; postcode: string; city: string }): string {
  const street = parts.address.trim()
  const cityLine = `${parts.postcode.trim()} ${parts.city.trim()}`.trim()
  return [street, cityLine, 'België'].filter(Boolean).join(', ')
}

export async function geocodeBelgiumAddress(parts: {
  address: string
  postcode: string
  city: string
}): Promise<GeocodedPoint | null> {
  const q = buildQuery(parts)
  if (!parts.address.trim() || !parts.city.trim()) return null

  return fetchNominatim(q)
}

/** Gemeente/postcode als volledig adres niet resolveert (alle tenants, geen handmatige lijst). */
export async function geocodeBelgiumPostcodeCity(parts: {
  postcode: string
  city: string
}): Promise<GeocodedPoint | null> {
  const cityLine = `${parts.postcode.trim()} ${parts.city.trim()}`.trim()
  if (!parts.city.trim()) return null
  return fetchNominatim(`${cityLine}, België`)
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
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>
    const hit = data[0]
    if (!hit?.lat || !hit.lon) return null
    const lat = Number(hit.lat)
    const lng = Number(hit.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}
