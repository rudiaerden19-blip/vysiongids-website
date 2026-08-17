import type { Listing } from '@/lib/listing-types'

const STORAGE_KEY = 'vysiongids_nav_target_v1'
const MAX_AGE_MS = 30 * 60 * 1000

export type GidsNavTarget = {
  slug: string
  name: string
  savedAt: number
  query?: string
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
}

export function saveGidsNavTarget(listing: Pick<Listing, 'slug' | 'name'>, query?: string): void {
  if (!canUseStorage()) return
  const payload: GidsNavTarget = {
    slug: listing.slug,
    name: listing.name,
    savedAt: Date.now(),
    ...(query?.trim() ? { query: query.trim() } : {}),
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function readGidsNavTarget(): GidsNavTarget | null {
  if (!canUseStorage()) return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GidsNavTarget
    if (!parsed?.slug || !parsed?.name || !parsed?.savedAt) return null
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearGidsNavTarget(): void {
  if (!canUseStorage()) return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
