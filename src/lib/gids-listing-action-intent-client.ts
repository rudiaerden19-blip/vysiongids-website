import type { ListingActionIntent } from '@/lib/gids-listing-action-intent'

export type ResolvedListingActionIntent = ListingActionIntent

export async function fetchListingActionIntent(q: string): Promise<ResolvedListingActionIntent> {
  const params = new URLSearchParams({ q })
  const res = await fetch(`/api/gids/resolve-intent?${params.toString()}`, { cache: 'no-store' })
  if (!res.ok) return { kind: 'search' }
  return (await res.json()) as ResolvedListingActionIntent
}

export function isExternalOrderUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

type RouterPush = { push: (path: string) => void }

/** Review-pagina of bestel-app openen; true = klaar, geen gewone zoekresultaten. */
export async function tryNavigateListingActionIntent(
  router: RouterPush,
  q: string,
  prefetched?: ResolvedListingActionIntent,
): Promise<boolean> {
  const intent = prefetched ?? (await fetchListingActionIntent(q))
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
  return null
}
