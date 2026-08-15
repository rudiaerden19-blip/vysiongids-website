'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { LISTING_TYPES } from '@/lib/listing-types'

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label className="vysiongids-form-label" htmlFor={htmlFor}>
      {children}
      <span className="vysiongids-form-required" aria-hidden>
        *
      </span>
    </label>
  )
}

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
    <form onSubmit={onSubmit} className="vysiongids-zaak-form mt-8 space-y-5">
      <p className="text-sm text-gray-600">
        Velden met <span className="vysiongids-form-required" aria-hidden>*</span> zijn verplicht.
      </p>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <RequiredLabel htmlFor="name">Volledige zaaknaam (uniek)</RequiredLabel>
        <input
          id="name"
          name="name"
          required
          minLength={3}
          placeholder="Bv. Restaurant De Ketel Brugge"
          className="vysiongids-form-input mt-1"
        />
      </div>

      <div>
        <RequiredLabel htmlFor="pin">6-cijferige PIN (bewaren voor inloggen)</RequiredLabel>
        <input
          id="pin"
          name="pin"
          required
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoComplete="off"
          className="vysiongids-form-input mt-1 max-w-xs tracking-widest"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <RequiredLabel htmlFor="type">Type zaak</RequiredLabel>
          <select id="type" name="type" required className="vysiongids-form-input mt-1">
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <RequiredLabel htmlFor="province">Provincie</RequiredLabel>
          <select id="province" name="province" required className="vysiongids-form-input mt-1" defaultValue="">
            <option value="" disabled>
              Kies provincie
            </option>
            {BELGIUM_PROVINCES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <RequiredLabel htmlFor="city">Gemeente</RequiredLabel>
          <input id="city" name="city" required className="vysiongids-form-input mt-1" />
        </div>
        <div>
          <RequiredLabel htmlFor="postcode">Postcode</RequiredLabel>
          <input id="postcode" name="postcode" required className="vysiongids-form-input mt-1" />
        </div>
      </div>

      <div>
        <RequiredLabel htmlFor="address">Straat + nummer</RequiredLabel>
        <input id="address" name="address" required className="vysiongids-form-input mt-1" />
      </div>

      <div>
        <RequiredLabel htmlFor="phone">Telefoon</RequiredLabel>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+32 …"
          className="vysiongids-form-input mt-1"
        />
      </div>

      <div>
        <RequiredLabel htmlFor="email">E-mail</RequiredLabel>
        <input id="email" name="email" type="email" required autoComplete="email" className="vysiongids-form-input mt-1" />
      </div>

      <div>
        <RequiredLabel htmlFor="website">Website</RequiredLabel>
        <input
          id="website"
          name="website"
          type="url"
          required
          placeholder="https://jouwzaak.be"
          className="vysiongids-form-input mt-1"
        />
      </div>

      <div>
        <RequiredLabel htmlFor="orderUrl">Bestel-URL</RequiredLabel>
        <input
          id="orderUrl"
          name="orderUrl"
          type="url"
          required
          placeholder="https://jouwzaak.ordervysion.com"
          className="vysiongids-form-input mt-1"
        />
      </div>

      <div>
        <RequiredLabel htmlFor="openingHours">Openingstijden (weergave)</RequiredLabel>
        <input
          id="openingHours"
          name="openingHours"
          required
          placeholder="Bv. Ma–Zo 11:00–22:00"
          className="vysiongids-form-input mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">Gebruik voor «Nu open» later per dag in beheer (komt).</p>
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="closedDays">
          Gesloten op (optioneel)
        </label>
        <input
          id="closedDays"
          name="closedDays"
          placeholder="Bv. Maandag"
          className="vysiongids-form-input mt-1"
        />
      </div>

      <div>
        <p className="vysiongids-form-label">
          3 foto&apos;s
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500">JPG/PNG/WebP, max. 5 MB per foto.</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <label className="text-xs font-medium text-gray-600" htmlFor={`photo${i}`}>
                Foto {i + 1}
                <span className="vysiongids-form-required" aria-hidden>
                  *
                </span>
              </label>
              <input
                id={`photo${i}`}
                name={`photo${i}`}
                type="file"
                accept="image/*"
                required
                className="mt-1 block w-full text-sm"
              />
            </div>
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
