import type { ListingActionIntent } from '@/lib/gids-listing-action-intent'
import { readGidsNavTarget, saveGidsNavTarget } from '@/lib/gids-nav-session'

export type ResolvedListingActionIntent = ListingActionIntent

export async function fetchListingActionIntent(
  q: string,
  near?: { lat: number; lng: number },
): Promise<ResolvedListingActionIntent> {
  const params = new URLSearchParams({ q })
  if (near) {
    params.set('nearLat', near.lat.toFixed(5))
    params.set('nearLng', near.lng.toFixed(5))
  }
  const res = await fetch(`/api/gids/resolve-intent?${params.toString()}`, { cache: 'no-store' })
  if (!res.ok) return { kind: 'search' }
  return (await res.json()) as ResolvedListingActionIntent
}

export function isExternalOrderUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

type RouterPush = { push: (path: string) => void }

async function openNavigateFollowupFromSession(): Promise<boolean> {
  const target = readGidsNavTarget()
  if (!target) return false
  const res = await fetch(`/api/gids/nav-target?slug=${encodeURIComponent(target.slug)}`, {
    cache: 'no-store',
  })
  if (!res.ok) return false
  const data = (await res.json()) as { wazeUrl?: string; name?: string; slug?: string }
  if (!data.wazeUrl) return false
  if (data.slug && data.name) saveGidsNavTarget({ slug: data.slug, name: data.name }, target.query)
  window.location.assign(data.wazeUrl)
  return true
}

/** Review, bestellen of Waze; true = klaar, geen gewone zoekresultaten. */
export async function tryNavigateListingActionIntent(
  router: RouterPush,
  q: string,
  prefetched?: ResolvedListingActionIntent,
  near?: { lat: number; lng: number },
): Promise<boolean> {
  const intent = prefetched ?? (await fetchListingActionIntent(q, near))

  if (intent.kind === 'navigate_followup') {
    return openNavigateFollowupFromSession()
  }

  if (intent.kind === 'navigate') {
    saveGidsNavTarget({ slug: intent.slug, name: intent.listingName }, q)
    window.location.assign(intent.wazeUrl)
    return true
  }

  if (intent.kind === 'review') {
    router.push(intent.path)
    return true
  }
  if (intent.kind === 'order') {
    if (isExternalOrderUrl(intent.orderUrl)) {
      window.open(intent.orderUrl, '_blank', 'noopener,noreferrer')
    } else {
      router.push(intent.orderUrl)
    }
    return true
  }
  return false
}

export function listingActionSpeechMessage(intent: ListingActionIntent): string | null {
  if (intent.kind === 'navigate') {
    return `Ik start Waze naar ${intent.listingName}.`
  }
  if (intent.kind === 'navigate_followup') {
    const target = readGidsNavTarget()
    if (target) return `Ik start Waze naar ${target.name}.`
    return 'Zoek eerst een zaak, zeg daarna waze er naartoe.'
  }
  if (intent.kind === 'review') {
    return `Ik open de review voor ${intent.listingName}.`
  }
  if (intent.kind === 'order') {
    return `Ik open bestellen bij ${intent.listingName}.`
  }
  if (intent.failedAction === 'order') {
    return 'Ik vond die zaak niet om te bestellen. Zeg bestel bij, en de volledige zaaknaam.'
  }
  if (intent.failedAction === 'review') {
    return 'Ik vond die zaak niet voor een review.'
  }
  if (intent.failedAction === 'navigate') {
    return 'Ik vond geen zaak om naartoe te rijden. Sta locatie toe of zoek eerst een frituur dichtbij.'
  }
  return null
}
