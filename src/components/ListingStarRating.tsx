import Link from 'next/link'

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
  const reviewsHref = `/zaak/${slug}/reviews`
  const hasReviews = count > 0
  const countLabel = count === 1 ? '1 beoordeling' : `${count} beoordelingen`

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
      <span className="vysiongids-star-rating-count">Nog geen reviews</span>
    </span>
  )

  if (!linkToReviews) return content

  return (
    <Link href={reviewsHref} className="vysiongids-star-rating-link">
      {content}
    </Link>
  )
}
