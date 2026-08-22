import { unstable_cache } from 'next/cache'
import {
  fetchPublishedListingCountAdmin,
  fetchPublishedListingCountFromDb,
} from '@/lib/gids-listings-db'
import { publicActiveOndernemersDisplayCount, zoekactiesPerDagDisplay } from '@/lib/gids-public-stats'

const cachedHomeStats = unstable_cache(
  async () => {
    let activeZaken = (await fetchPublishedListingCountAdmin()) ?? 0
    if (activeZaken <= 0) {
      activeZaken = await fetchPublishedListingCountFromDb()
    }
    return {
      activeZaken: publicActiveOndernemersDisplayCount(activeZaken),
      zoekactiesPerDag: zoekactiesPerDagDisplay(),
    }
  },
  ['gids-home-public-stats-v2-all-published'],
  { revalidate: 60, tags: ['gids-listings'] },
)

export async function getHomePublicStats() {
  return cachedHomeStats()
}
