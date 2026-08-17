const EARTH_RADIUS_KM = 6371

export function distanceKmBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`
  return `${Math.round(km)} km`
}

/** Hemelsbreed → ruwe wegafstand (Waze-achtige schatting zonder routing-API). */
const ROAD_DISTANCE_FACTOR = 1.35
const AVG_DRIVE_SPEED_KMH = 45

export function estimateDriveMinutesFromDistanceKm(straightLineKm: number): number {
  if (!Number.isFinite(straightLineKm) || straightLineKm <= 0) return 1
  const roadKm = straightLineKm * ROAD_DISTANCE_FACTOR
  const minutes = (roadKm / AVG_DRIVE_SPEED_KMH) * 60
  return Math.max(1, Math.round(minutes))
}

export function formatDriveMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} u ${m} min` : `${h} u`
}

/** Voor zoekkaarten: «2,3 km · ca. 6 min». */
export function formatDistanceAndDriveTime(straightLineKm: number): string {
  const mins = estimateDriveMinutesFromDistanceKm(straightLineKm)
  return `${formatDistanceKm(straightLineKm)} · ca. ${formatDriveMinutes(mins)}`
}
