'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  slug: string
  listingName: string
}

export default function ReviewSubmitForm({ slug, listingName }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(1)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/gids/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, rating, reviewerName: name.trim() || undefined, body: body.trim() }),
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
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`vysiongids-review-star-btn ${rating >= n ? 'is-active' : ''}`}
              aria-label={`${n} sterren`}
              aria-pressed={rating >= n}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
          <span className="self-center text-sm font-semibold text-gray-700">{rating} / 5</span>
        </div>
        <input type="hidden" name="rating" value={rating} />
      </fieldset>

      <div>
        <label className="vysiongids-form-label" htmlFor="reviewerName">
          Naam (optioneel)
        </label>
        <input
          id="reviewerName"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        <textarea
          id="reviewBody"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="vysiongids-form-input mt-1 resize-y"
          placeholder="Vertel kort wat je goed of minder vond…"
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-accent px-8 py-3 font-bold text-white hover:bg-accent/90 disabled:opacity-60"
      >
        {loading ? 'Bezig…' : 'Review plaatsen'}
      </button>
    </form>
  )
}
