'use client'

import Link from 'next/link'
import { useLanguage } from '@/i18n/LanguageProvider'
import ListingStarRating from '@/components/ListingStarRating'
import ReviewList from '@/components/ReviewList'
import ReviewSubmitForm from '@/components/ReviewSubmitForm'
import type { GidsReview } from '@/lib/gids-reviews-db'
import type { Listing } from '@/lib/listing-types'

type Props = {
  slug: string
  listing: Listing
  reviews: GidsReview[]
  canSubmitReview: boolean
}

export default function ZaakReviewsSection({ slug, listing, reviews, canSubmitReview }: Props) {
  const { t } = useLanguage()
  const reviewsHref = `/zaak/${slug}/reviews`

  return (
    <section id="beoordeling" className="vysiongids-zaak-panel mt-8 scroll-mt-24 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-bold text-gray-900">{t('listing.ratingHeading')}</h2>
      <div className="mt-3">
        <ListingStarRating slug={slug} avg={listing.ratingAvg} count={listing.ratingCount} size="md" />
      </div>
      {reviews.length > 0 ? (
        <div className="mt-4">
          <ReviewList reviews={reviews.slice(0, 3)} />
        </div>
      ) : null}
      <p className="mt-4">
        <Link href={reviewsHref} className="font-semibold text-accent hover:underline">
          {t('listing.allReviewsLink')}
        </Link>
      </p>
      {canSubmitReview ? (
        <div className="mt-8">
          <h3 className="text-base font-bold text-gray-900">{t('listing.writeReviewHeading')}</h3>
          <div className="mt-3">
            <ReviewSubmitForm slug={slug} listingName={listing.name} />
          </div>
        </div>
      ) : null}
    </section>
  )
}
