import { unstable_cache } from 'next/cache'
import { fetchGidsZoekertjeByIdAdmin } from '@/lib/gids-zoekertjes-db'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'

export async function getCachedGidsZoekertjeById(id: string): Promise<GidsZoekertje | null> {
  return unstable_cache(
    async () => fetchGidsZoekertjeByIdAdmin(id),
    ['gids-zoekertje-by-id', id],
    { revalidate: 60, tags: ['gids-zoekertjes', `gids-zoekertje-${id}`] },
  )()
}
