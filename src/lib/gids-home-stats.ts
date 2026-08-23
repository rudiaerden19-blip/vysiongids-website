import { unstable_cache } from 'next/cache'
import { zoekactiesPerDagDisplay } from '@/lib/gids-public-stats'

const cachedHomeStats = unstable_cache(
  async () => ({
    zoekactiesPerDag: zoekactiesPerDagDisplay(),
  }),
  ['gids-home-public-stats-v6-13k-at-20h'],
  { revalidate: 60 },
)

export async function getHomePublicStats() {
  return cachedHomeStats()
}
