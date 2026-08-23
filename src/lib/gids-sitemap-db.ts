import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'

export type GidsSitemapListingRow = {
  slug: string
  listing_segment: string | null
  updated_at: string | null
}

const PAGE_SIZE = 500

/** Alle gepubliceerde zaken voor sitemap.xml (admin-read). */
export async function fetchPublishedListingsForSitemapAdmin(): Promise<GidsSitemapListingRow[]> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase) return []

  const rows: GidsSitemapListingRow[] = []
  let from = 0

  for (;;) {
    const { data, error } = await supabase
      .from('gids_listings')
      .select('slug, listing_segment, updated_at')
      .eq('status', 'published')
      .order('slug')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('[gids sitemap] listings:', error.message)
      break
    }
    const batch = data ?? []
    for (const row of batch) {
      const slug = String(row.slug ?? '').trim()
      if (!slug) continue
      rows.push({
        slug,
        listing_segment: (row.listing_segment as string | null) ?? null,
        updated_at: (row.updated_at as string | null) ?? null,
      })
    }
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows
}
