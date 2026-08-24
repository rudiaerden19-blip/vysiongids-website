import { createGidsSupabaseAdmin } from '@/lib/supabase-gids'
import { fetchListingRowByIdAdmin } from '@/lib/gids-listings-db'
import { fetchGidsZoekertjeByIdAdmin } from '@/lib/gids-zoekertjes-db'
import { LISTING_SEGMENT_DIENSTEN } from '@/lib/listing-segment'
import { resolveDienstenListingActive } from '@/lib/gids-diensten-membership'
import type { GidsChatContextType } from '@/lib/gids-chat-types'

export type ResolvedChatContext = {
  contextType: GidsChatContextType
  contextId: string
  sellerListingId: string
  contextTitle: string
}

export async function resolveGidsChatContextAdmin(opts: {
  contextType: GidsChatContextType
  contextId?: string
  contextSlug?: string
}): Promise<{ ok: true; ctx: ResolvedChatContext } | { ok: false; error: string; status: number }> {
  if (opts.contextType === 'zoekertje') {
    const id = opts.contextId?.trim()
    if (!id) return { ok: false, error: 'Zoekertje ontbreekt.', status: 400 }
    const z = await fetchGidsZoekertjeByIdAdmin(id)
    if (!z) return { ok: false, error: 'Zoekertje niet gevonden.', status: 404 }
    return {
      ok: true,
      ctx: {
        contextType: 'zoekertje',
        contextId: z.id,
        sellerListingId: z.listingId,
        contextTitle: z.title.trim() || 'Zoekertje',
      },
    }
  }

  const admin = createGidsSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Database niet geconfigureerd.', status: 503 }

  let listingId = opts.contextId?.trim()
  if (!listingId && opts.contextSlug?.trim()) {
    const { data } = await admin
      .from('gids_listings')
      .select('id')
      .eq('slug', opts.contextSlug.trim())
      .maybeSingle()
    listingId = (data?.id as string | undefined) ?? undefined
  }
  if (!listingId) return { ok: false, error: 'Leverancier niet gevonden.', status: 404 }

  const row = await fetchListingRowByIdAdmin(listingId)
  if (!row) return { ok: false, error: 'Profiel niet gevonden.', status: 404 }
  if (row.listing_segment !== LISTING_SEGMENT_DIENSTEN) {
    return { ok: false, error: 'Chat op dit profiel is alleen voor leveranciers.', status: 400 }
  }
  if (
    !resolveDienstenListingActive({
      listing_segment: row.listing_segment,
      diensten_expires_at: row.diensten_expires_at,
      diensten_complimentary: row.diensten_complimentary,
      status: row.status ?? 'published',
    })
  ) {
    return { ok: false, error: 'Dit leveranciersprofiel is niet actief.', status: 403 }
  }

  return {
    ok: true,
    ctx: {
      contextType: 'diensten_listing',
      contextId: row.id,
      sellerListingId: row.id,
      contextTitle: row.name.trim() || 'Leverancier',
    },
  }
}
