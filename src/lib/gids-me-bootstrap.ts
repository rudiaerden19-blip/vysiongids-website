import type { Listing } from '@/lib/listing-types'

export const GIDS_ME_BOOTSTRAP_KEY = 'vysiongids-me-bootstrap'

export type GidsMeClientPayload = {
  authenticated: boolean
  listingId?: string
  slug?: string
  name?: string
  listing?: Listing
}

export function writeGidsMeBootstrap(payload: GidsMeClientPayload): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(GIDS_ME_BOOTSTRAP_KEY, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function readGidsMeBootstrap(): GidsMeClientPayload | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(GIDS_ME_BOOTSTRAP_KEY)
    if (!raw) return null
    sessionStorage.removeItem(GIDS_ME_BOOTSTRAP_KEY)
    return JSON.parse(raw) as GidsMeClientPayload
  } catch {
    return null
  }
}
