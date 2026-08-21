import Link from 'next/link'
import { notFound } from 'next/navigation'
import ZaakReviewsLive from '@/components/ZaakReviewsLive'
import SiteHeader from '@/components/SiteHeader'
import { getCachedListingIdBySlug, getCachedReviewsByListingSlug } from '@/lib/gids-reviews-cache'
import { formatListingAddressLines, getListingBySlug, getListingTypeLabel } from '@/lib/listings'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = true
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const listing = await getListingBySlug(slug)
  if (!listing) return { title: 'Reviews' }
  return {
    title: `Reviews · ${listing.name}`,
    description: `Lees en schrijf beoordelingen voor ${listing.name}.`,
  }
}

export default async function ZaakReviewsPage({ params }: Props) {
  const { slug } = await params
  const listing = await getListingBySlug(slug)
  if (!listing) notFound()

  const [reviews, canSubmit] = await Promise.all([
    getCachedReviewsByListingSlug(slug).then((r) => r ?? []),
    getCachedListingIdBySlug(slug).then(Boolean),
  ])
  const ratingCount = listing.ratingCount
  const ratingAvg = listing.ratingAvg
  const { cityLine } = formatListingAddressLines(listing)
  const typeLabel = getListingTypeLabel(listing.type)

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <span className="mx-2">|</span>
          <Link href={`/zaak/${slug}`} className="hover:text-accent">
            {listing.name}
          </Link>
          <span className="mx-2">|</span>
          <span className="text-gray-800">Reviews</span>
        </nav>

        <header className="mt-6 border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reviews — {listing.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {typeLabel} · {cityLine}
          </p>
        </header>

        <ZaakReviewsLive
          slug={slug}
          listingName={listing.name}
          initialReviews={reviews}
          initialAvg={ratingAvg}
          initialCount={ratingCount}
          canSubmit={canSubmit}
        />

        <p className="mt-10 text-center text-sm">
          <Link href={`/zaak/${slug}`} className="font-semibold text-accent hover:underline">
            ← Terug naar {listing.name}
          </Link>
        </p>
      </main>
    </>
  )
}
