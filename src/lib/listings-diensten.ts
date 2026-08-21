import type { DienstenSearchParams, Listing } from '@/lib/listing-types'
import { fetchListingBySlugFromDb, fetchPublishedListingsFromDb } from '@/lib/gids-listings-db'
import { normalizeSearchText } from '@/lib/gids-text'
import { compareListingsByName } from '@/lib/listing-alphabetical-sort'
import { unstable_cache } from 'next/cache'

const cachedDienstenListings = unstable_cache(
  async () =>
    fetchPublishedListingsFromDb({
      listingSegment: 'diensten',
      dienstenActiveOnly: true,
    }),
  ['gids-diensten-listings'],
  { revalidate: 60, tags: ['gids-listings'] },
)

function listingHaystack(listing: Listing): string {
  const parts = [
    listing.name,
    listing.city,
    listing.postcode,
    listing.address,
    listing.serviceDescription ?? '',
    ...(listing.serviceCategories ?? []),
  ]
  return normalizeSearchText(parts.join(' '))
}

export async function loadDienstenListings(): Promise<Listing[]> {
  const fromDb = await cachedDienstenListings()
  return fromDb ?? []
}

export async function getDienstenListingBySlug(slug: string): Promise<Listing | undefined> {
  const one = await fetchListingBySlugFromDb(slug)
  if (!one || one.listingSegment !== 'diensten' || !one.dienstenActive) return undefined
  return one
}

export type DienstenSearchOutcome = {
  listings: Listing[]
  total: number
}

export async function searchDienstenListings(params: DienstenSearchParams): Promise<DienstenSearchOutcome> {
  const listings = await loadDienstenListings()
  const qNorm = normalizeSearchText(params.q ?? '')
  const cat = params.cat?.trim() ?? ''
  const prov = normalizeSearchText(params.prov ?? '')

  let results = listings.filter((listing) => {
    if (prov) {
      const listingProv = normalizeSearchText(listing.province ?? '')
      if (!listingProv || listingProv !== prov) return false
    }
    if (cat) {
      if (!listing.serviceCategories?.includes(cat)) return false
    }
    if (!qNorm) return true
    const hay = listingHaystack(listing)
    const tokens = qNorm.split(' ').filter(Boolean)
    return tokens.every((t) => hay.includes(t))
  })

  results.sort(compareListingsByName)
  return { listings: results, total: results.length }
}
