import Link from 'next/link'
import { notFound } from 'next/navigation'
import ListingStarRating from '@/components/ListingStarRating'
import ReviewList from '@/components/ReviewList'
import ReviewSubmitForm from '@/components/ReviewSubmitForm'
import SiteHeader from '@/components/SiteHeader'
import ListingInfoSection from '@/components/ListingInfoSection'
import ListingPhotoSlider from '@/components/ListingPhotoSlider'
import ListingTopZaakStamp from '@/components/ListingTopZaakStamp'
import ListingMap from '@/components/ListingMapClient'
import ListingNavigationButtons from '@/components/ListingNavigationButtons'
import ZaakOwnerDeleteSection from '@/components/ZaakOwnerDeleteSection'
import { getListingCuisineDisplay } from '@/lib/listing-cuisine-types'
import { isTopZaakListing } from '@/lib/listing-topzaak'
import {
  formatDeliveryFee,
  formatDeliveryRadius,
  formatListingAddressLines,
  formatMinOrder,
  getListingBySlug,
  getListingTypeLabel,
  listingPhotoUrls,
} from '@/lib/listings'
import { listingMenuUrl } from '@/lib/listing-menu-url'
import { fetchListingIdBySlugAdmin, fetchReviewStatsByListingSlug, fetchReviewsByListingSlug } from '@/lib/gids-reviews-db'

type Props = { params: Promise<{ slug: string }> }

/** Nieuwe zaken na registratie: altijd server-side ophalen (geen 404 op onbekende slug). */
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export const revalidate = 60

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const listing = await getListingBySlug(slug)
  if (!listing) return { title: 'Zaak niet gevonden' }
  return {
    title: `${listing.name} · ${listing.city}`,
    description: `Bestel online bij ${listing.name} in ${listing.city}. ${getListingTypeLabel(listing.type)}.`,
  }
}

export default async function ZaakPage({ params }: Props) {
  const { slug } = await params
  const listing = await getListingBySlug(slug)
  if (!listing) notFound()

  const cuisineLine = getListingCuisineDisplay(listing.cuisineType)
  const minOrder = formatMinOrder(listing)
  const deliveryRadiusLabel = formatDeliveryRadius(listing)
  const { street, cityLine } = formatListingAddressLines(listing)
  const reviews = (await fetchReviewsByListingSlug(slug, 5)) ?? []
  const reviewStats = await fetchReviewStatsByListingSlug(slug)
  const ratingCount = reviewStats?.count ?? listing.ratingCount
  const ratingAvg = reviewStats && reviewStats.count > 0 ? reviewStats.avg : listing.ratingAvg
  const listingForRating = { ...listing, ratingAvg, ratingCount }
  const canSubmitReview = Boolean(await fetchListingIdBySlugAdmin(slug))
  const reviewsHref = `/zaak/${slug}/reviews`
  const menuUrl = listingMenuUrl(listing)

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap vysiongids-zaak-page">
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <span className="mx-2">|</span>
          <Link href="/zoeken" className="hover:text-accent">
            Zoeken
          </Link>
          <span className="mx-2">|</span>
          <span className="text-gray-800">{listing.city}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(18rem,22vw)] xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <h1 className="vysiongids-zaak-title text-3xl font-bold text-accent sm:text-4xl">
              {listing.name}
              {cuisineLine ? (
                <span className="vysiongids-zaak-title-cuisine-inline"> · {cuisineLine}</span>
              ) : null}
            </h1>
            <p className="mt-2 text-gray-600">
              {street}
              <br />
              {cityLine}
            </p>

            {isTopZaakListing(listingForRating) ? (
              <div className="vysiongids-zaak-topzaak-stamp-row">
                <ListingTopZaakStamp listing={listingForRating} variant="underOpen" />
              </div>
            ) : null}

            <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100">
              <ListingPhotoSlider
                urls={listingPhotoUrls(listing)}
                alt={listing.name}
                priority
                showControls
                sizes="(max-width: 1024px) 100vw, min(960px, 75vw)"
                className="object-cover"
              />
            </div>

            <ListingInfoSection listing={listing} />

            <ListingMap listing={listingForRating} />

            <section id="beoordeling" className="mt-8 border-t border-gray-200 pt-8 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900">Beoordeling</h2>
              <div className="mt-3">
                <ListingStarRating slug={slug} avg={ratingAvg} count={ratingCount} size="md" />
              </div>
              {reviews.length > 0 ? (
                <div className="mt-4">
                  <ReviewList reviews={reviews.slice(0, 3)} />
                </div>
              ) : null}
              <p className="mt-4">
                <Link href={reviewsHref} className="font-semibold text-accent hover:underline">
                  Alle reviews bekijken →
                </Link>
              </p>
              {canSubmitReview ? (
                <div className="mt-8">
                  <h3 className="text-base font-bold text-gray-900">Schrijf een review</h3>
                  <div className="mt-3">
                    <ReviewSubmitForm slug={slug} listingName={listing.name} />
                  </div>
                </div>
              ) : null}
            </section>

            <section className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-bold text-gray-900">Bestellen</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {listing.deliveryTimeMin != null && listing.deliveryTimeMax != null ? (
                  <div>
                    <dt className="font-semibold text-gray-500">Levertijd</dt>
                    <dd>
                      {listing.deliveryTimeMin}–{listing.deliveryTimeMax} min
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-semibold text-gray-500">Bezorging</dt>
                  <dd>{formatDeliveryFee(listing)}</dd>
                </div>
                {minOrder ? (
                  <div>
                    <dt className="font-semibold text-gray-500">Minimum</dt>
                    <dd>{minOrder}</dd>
                  </div>
                ) : null}
                {deliveryRadiusLabel ? (
                  <div>
                    <dt className="font-semibold text-gray-500">Leveringsstraal</dt>
                    <dd>{deliveryRadiusLabel.replace('Levering binnen ', '')}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <ZaakOwnerDeleteSection slug={slug} />
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <p className="text-sm text-gray-600">Bestel rechtstreeks bij deze zaak — geen commissie via Vysiongids.</p>
              <div className="vysiongids-zaak-sidebar-cta mt-4">
                <a href="#info" className="vysiongids-zaak-action-btn">
                  Info
                </a>
                <a
                  href={listing.orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vysiongids-zaak-action-btn"
                >
                  Bestel
                </a>
                <Link href={`${reviewsHref}#schrijven`} className="vysiongids-zaak-action-btn">
                  Geef review
                </Link>
                {menuUrl ? (
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vysiongids-zaak-action-btn"
                  >
                    Menu
                  </a>
                ) : null}
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Route</p>
                <ListingNavigationButtons listing={listing} compact />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
