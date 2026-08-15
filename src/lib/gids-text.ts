/** Normaliseer zaaknaam voor unieke lookup (login / duplicate check). */
export function normalizeGidsBusinessName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugifyListing(name: string, city: string): string {
  const raw = normalizeGidsBusinessName(`${name}-${city}`)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return raw.slice(0, 80) || 'zaak'
}

export function normalizeSearchText(s: string): string {
  return normalizeGidsBusinessName(s)
}
