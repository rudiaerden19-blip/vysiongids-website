import { unstable_cache } from 'next/cache'
import { fetchPublishedHorecaListingCountFromDb, fetchPublishedListingCountFromDb } from '@/lib/gids-listings-db'
import { getAllListings } from '@/lib/listings'
import { isHorecaListing } from '@/lib/listing-segment'
import { publicHorecaZakenDisplayCount, zoekactiesPerDagDisplay } from '@/lib/gids-public-stats'

const cachedHomeStats = unstable_cache(
  async () => {
    let activeZaken = await fetchPublishedHorecaListingCountFromDb()
    if (activeZaken <= 0) {
      activeZaken = await fetchPublishedListingCountFromDb()
    }
    if (activeZaken <= 0) {
      const all = await getAllListings()
      activeZaken = all.filter(isHorecaListing).length
    }
    return {
      activeZaken: publicHorecaZakenDisplayCount(activeZaken),
      zoekactiesPerDag: zoekactiesPerDagDisplay(),
    }
  },
  ['gids-home-public-stats'],
  { revalidate: 120, tags: ['gids-listings'] },
)

export async function getHomePublicStats() {
  return cachedHomeStats()
}
