export type BrowserGeolocationPoint = {
  lat: number
  lng: number
  /** GPS-nauwkeurigheid in meter (groter = onbetrouwbaarder). */
  accuracyM: number
}

/** Browserpositie voor afstand op zoekkaarten (alleen client). */
export function getBrowserGeolocation(): Promise<BrowserGeolocationPoint> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocatie niet beschikbaar'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : 999_999,
        })
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )
  })
}

/** Onder ~2,5 km onnauwkeurigheid geen km/min tonen (IP/WiFi-schatting). */
export const MAX_GEO_ACCURACY_M_FOR_DISTANCE = 2500
