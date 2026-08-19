'use client'

import { formatGidsTitleCase, formatReviewCommentText } from '@/lib/gids-text'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  slug: string
  listingName: string
}

export default function ReviewSubmitForm({ slug, listingName }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (rating == null) {
      setError('Kies eerst je score: tik op 1 tot 5 sterren.')
      return
    }
    setLoading(true)
    const reviewerName = name.trim() ? formatGidsTitleCase(name.trim()) : undefined
    const reviewBody = formatReviewCommentText(body.trim())
    setName(reviewerName ?? '')
    setBody(reviewBody)
    try {
      const res = await fetch('/api/gids/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, rating, reviewerName, body: reviewBody }),
      })
      const data = (await res.json()) as { error?: string; ok?: boolean }
      if (!res.ok) {
        setError(data.error ?? 'Review plaatsen mislukt.')
        return
      }
      setDone(true)
      router.refresh()
    } catch {
      setError('Netwerkfout. Probeer opnieuw.')
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
        <p className="mt-1 text-sm text-gray-600">Kies 1 tot 5 sterren vóór je publiceert.</p>
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
            <span className="self-center text-sm font-medium text-amber-800">Nog geen score gekozen</span>
          )}
        </div>
      </fieldset>

      <div>
        <label className="vysiongids-form-label" htmlFor="reviewerName">
          Naam (optioneel)
        </label>
        <input
          id="reviewerName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setName((v) => (v.trim() ? formatGidsTitleCase(v) : v))}
          maxLength={80}
          className="vysiongids-form-input mt-1"
          autoComplete="name"
          autoCapitalize="words"
        />
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="reviewBody">
          Jouw ervaring
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </label>
        <textarea
          id="reviewBody"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => setBody((v) => (v.trim() ? formatReviewCommentText(v) : v))}
          className="vysiongids-form-input mt-1 resize-y"
          placeholder="Vertel kort wat je goed of minder vond…"
          autoCapitalize="sentences"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || rating == null || body.trim().length < 10}
        className="rounded-xl bg-accent px-8 py-3 font-bold text-white hover:bg-accent/90 disabled:opacity-60"
      >
        {loading ? 'Bezig…' : 'Review plaatsen'}
      </button>
    </form>
  )
}
