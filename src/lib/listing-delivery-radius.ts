/** Keuzes in registratie / beheer (km). */
export const DELIVERY_RADIUS_KM_OPTIONS = [3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50] as const

export type DeliveryRadiusKm = (typeof DELIVERY_RADIUS_KM_OPTIONS)[number]

export function formatDeliveryRadiusKm(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km) || km <= 0) return null
  const rounded = Number(km)
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '')
  return `${display} km`
}

export function parseDeliveryRadiusKmFromForm(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t.replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0 || n > 100) return null
  return Math.round(n * 10) / 10
}

export function isAllowedDeliveryRadiusKm(n: number): boolean {
  return Number.isFinite(n) && n > 0 && n <= 100
}
