'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LISTING_TYPES } from '@/lib/listing-types'

export default function ZaakToevoegenForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    try {
      const res = await fetch('/api/gids/register', { method: 'POST', body: fd })
      const data = (await res.json()) as { error?: string; url?: string }
      if (!res.ok) {
        setError(data.error ?? 'Registratie mislukt.')
        return
      }
      if (data.url) router.push(data.url)
      else router.push('/zoeken')
    } catch {
      setError('Netwerkfout. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  const types = LISTING_TYPES.filter((t) => t.id !== 'all')

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <label className="block text-sm font-semibold text-gray-700" htmlFor="name">
          Volledige zaaknaam (uniek)
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={3}
          placeholder="Bv. Restaurant De Ketel Brugge"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700" htmlFor="pin">
          6-cijferige PIN (bewaren — voor later inloggen)
        </label>
        <input
          id="pin"
          name="pin"
          required
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoComplete="off"
          className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 tracking-widest"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700" htmlFor="type">
            Type
          </label>
          <select id="type" name="type" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700" htmlFor="province">
            Provincie (optioneel)
          </label>
          <input id="province" name="province" placeholder="limburg" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700" htmlFor="city">
            Gemeente
          </label>
          <input id="city" name="city" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700" htmlFor="postcode">
            Postcode
          </label>
          <input id="postcode" name="postcode" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700" htmlFor="address">
          Straat + nummer
        </label>
        <input id="address" name="address" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700" htmlFor="orderUrl">
          Bestel-URL (https)
        </label>
        <input
          id="orderUrl"
          name="orderUrl"
          type="url"
          required
          placeholder="https://jouwzaak.ordervysion.com"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700">Foto&apos;s (1–3, max. 5 MB elk)</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <input key={i} name={`photo${i}`} type="file" accept="image/*" required={i === 0} className="text-sm" />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent py-3.5 text-lg font-bold text-white hover:bg-accent/90 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {loading ? 'Bezig…' : 'Direct online zetten'}
      </button>
    </form>
  )
}
