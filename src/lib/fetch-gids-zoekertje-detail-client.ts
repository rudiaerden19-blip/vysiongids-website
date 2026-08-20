import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'

/** Volledig zoekertje (alle foto's) voor detail-popup — lijst gebruikt enkel thumbnails. */
export async function fetchGidsZoekertjeDetailClient(id: string): Promise<GidsZoekertje | null> {
  try {
    const r = await fetch(`/api/gids/zoekertjes/${encodeURIComponent(id)}`, { credentials: 'same-origin' })
    const data = (await r.json()) as { zoekertje?: GidsZoekertje }
    if (!r.ok || !data.zoekertje) return null
    return data.zoekertje
  } catch {
    return null
  }
}
