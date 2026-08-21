'use client'

import { useCallback, useMemo, useState } from 'react'
import ListingStarRating from '@/components/ListingStarRating'
import ReviewList from '@/components/ReviewList'
import ReviewSubmitForm from '@/components/ReviewSubmitForm'
import type { GidsReview } from '@/lib/gids-reviews-db'

type Props = {
  slug: string
  listingName: string
  initialReviews: GidsReview[]
  initialAvg: number
  initialCount: number
  canSubmit: boolean
}

function recomputeStats(reviews: GidsReview[]): { avg: number; count: number } {
  const count = reviews.length
  if (count === 0) return { avg: 0, count: 0 }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return { avg: Math.round((sum / count) * 10) / 10, count }
}

export default function ZaakReviewsLive({
  slug,
  listingName,
  initialReviews,
  initialAvg,
  initialCount,
  canSubmit,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews)
  const [avg, setAvg] = useState(initialAvg)
  const [count, setCount] = useState(initialCount)

  const onReviewPosted = useCallback((review: GidsReview) => {
    setReviews((prev) => {
      const next = [review, ...prev.filter((r) => r.id !== review.id)]
      const stats = recomputeStats(next)
      setAvg(stats.avg)
      setCount(stats.count)
      return next
    })
  }, [])

  const headerAvg = useMemo(() => avg, [avg])
  const headerCount = useMemo(() => count, [count])

  return (
    <>
      <div className="mt-4">
        <ListingStarRating slug={slug} avg={headerAvg} count={headerCount} size="md" linkToReviews={false} />
      </div>

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
            <ReviewSubmitForm slug={slug} listingName={listingName} onReviewPosted={onReviewPosted} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-600">
            Online reviews zijn beschikbaar zodra deze zaak in de gids-database staat. Bekijk intussen de score hierboven.
          </p>
        )}
      </section>
    </>
  )
}
