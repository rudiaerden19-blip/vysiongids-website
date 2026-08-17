import { parseListingSearchQuery } from '@/lib/gids-listing-search'

export type GidsSearchUrlParams = {
  q?: string
  type?: string
  prov?: string
  nearLat?: string
  nearLng?: string
}

export function parseNearPointFromSearchParams(sp: GidsSearchUrlParams): { lat: number; lng: number } | null {
  const lat = Number(sp.nearLat)
  const lng = Number(sp.nearLng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

export function searchQueryWantsNearby(q: string | undefined): boolean {
  return parseListingSearchQuery(q ?? '').nearby
}

/** Locatie voor afstand op kaarten: «dichtbij» of «nu open». */
export function searchQueryWantsGeolocation(q: string | undefined): boolean {
  const parsed = parseListingSearchQuery(q ?? '')
  return parsed.nearby || parsed.openNow
}

export function appendGidsSearchParams(
  params: URLSearchParams,
  input: { q?: string; type?: string; prov?: string; near?: { lat: number; lng: number } | null },
): void {
  const q = input.q?.trim()
  if (q) params.set('q', q)
  const type = input.type?.trim()
  if (type && type !== 'all') params.set('type', type)
  const prov = input.prov?.trim()
  if (prov) params.set('prov', prov)
  if (input.near) {
    params.set('nearLat', input.near.lat.toFixed(5))
    params.set('nearLng', input.near.lng.toFixed(5))
  }
}

export function buildGidsSearchPath(input: {
  q?: string
  type?: string
  prov?: string
  near?: { lat: number; lng: number } | null
}): string {
  const params = new URLSearchParams()
  appendGidsSearchParams(params, input)
  const qs = params.toString()
  return qs ? `/zoeken?${qs}` : '/zoeken'
}
