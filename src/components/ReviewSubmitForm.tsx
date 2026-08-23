'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import SentenceCaseTextarea from '@/components/SentenceCaseTextarea'
import TitleCaseTextInput from '@/components/TitleCaseTextInput'
import { formatGidsTitleCase, formatReviewCommentText } from '@/lib/gids-text'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { GidsReview } from '@/lib/gids-reviews-db'

type Props = {
  slug: string
  listingName: string
  onReviewPosted?: (review: GidsReview) => void
}

export default function ReviewSubmitForm({ slug, listingName, onReviewPosted }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const [rating, setRating] = useState<number | null>(null)
  const [bodyLen, setBodyLen] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (rating == null) {
      setError(t('errors.reviewChooseStars'))
      return
    }
    const fd = new FormData(e.currentTarget)
    const nameRaw = String(fd.get('reviewerName') ?? '').trim()
    const bodyRaw = String(fd.get('reviewBody') ?? '').trim()
    const reviewerName = nameRaw ? formatGidsTitleCase(nameRaw) : undefined
    const reviewBody = formatReviewCommentText(bodyRaw)
    if (reviewBody.length < 10) {
      setError(t('errors.reviewMinLength'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/gids/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, rating, reviewerName, body: reviewBody }),
      })
      const data = (await res.json()) as { error?: string; ok?: boolean; review?: GidsReview }
      if (!res.ok) {
        setError(data.error ?? t('errors.reviewPostFailed'))
        return
      }
      if (data.review) {
        onReviewPosted?.(data.review)
      }
      setDone(true)
      router.refresh()
    } catch {
      setError(t('errors.networkRetry'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900" role="status">
        Bedankt! Je review voor {listingName} staat online.
      </p>
    )
  }

  return (
    <form id="schrijven" onSubmit={onSubmit} className="vysiongids-review-form space-y-4">
      <fieldset>
        <legend className="vysiongids-form-label">
          Jouw score
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </legend>
        <p className="mt-1 text-sm text-gray-600">{t('reviews.formStarsHint')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`vysiongids-review-star-btn ${rating != null && rating >= n ? 'is-active' : ''}`}
              aria-label={`${n} sterren`}
              aria-pressed={rating != null && rating >= n}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
          {rating != null ? (
            <span className="self-center text-sm font-semibold text-gray-700">{rating} / 5</span>
          ) : (
            <span className="self-center text-sm font-medium text-amber-800">{t('reviews.noScoreYet')}</span>
          )}
        </div>
      </fieldset>

      <div>
        <label className="vysiongids-form-label" htmlFor="reviewerName">
          Naam (optioneel)
        </label>
        <TitleCaseTextInput
          id="reviewerName"
          name="reviewerName"
          maxLength={80}
          className="vysiongids-form-input mt-1"
          autoComplete="name"
        />
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="reviewBody">
          Jouw ervaring
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </label>
        <SentenceCaseTextarea
          id="reviewBody"
          name="reviewBody"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          onChange={(e) => setBodyLen(e.target.value.trim().length)}
          className="vysiongids-form-input mt-1 resize-y"
          placeholder={t('reviews.bodyPlaceholder')}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || rating == null || bodyLen < 10}
        className="rounded-xl bg-accent px-8 py-3 font-bold text-white hover:bg-accent/90 disabled:opacity-60"
      >
        {loading ? t('common.busy') : t('reviews.submit')}
      </button>
    </form>
  )
}
