import type { MetadataRoute } from 'next'
import { fetchPublishedListingsForSitemapAdmin } from '@/lib/gids-sitemap-db'
import { GIDS_STATIC_SITEMAP_ENTRIES, gidsSitemapAbsoluteUrl } from '@/lib/gids-sitemap-paths'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticEntries: MetadataRoute.Sitemap = GIDS_STATIC_SITEMAP_ENTRIES.map((entry) => ({
    url: gidsSitemapAbsoluteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))

  const listings = await fetchPublishedListingsForSitemapAdmin()
  const listingEntries: MetadataRoute.Sitemap = []

  for (const row of listings) {
    const isDiensten = row.listing_segment === 'diensten'
    const basePath = isDiensten ? `/diensten/${row.slug}` : `/zaak/${row.slug}`
    const lastModified = row.updated_at ? new Date(row.updated_at) : now

    listingEntries.push({
      url: gidsSitemapAbsoluteUrl(basePath),
      lastModified,
      changeFrequency: 'weekly',
      priority: isDiensten ? 0.7 : 0.8,
    })

    if (!isDiensten) {
      listingEntries.push({
        url: gidsSitemapAbsoluteUrl(`/zaak/${row.slug}/reviews`),
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.55,
      })
    }
  }

  return [...staticEntries, ...listingEntries]
}
