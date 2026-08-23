import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import ListingInfoSection from '@/components/ListingInfoSection'
import ListingPhotoSlider from '@/components/ListingPhotoSlider'
import ListingMap from '@/components/ListingMapClient'
import ZaakOwnerDeleteSection from '@/components/ZaakOwnerDeleteSection'
import ZaakPageBreadcrumb from '@/components/ZaakPageBreadcrumb'
import ZaakPageSidebar from '@/components/ZaakPageSidebar'
import ZaakPageTitle from '@/components/ZaakPageTitle'
import ZaakOrderDetailsSection from '@/components/ZaakOrderDetailsSection'
import ZaakReviewsSection from '@/components/ZaakReviewsSection'
import { tServer } from '@/i18n/server-translate'
import {
  formatListingAddressLines,
  getListingBySlug,
  getListingTypeLabel,
  listingPhotoUrls,
} from '@/lib/listings'
import { getCachedListingIdBySlug, getCachedReviewsByListingSlug } from '@/lib/gids-reviews-cache'
import { resolveListingMapPin } from '@/lib/gids-listing-geocode'
import { isDienstenListing } from '@/lib/listing-segment'

type Props = { params: Promise<{ slug: string }> }

/** Nieuwe slugs via dynamicParams; listing-cache invalideert via tag gids-listings. */
export const dynamicParams = true

/** Listing-cache 60s; geocode alleen bij ontbrekende/fallback-coördinaten. */
export const revalidate = 60

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const listing = await getListingBySlug(slug)
  if (!listing) {
    return { title: await tServer('meta.pages.listingNotFound') }
  }
  return {
    title: await tServer('meta.pages.listingTitle', { name: listing.name, city: listing.city }),
    description: await tServer('meta.pages.listingDescription', {
      name: listing.name,
      city: listing.city,
      typeLabel: getListingTypeLabel(listing.type),
    }),
  }
}

export default async function ZaakPage({ params }: Props) {
  const { slug } = await params
  let listing = await getListingBySlug(slug)
  if (!listing) notFound()
  if (isDienstenListing(listing)) redirect(`/diensten/${slug}`)
  const { listing: geocodedListing, pin: mapPin } = await resolveListingMapPin(listing)
  listing = geocodedListing

  const { street, cityLine } = formatListingAddressLines(listing)
  const [reviews, canSubmitReview] = await Promise.all([
    getCachedReviewsByListingSlug(slug, 5).then((r) => r ?? []),
    getCachedListingIdBySlug(slug).then(Boolean),
  ])
  const listingForRating = listing
  const reviewsHref = `/zaak/${slug}/reviews`

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap vysiongids-zaak-page">
        <ZaakPageBreadcrumb city={listing.city} />

        <div className="vysiongids-zaak-layout">
          <div className="vysiongids-zaak-hero">
            <ZaakPageTitle listing={listing} />
            <p className="mt-2 text-gray-600">
              {street}
              <br />
              {cityLine}
            </p>

            <div className="vysiongids-zaak-gallery relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl bg-gray-800 sm:aspect-[16/10]">
              <ListingPhotoSlider
                urls={listingPhotoUrls(listing)}
                alt={listing.name}
                priority
                showControls
                autoPlay
                sizes="(max-width: 1024px) 100vw, min(960px, 75vw)"
              />
            </div>
          </div>

          <ZaakPageSidebar listing={listing} slug={slug} reviewsHref={reviewsHref} mapPin={mapPin} />

          <div className="vysiongids-zaak-body">
            <ListingInfoSection listing={listingForRating} />

            <ListingMap listing={listingForRating} mapPin={mapPin} />

            <ZaakReviewsSection
              slug={slug}
              listing={listingForRating}
              reviews={reviews}
              canSubmitReview={canSubmitReview}
            />

            <ZaakOrderDetailsSection listing={listingForRating} />

            <ZaakOwnerDeleteSection slug={slug} />
          </div>
        </div>
      </main>
    </>
  )
}
