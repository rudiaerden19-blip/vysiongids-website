const OSRM = 'https://router.project-osrm.org'

export type LatLng = { lat: number; lng: number }

export type DrivingLeg = { km: number; minutes: number }

/** Wegafstand via OSRM (publieke demo-server, België). */
export async function drivingLegsFromOrigin(
  from: LatLng,
  destinations: LatLng[],
): Promise<(DrivingLeg | null)[]> {
  if (destinations.length === 0) return []
  const coords = [from, ...destinations]
    .map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`)
    .join(';')
  const url = `${OSRM}/table/v1/driving/${coords}?sources=0&annotations=distance,duration`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return destinations.map(() => null)
    const data = (await res.json()) as {
      code?: string
      distances?: (number | null)[][]
      durations?: (number | null)[][]
    }
    if (data.code !== 'Ok' || !data.distances?.[0] || !data.durations?.[0]) {
      return destinations.map(() => null)
    }
    const distRow = data.distances[0]
    const durRow = data.durations[0]
    return destinations.map((_, i) => {
      const idx = i + 1
      const meters = distRow[idx]
      const seconds = durRow[idx]
      if (meters == null || seconds == null || !Number.isFinite(meters) || !Number.isFinite(seconds)) {
        return null
      }
      return {
        km: meters / 1000,
        minutes: Math.max(1, Math.round(seconds / 60)),
      }
    })
  } catch {
    return destinations.map(() => null)
  }
}
