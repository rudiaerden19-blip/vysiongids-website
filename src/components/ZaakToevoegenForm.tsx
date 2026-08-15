'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { LISTING_TYPES, type ListingDayHours } from '@/lib/listing-types'
import OpeningHoursEditor from '@/components/OpeningHoursEditor'
import { normalizeHttpsUrl } from '@/lib/normalize-url'

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

function PhotoPickField({ index }: { index: number }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const id = `photo${index}`

  return (
    <div className="vysiongids-photo-pick">
      <label className="vysiongids-photo-pick-label" htmlFor={id}>
        Foto {index + 1}
        <span className="vysiongids-form-required" aria-hidden>
          *
        </span>
      </label>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="file"
        accept="image/*"
        capture="environment"
        required
        className="vysiongids-photo-pick-input"
        onChange={(e) => {
          const f = e.target.files?.[0]
          setFileLabel(f ? f.name : null)
        }}
      />
      <button
        type="button"
        className="vysiongids-photo-pick-btn"
        onClick={() => inputRef.current?.click()}
      >
        Kies bestand
      </button>
      <p className="vysiongids-photo-pick-hint" aria-live="polite">
        {fileLabel ?? 'Nog geen foto'}
      </p>
    </div>
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
    const hoursRaw = String(fd.get('hoursByDay') ?? '[]')
    if (hoursRaw === '[]' || hoursRaw === '') {
      setError('Controleer je openingsuren per dag (tijden en eventueel 2e shift).')
      setLoading(false)
      return
    }

    const websiteRaw = String(fd.get('website') ?? '').trim()
    const orderUrlRaw = String(fd.get('orderUrl') ?? '').trim()
    const websiteNorm = normalizeHttpsUrl(websiteRaw)
    if (!websiteNorm.ok) {
      setError(`Website: ${websiteNorm.message}`)
      setLoading(false)
      return
    }
    const orderUrlNorm = normalizeHttpsUrl(orderUrlRaw)
    if (!orderUrlNorm.ok) {
      setError(`Bestel- of reserveer-URL: ${orderUrlNorm.message}`)
      setLoading(false)
      return
    }
    fd.set('website', websiteNorm.url)
    fd.set('orderUrl', orderUrlNorm.url)
    try {
      const rows = JSON.parse(hoursRaw) as ListingDayHours[]
      if (!Array.isArray(rows) || rows.length !== 7) {
        setError('Vul openingsuren per dag in.')
        setLoading(false)
        return
      }
      if (rows.every((r) => r.hours === 'gesloten')) {
        setError('Minstens één dag moet open zijn.')
        setLoading(false)
        return
      }
    } catch {
      setError('Openingsuren ongeldig.')
      setLoading(false)
      return
    }
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
    <form onSubmit={onSubmit} noValidate className="vysiongids-zaak-form mt-8 space-y-5">
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
          type="text"
          inputMode="url"
          autoComplete="url"
          required
          placeholder="jouwzaak.be of https://jouwzaak.be"
          className="vysiongids-form-input mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">https:// mag weg — wij vullen dat automatisch aan.</p>
      </div>

      <div>
        <RequiredLabel htmlFor="orderUrl">Bestel of reserveer-URL</RequiredLabel>
        <input
          id="orderUrl"
          name="orderUrl"
          type="text"
          inputMode="url"
          autoComplete="url"
          required
          placeholder="shop.jouwzaak.be of https://…"
          className="vysiongids-form-input mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">Link waar klanten bestellen of reserveren (mag hetzelfde zijn als website).</p>
      </div>

      <div>
        <p className="vysiongids-form-label">
          Openingstijden per dag
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </p>
        <OpeningHoursEditor />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <RequiredLabel htmlFor="deliveryFeeEur">Leveringskosten (€)</RequiredLabel>
          <input
            id="deliveryFeeEur"
            name="deliveryFeeEur"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            required
            placeholder="0 = gratis"
            className="vysiongids-form-input mt-1"
          />
        </div>
        <div>
          <RequiredLabel htmlFor="minOrderEur">Minimum bestelbedrag (€)</RequiredLabel>
          <input
            id="minOrderEur"
            name="minOrderEur"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            required
            placeholder="Bv. 15"
            className="vysiongids-form-input mt-1"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <RequiredLabel htmlFor="deliveryTimeMin">Levertijd vanaf (min)</RequiredLabel>
          <input
            id="deliveryTimeMin"
            name="deliveryTimeMin"
            type="number"
            inputMode="numeric"
            min={1}
            max={180}
            required
            placeholder="Bv. 25"
            className="vysiongids-form-input mt-1"
          />
        </div>
        <div>
          <RequiredLabel htmlFor="deliveryTimeMax">Levertijd tot (min)</RequiredLabel>
          <input
            id="deliveryTimeMax"
            name="deliveryTimeMax"
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            required
            placeholder="Bv. 45"
            className="vysiongids-form-input mt-1"
          />
        </div>
      </div>

      <div>
        <p className="vysiongids-form-label">
          3 foto&apos;s
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500">JPG/PNG/WebP, max. 5 MB per foto.</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {[0, 1, 2].map((i) => (
            <PhotoPickField key={i} index={i} />
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
