import { unstable_cache } from 'next/cache'
import {
  fetchListingIdBySlugAdmin,
  fetchReviewsByListingSlug,
  type GidsReview,
} from '@/lib/gids-reviews-db'

export async function getCachedReviewsByListingSlug(slug: string, limit = 50): Promise<GidsReview[] | null> {
  return unstable_cache(
    async () => fetchReviewsByListingSlug(slug, limit),
    ['gids-reviews-by-slug', slug, String(limit)],
    { revalidate: 60, tags: ['gids-reviews', `gids-reviews-${slug}`, 'gids-listings', `gids-listing-${slug}`] },
  )()
}

export async function getCachedListingIdBySlug(slug: string): Promise<string | null> {
  return unstable_cache(
    async () => fetchListingIdBySlugAdmin(slug),
    ['gids-listing-id-by-slug', slug],
    { revalidate: 300, tags: ['gids-listings', `gids-listing-${slug}`] },
  )()
}
