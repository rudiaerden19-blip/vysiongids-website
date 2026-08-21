import { createGidsSupabaseAdmin, createGidsSupabasePublic, isGidsSupabaseConfigured } from '@/lib/supabase-gids'

export type GidsReview = {
  id: string
  rating: number
  reviewerName: string | null
  body: string
  createdAt: string
}

type ReviewRow = {
  id: string
  rating: number
  reviewer_name: string | null
  body: string
  created_at: string
}

function mapReview(row: ReviewRow): GidsReview {
  return {
    id: row.id,
    rating: row.rating,
    reviewerName: row.reviewer_name,
    body: row.body,
    createdAt: row.created_at,
  }
}

export async function fetchListingIdBySlugAdmin(slug: string): Promise<string | null> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('gids_listings')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error || !data) return null
  return data.id as string
}

export async function fetchReviewsByListingSlug(slug: string, limit = 50): Promise<GidsReview[] | null> {
  if (!isGidsSupabaseConfigured()) return null
  const supabase = createGidsSupabasePublic()
  if (!supabase) return null

  const { data: listing, error: listingErr } = await supabase
    .from('gids_listings')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (listingErr || !listing) return []

  const { data, error } = await supabase
    .from('gids_reviews')
    .select('id, rating, reviewer_name, body, created_at')
    .eq('listing_id', listing.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[gids] fetch reviews:', error.message)
    return null
  }

  return (data as ReviewRow[]).map(mapReview)
}

export async function fetchReviewStatsByListingSlug(
  slug: string,
): Promise<{ avg: number; count: number } | null> {
  if (!isGidsSupabaseConfigured()) return null
  const supabase = createGidsSupabasePublic()
  if (!supabase) return null

  const { data: listing, error: listingErr } = await supabase
    .from('gids_listings')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (listingErr || !listing) return { avg: 0, count: 0 }

  const { data, error, count } = await supabase
    .from('gids_reviews')
    .select('rating', { count: 'exact' })
    .eq('listing_id', listing.id)

  if (error) {
    console.error('[gids] review stats:', error.message)
    return null
  }

  const rows = (data ?? []) as { rating: number }[]
  const total = count ?? rows.length
  if (total === 0) return { avg: 0, count: 0 }

  const sum = rows.reduce((acc, row) => acc + Number(row.rating), 0)
  const avg = Math.round((sum / total) * 10) / 10
  return { avg, count: total }
}

async function refreshListingRatingAdmin(listingId: string): Promise<void> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase) return

  const { data, error, count } = await supabase
    .from('gids_reviews')
    .select('rating', { count: 'exact' })
    .eq('listing_id', listingId)

  if (error) {
    console.error('[gids] refresh listing rating:', error.message)
    return
  }

  const rows = (data ?? []) as { rating: number }[]
  const total = count ?? rows.length
  let ratingAvg = 0
  if (total > 0) {
    const sum = rows.reduce((acc, row) => acc + Number(row.rating), 0)
    ratingAvg = Math.round((sum / total) * 10) / 10
  }

  const { error: updateErr } = await supabase
    .from('gids_listings')
    .update({ rating_avg: ratingAvg, rating_count: total })
    .eq('id', listingId)

  if (updateErr) {
    console.error('[gids] update listing rating:', updateErr.message)
  }
}

export async function insertReviewAdmin(input: {
  listingId: string
  rating: number
  reviewerName: string | null
  body: string
}): Promise<
  | { ok: true; id: string; review: GidsReview }
  | { ok: false; error: string }
> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase) return { ok: false, error: 'Database niet geconfigureerd.' }

  const { data, error } = await supabase
    .from('gids_reviews')
    .insert({
      listing_id: input.listingId,
      rating: input.rating,
      reviewer_name: input.reviewerName,
      body: input.body,
    })
    .select('id, rating, reviewer_name, body, created_at')
    .single()

  if (error || !data) {
    console.error('[gids] insert review:', error?.message)
    return { ok: false, error: 'Review opslaan mislukt.' }
  }

  await refreshListingRatingAdmin(input.listingId)

  return {
    ok: true,
    id: data.id as string,
    review: mapReview(data as ReviewRow),
  }
}

/** Verwijder reviews voor gegeven slugs (max. rating = drempel). Herberekent rating via DB-trigger. */
export async function deleteReviewsForListingSlugsAdmin(
  slugs: string[],
  options?: { maxRating?: number },
): Promise<{ deleted: number; slugs: string[] } | { ok: false; error: string }> {
  const supabase = createGidsSupabaseAdmin()
  if (!supabase) return { ok: false, error: 'Database niet geconfigureerd.' }

  const maxRating = options?.maxRating ?? 1
  const uniqueSlugs = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))]
  if (uniqueSlugs.length === 0) return { deleted: 0, slugs: [] }

  const { data: listings, error: listErr } = await supabase
    .from('gids_listings')
    .select('id, slug')
    .in('slug', uniqueSlugs)

  if (listErr) {
    console.error('[gids] purge reviews listings:', listErr.message)
    return { ok: false, error: 'Zaken ophalen mislukt.' }
  }

  const ids = (listings ?? []).map((r) => r.id as string)
  if (ids.length === 0) return { deleted: 0, slugs: [] }

  const { data: deletedRows, error: delErr } = await supabase
    .from('gids_reviews')
    .delete()
    .in('listing_id', ids)
    .lte('rating', maxRating)
    .select('id')

  if (delErr) {
    console.error('[gids] purge reviews delete:', delErr.message)
    return { ok: false, error: 'Reviews verwijderen mislukt.' }
  }

  const deleted = deletedRows?.length ?? 0
  return { deleted, slugs: (listings ?? []).map((l) => l.slug as string) }
}
