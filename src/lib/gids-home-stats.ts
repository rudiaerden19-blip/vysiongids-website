import { unstable_cache } from 'next/cache'
import { fetchPublishedHorecaListingCountFromDb, fetchPublishedListingCountFromDb } from '@/lib/gids-listings-db'
import { jsonHorecaListingCount } from '@/lib/listings'
import { publicHorecaZakenDisplayCount, zoekactiesPerDagDisplay } from '@/lib/gids-public-stats'

const cachedHomeStats = unstable_cache(
  async () => {
    let activeZaken = await fetchPublishedHorecaListingCountFromDb()
    if (activeZaken <= 0) {
      activeZaken = await fetchPublishedListingCountFromDb()
    }
    if (activeZaken <= 0) {
      activeZaken = jsonHorecaListingCount()
    }
    return {
      activeZaken: publicHorecaZakenDisplayCount(activeZaken),
      zoekactiesPerDag: zoekactiesPerDagDisplay(),
    }
  },
  ['gids-home-public-stats'],
  { revalidate: 60, tags: ['gids-listings'] },
)

export async function getHomePublicStats() {
  return cachedHomeStats()
}
