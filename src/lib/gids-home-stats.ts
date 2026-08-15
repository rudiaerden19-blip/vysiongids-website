import { unstable_cache } from 'next/cache'
import { fetchPublishedListingCountFromDb } from '@/lib/gids-listings-db'
import { actieveZakenDisplay, zoekactiesPerDagDisplay } from '@/lib/gids-public-stats'

const cachedPublishedCount = unstable_cache(
  async () => fetchPublishedListingCountFromDb(),
  ['gids-published-count'],
  { revalidate: 60, tags: ['gids-listings'] },
)

/** Demo-seed in 002 telt niet boven basis 430; elke extra zaak +1. */
const DEMO_SEED_LISTING_COUNT = 6

export async function getHomePublicStats() {
  const dbCount = await cachedPublishedCount()
  const extra = Math.max(0, dbCount - DEMO_SEED_LISTING_COUNT)
  return {
    activeZaken: actieveZakenDisplay(extra),
    zoekactiesPerDag: zoekactiesPerDagDisplay(),
  }
}
