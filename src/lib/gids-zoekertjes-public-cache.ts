import { unstable_cache } from 'next/cache'
import { fetchGidsZoekertjesByListingIdAdmin, fetchPublishedGidsZoekertjesAdmin } from '@/lib/gids-zoekertjes-db'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'

function browsePhotosOnly(zoekertjes: GidsZoekertje[]): GidsZoekertje[] {
  return zoekertjes.map((z) => ({
    ...z,
    photos: z.photos.length ? [z.photos[0]] : [],
  }))
}

/** Gepubliceerde zoekertjes — gecached (60s), browse-lijst met enkel thumbnail per advertentie. */
export async function getCachedPublishedGidsZoekertjesBrowse() {
  return unstable_cache(
    async () => {
      const result = await fetchPublishedGidsZoekertjesAdmin()
      if (result === null) return null
      return {
        zoekertjes: browsePhotosOnly(result.zoekertjes),
        setupRequired: result.setupRequired === true,
      }
    },
    ['gids-published-zoekertjes-browse'],
    { revalidate: 60, tags: ['gids-zoekertjes'] },
  )()
}

/** Gepubliceerde zoekertjes van één zaak (info-sectie op /zaak/[slug]). */
export async function getCachedPublishedGidsZoekertjesByListingId(
  listingId: string,
): Promise<GidsZoekertje[] | null> {
  return unstable_cache(
    async () => fetchGidsZoekertjesByListingIdAdmin(listingId),
    ['gids-published-zoekertjes-by-listing', listingId],
    {
      revalidate: 60,
      tags: ['gids-zoekertjes', `gids-zoekertjes-listing-${listingId}`],
    },
  )()
}
