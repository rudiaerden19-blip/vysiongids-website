/** Browserpositie voor «dichtbij»-zoeken (alleen client). */
export function getBrowserGeolocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocatie niet beschikbaar'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 },
    )
  })
}
