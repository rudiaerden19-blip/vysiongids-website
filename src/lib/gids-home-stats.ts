import { unstable_cache } from 'next/cache'
import { fetchPublishedListingCountFromDb } from '@/lib/gids-listings-db'
import { getAllListings } from '@/lib/listings'
import { STATS_ACTIVE_ONDERNEMERS_FLOOR, zoekactiesPerDagDisplay } from '@/lib/gids-public-stats'

const cachedHomeStats = unstable_cache(
  async () => {
    let activeZaken = await fetchPublishedListingCountFromDb()
    if (activeZaken <= 0) {
      const all = await getAllListings()
      activeZaken = all.length
    }
    return {
      activeZaken: Math.max(activeZaken, STATS_ACTIVE_ONDERNEMERS_FLOOR),
      zoekactiesPerDag: zoekactiesPerDagDisplay(),
    }
  },
  ['gids-home-public-stats'],
  { revalidate: 120, tags: ['gids-listings'] },
)

export async function getHomePublicStats() {
  return cachedHomeStats()
}
