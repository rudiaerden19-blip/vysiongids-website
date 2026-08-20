import { fetchPublishedListingCountFromDb } from '@/lib/gids-listings-db'
import { getAllListings } from '@/lib/listings'
import { STATS_ACTIVE_ONDERNEMERS_FLOOR, zoekactiesPerDagDisplay } from '@/lib/gids-public-stats'

export async function getHomePublicStats() {
  let activeZaken = await fetchPublishedListingCountFromDb()
  if (activeZaken <= 0) {
    const all = await getAllListings()
    activeZaken = all.length
  }
  return {
    activeZaken: Math.max(activeZaken, STATS_ACTIVE_ONDERNEMERS_FLOOR),
    zoekactiesPerDag: zoekactiesPerDagDisplay(),
  }
}
