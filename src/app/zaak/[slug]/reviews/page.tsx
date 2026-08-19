import Link from 'next/link'
import { notFound } from 'next/navigation'
import ListingStarRating from '@/components/ListingStarRating'
import ReviewList from '@/components/ReviewList'
import ReviewSubmitForm from '@/components/ReviewSubmitForm'
import SiteHeader from '@/components/SiteHeader'
import { fetchListingIdBySlugAdmin, fetchReviewsByListingSlug } from '@/lib/gids-reviews-db'
import { formatListingAddressLines, getListingBySlug, getListingTypeLabel } from '@/lib/listings'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = true
export const revalidate = 60

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
    fetchReviewsByListingSlug(slug).then((r) => r ?? []),
    fetchListingIdBySlugAdmin(slug).then(Boolean),
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
          <div className="mt-4">
            <ListingStarRating slug={slug} avg={ratingAvg} count={ratingCount} size="md" linkToReviews={false} />
          </div>
        </header>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900">Alle beoordelingen</h2>
          <div className="mt-4">
            <ReviewList reviews={reviews} />
          </div>
        </section>

        <section className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold text-gray-900">Geef je review</h2>
          {canSubmit ? (
            <div className="mt-4">
              <ReviewSubmitForm slug={slug} listingName={listing.name} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-600">
              Online reviews zijn beschikbaar zodra deze zaak in de gids-database staat. Bekijk intussen de score hierboven.
            </p>
          )}
        </section>

        <p className="mt-10 text-center text-sm">
          <Link href={`/zaak/${slug}`} className="font-semibold text-accent hover:underline">
            ← Terug naar {listing.name}
          </Link>
        </p>
      </main>
    </>
  )
}
