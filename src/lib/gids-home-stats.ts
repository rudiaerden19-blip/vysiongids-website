import { fetchPublishedListingCountFromDb } from '@/lib/gids-listings-db'
import { getAllListings } from '@/lib/listings'
import { zoekactiesPerDagDisplay } from '@/lib/gids-public-stats'

export async function getHomePublicStats() {
  let activeZaken = await fetchPublishedListingCountFromDb()
  if (activeZaken <= 0) {
    const all = await getAllListings()
    activeZaken = all.length
  }
  return {
    activeZaken,
    zoekactiesPerDag: zoekactiesPerDagDisplay(),
  }
}
