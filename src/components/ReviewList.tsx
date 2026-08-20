import type { GidsReview } from '@/lib/gids-reviews-db'

function formatReviewDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('nl-BE', { dateStyle: 'medium' }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

export default function ReviewList({ reviews }: { reviews: GidsReview[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-600">Nog geen reviews. Wees de eerste!</p>
  }

  return (
    <ul className="vysiongids-review-list space-y-4">
      {reviews.map((r) => (
        <li key={r.id} className="vysiongids-review-card">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-amber-500" aria-label={`${r.rating} van 5 sterren`}>
              {stars(r.rating)}
            </span>
            <span className="font-semibold text-gray-900">{r.reviewerName?.trim() || 'Gast'}</span>
            <span className="text-xs text-gray-500">{formatReviewDate(r.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{r.body}</p>
        </li>
      ))}
    </ul>
  )
}
