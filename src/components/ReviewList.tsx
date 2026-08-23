'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import type { Locale } from '@/i18n/config'
import type { GidsReview } from '@/lib/gids-reviews-db'
import { formatReviewCommentText } from '@/lib/gids-text'

function dateLocale(locale: Locale): string {
  if (locale === 'fr') return 'fr-BE'
  if (locale === 'en') return 'en-GB'
  return 'nl-BE'
}

function formatReviewDate(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(dateLocale(locale), { dateStyle: 'medium' }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

function stars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

export default function ReviewList({ reviews }: { reviews: GidsReview[] }) {
  const { t, locale } = useLanguage()

  if (reviews.length === 0) {
    return <p className="text-sm text-gray-600">{t('reviews.emptyBeFirst')}</p>
  }

  return (
    <ul className="vysiongids-review-list space-y-4">
      {reviews.map((r) => (
        <li key={r.id} className="vysiongids-review-card">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-amber-500" aria-label={t('reviews.starsAria', { rating: r.rating })}>
              {stars(r.rating)}
            </span>
            <span className="font-semibold text-gray-900">{r.reviewerName?.trim() || t('reviews.guestName')}</span>
            <span className="text-xs text-gray-500">{formatReviewDate(r.createdAt, locale)}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{formatReviewCommentText(r.body)}</p>
        </li>
      ))}
    </ul>
  )
}
