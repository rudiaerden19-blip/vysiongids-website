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

export async function insertReviewAdmin(input: {
  listingId: string
  rating: number
  reviewerName: string | null
  body: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
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
    .select('id')
    .single()

  if (error || !data) {
    console.error('[gids] insert review:', error?.message)
    return { ok: false, error: 'Review opslaan mislukt.' }
  }

  return { ok: true, id: data.id as string }
}
