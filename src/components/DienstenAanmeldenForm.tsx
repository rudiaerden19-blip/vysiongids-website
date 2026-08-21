'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { GIDS_SERVICE_CATEGORIES } from '@/lib/gids-service-categories'
import { GIDS_DIENSTEN_MAX_PHOTOS } from '@/lib/gids-register-limits'
import { compressListingPhoto } from '@/lib/compress-listing-photo'
import SentenceCaseTextarea from '@/components/SentenceCaseTextarea'
import TitleCaseTextInput from '@/components/TitleCaseTextInput'
import { applyTitleCaseFormFields } from '@/components/TitleCaseTextInput'
import { normalizeHttpsUrl } from '@/lib/normalize-url'

function PhotoPickField({
  index,
  required,
  disabled,
}: {
  index: number
  required?: boolean
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const id = `photo${index}`

  return (
    <div className="vysiongids-photo-pick">
      <label className="vysiongids-photo-pick-label" htmlFor={id}>
        Foto {index + 1}
        {required ? (
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="file"
        accept="image/*"
        capture="environment"
        required={required}
        disabled={disabled}
        className="vysiongids-photo-pick-input"
        onChange={(e) => {
          const f = e.target.files?.[0]
          setFileLabel(f ? f.name : null)
        }}
      />
      <button type="button" className="vysiongids-photo-pick-btn" disabled={disabled} onClick={() => inputRef.current?.click()}>
        Kies bestand
      </button>
      <p className="vysiongids-photo-pick-hint" aria-live="polite">
        {fileLabel ?? 'Nog geen foto'}
      </p>
    </div>
  )
}

export default function DienstenAanmeldenForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    applyTitleCaseFormFields(fd, ['name', 'city', 'address'])

    const websiteRaw = String(fd.get('website') ?? '').trim()
    if (websiteRaw) {
      const websiteNorm = normalizeHttpsUrl(websiteRaw)
      if (!websiteNorm.ok) {
        setError(`Website: ${websiteNorm.message}`)
        setLoading(false)
        return
      }
      fd.set('website', websiteNorm.url)
    } else {
      fd.set('website', '')
    }

    try {
      for (let i = 0; i < GIDS_DIENSTEN_MAX_PHOTOS; i++) {
        const f = fd.get(`photo${i}`)
        if (!(f instanceof File) || f.size === 0) continue
        const compressed = await compressListingPhoto(f)
        fd.set(`photo${i}`, compressed, compressed.name)
      }

      const res = await fetch('/api/gids/register-diensten', { method: 'POST', body: fd })
      const data = (await res.json()) as {
        error?: string
        checkoutUrl?: string
        url?: string
        slug?: string
      }
      if (!res.ok) {
        setError(data.error ?? 'Registratie mislukt.')
        return
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      if (data.url) {
        router.push(data.url)
        return
      }
      router.push('/diensten')
    } catch {
      setError('Netwerkfout. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="vysiongids-diensten-aanmelden-form space-y-5">
      <div>
        <label className="vysiongids-form-label" htmlFor="d-name">
          Bedrijfsnaam
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </label>
        <TitleCaseTextInput id="d-name" name="name" required minLength={3} className="vysiongids-form-input mt-1" />
      </div>

      <fieldset>
        <legend className="vysiongids-form-label">
          Categorieën
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </legend>
        <p className="mt-1 text-sm text-gray-600">Kies alles wat op jouw aanbod van toepassing is.</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {GIDS_SERVICE_CATEGORIES.map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-800">
                <input type="checkbox" name="serviceCategories" value={c.id} className="mt-0.5" />
                {c.label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <label className="vysiongids-form-label" htmlFor="d-desc">
          Wat bied je aan?
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </label>
        <SentenceCaseTextarea
          id="d-desc"
          name="serviceDescription"
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          className="vysiongids-form-input mt-1 resize-y"
          placeholder="Kassasystemen, installatie, onderhoud, …"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="vysiongids-form-label" htmlFor="d-prov">
            Provincie
            <span className="vysiongids-form-required" aria-hidden>
              *
            </span>
          </label>
          <select id="d-prov" name="province" required className="vysiongids-form-input mt-1">
            <option value="">Kies…</option>
            {BELGIUM_PROVINCES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="vysiongids-form-label" htmlFor="d-postcode">
            Postcode
            <span className="vysiongids-form-required" aria-hidden>
              *
            </span>
          </label>
          <input id="d-postcode" name="postcode" required className="vysiongids-form-input mt-1" />
        </div>
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="d-city">
          Gemeente
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </label>
        <TitleCaseTextInput id="d-city" name="city" required className="vysiongids-form-input mt-1" />
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="d-address">
          Straat en nummer
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </label>
        <TitleCaseTextInput id="d-address" name="address" required className="vysiongids-form-input mt-1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="vysiongids-form-label" htmlFor="d-phone">
            Telefoon
            <span className="vysiongids-form-required" aria-hidden>
              *
            </span>
          </label>
          <input id="d-phone" name="phone" type="tel" required autoComplete="tel" className="vysiongids-form-input mt-1" />
        </div>
        <div>
          <label className="vysiongids-form-label" htmlFor="d-email">
            E-mail (optioneel)
          </label>
          <input id="d-email" name="email" type="email" autoComplete="email" className="vysiongids-form-input mt-1" />
        </div>
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="d-website">
          Website (optioneel)
        </label>
        <input
          id="d-website"
          name="website"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="jouwzaak.be of https://jouwzaak.be (optioneel)"
          className="vysiongids-form-input mt-1"
        />
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="d-pin">
          Kies een PIN (6 cijfers)
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </label>
        <input
          id="d-pin"
          name="pin"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          className="vysiongids-form-input mt-1 tracking-widest"
        />
      </div>

      <div>
        <p className="vysiongids-form-label">
          Foto&apos;s
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500">Minstens 1 foto, tot {GIDS_DIENSTEN_MAX_PHOTOS}. Grote foto&apos;s verkleinen we automatisch.</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {Array.from({ length: GIDS_DIENSTEN_MAX_PHOTOS }, (_, i) => (
            <PhotoPickField key={i} index={i} required={i === 0} disabled={loading} />
          ))}
        </div>
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
        {loading ? 'Bezig…' : process.env.NEXT_PUBLIC_GIDS_DIENSTEN_SKIP_PAYMENT === '1' ? 'Registreren (test)' : 'Registreren en betalen (€99/jaar)'}
      </button>
    </form>
  )
}
