'use client'

import Link from 'next/link'
import { useLanguage } from '@/i18n/LanguageProvider'

type Props = {
  slug: string
  avg: number
  count: number
  /** compact for search cards */
  size?: 'sm' | 'md'
  linkToReviews?: boolean
}

function starGlyphs(avg: number): string {
  const clamped = Math.min(5, Math.max(0, avg))
  const full = Math.floor(clamped + 0.25)
  const empty = 5 - full
  return `${'★'.repeat(full)}${'☆'.repeat(empty)}`
}

export default function ListingStarRating({ slug, avg, count, size = 'sm', linkToReviews = true }: Props) {
  const { t } = useLanguage()
  const reviewsHref = `/zaak/${slug}/reviews`
  const hasReviews = count > 0
  const countLabel =
    count === 1 ? t('listing.panel.ratingCountOne') : t('listing.panel.ratingCountMany', { count })

  const content = hasReviews ? (
    <span className={`vysiongids-star-rating vysiongids-star-rating--${size}`}>
      <span className="vysiongids-star-rating-stars" aria-hidden>
        {starGlyphs(avg)}
      </span>
      <span className="vysiongids-star-rating-avg">{avg.toFixed(1)}</span>
      <span className="vysiongids-star-rating-count">({countLabel})</span>
    </span>
  ) : (
    <span className={`vysiongids-star-rating vysiongids-star-rating--${size} vysiongids-star-rating--empty`}>
      <span className="vysiongids-star-rating-count">{t('listing.panel.noReviewsYet')}</span>
    </span>
  )

  if (!linkToReviews) return content

  return (
    <Link href={reviewsHref} className="vysiongids-star-rating-link">
      {content}
    </Link>
  )
}
