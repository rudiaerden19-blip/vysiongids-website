'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { localizedProvinceLabel } from '@/lib/geo-i18n'
import { GIDS_SERVICE_CATEGORIES } from '@/lib/gids-service-categories'
import { GIDS_DIENSTEN_MAX_PHOTOS, GIDS_DIENSTEN_MAX_TOTAL_PHOTO_BYTES } from '@/lib/gids-register-limits'
import { compressListingPhoto } from '@/lib/compress-listing-photo'
import SentenceCaseTextarea from '@/components/SentenceCaseTextarea'
import TitleCaseTextInput, { applyTitleCaseFormFields } from '@/components/TitleCaseTextInput'
import { normalizeHttpsUrl } from '@/lib/normalize-url'
import type { Listing } from '@/lib/listing-types'
import { GidsButtonLoadingContent } from '@/components/GidsLoadingSpinner'
import GidsPageLoadingOverlay from '@/components/GidsPageLoadingOverlay'
import { useGidsBusyUntilNav } from '@/hooks/use-gids-busy-until-nav'

function EditPhotoField({
  index,
  existingUrl,
  disabled,
  removeChecked,
  onRemoveChange,
}: {
  index: number
  existingUrl?: string
  disabled?: boolean
  removeChecked: boolean
  onRemoveChange: (checked: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const id = `photo${index}`

  return (
    <div className="vysiongids-photo-pick">
      <label className="vysiongids-photo-pick-label" htmlFor={id}>
        Foto {index + 1}
      </label>
      {localPreviewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={localPreviewUrl} alt="" className="mt-1 h-20 w-full max-w-[160px] rounded-lg border object-cover" />
      ) : existingUrl && !removeChecked ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={existingUrl} alt="" className="mt-1 h-20 w-full max-w-[160px] rounded-lg border object-cover" />
      ) : null}
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="vysiongids-photo-pick-input"
        onChange={(e) => {
          const f = e.target.files?.[0]
          setFileLabel(f ? f.name : null)
          if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
          setLocalPreviewUrl(f ? URL.createObjectURL(f) : null)
          if (f) onRemoveChange(false)
        }}
      />
      <input type="hidden" name={`removePhoto${index}`} value={removeChecked ? '1' : '0'} />
      <button type="button" className="vysiongids-photo-pick-btn" disabled={disabled} onClick={() => inputRef.current?.click()}>
        {existingUrl ? 'Vervang' : 'Toevoegen'}
      </button>
      <p className="vysiongids-photo-pick-hint" aria-live="polite">
        {fileLabel ?? (existingUrl ? 'Huidige foto' : 'Geen foto')}
      </p>
      {existingUrl ? (
        <label className="mt-1 flex items-center gap-2 text-xs text-gray-700">
          <input type="checkbox" checked={removeChecked} disabled={disabled} onChange={(e) => onRemoveChange(e.target.checked)} />
          Verwijderen
        </label>
      ) : null}
    </div>
  )
}

type Props = {
  listing: Listing
  onSaved?: (slug: string) => void
}

export default function BeheerDienstenEditForm({ listing, onSaved }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loadingHint, setLoadingHint] = useState<string | null>(null)
  const { busy, startBusy, stopBusy } = useGidsBusyUntilNav()

  const initialPhotos = listing.photoUrls?.length ? listing.photoUrls : listing.photoUrl ? [listing.photoUrl] : []
  const [removePhoto, setRemovePhoto] = useState<boolean[]>(() =>
    Array.from({ length: GIDS_DIENSTEN_MAX_PHOTOS }, () => false),
  )

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startBusy()
    const form = e.currentTarget
    const fd = new FormData(form)
    applyTitleCaseFormFields(fd, ['name', 'city', 'address'])

    const websiteRaw = String(fd.get('website') ?? '').trim()
    if (websiteRaw) {
      const websiteNorm = normalizeHttpsUrl(websiteRaw)
      if (!websiteNorm.ok) {
        setError(`Website: ${websiteNorm.message}`)
        stopBusy()
        return
      }
      fd.set('website', websiteNorm.url)
    } else {
      fd.set('website', '')
    }

    try {
      setLoadingHint("Foto's verwerken…")
      let totalPhotoBytes = 0
      for (let i = 0; i < GIDS_DIENSTEN_MAX_PHOTOS; i++) {
        const f = fd.get(`photo${i}`)
        if (!(f instanceof File) || f.size === 0) continue
        const compressed = await compressListingPhoto(f)
        fd.set(`photo${i}`, compressed, compressed.name)
        totalPhotoBytes += compressed.size
      }
      if (totalPhotoBytes > GIDS_DIENSTEN_MAX_TOTAL_PHOTO_BYTES) {
        setError("Foto's samen te groot na verkleinen.")
        stopBusy()
        setLoadingHint(null)
        return
      }

      setLoadingHint('Profiel opslaan…')
      const res = await fetch('/api/gids/me', { method: 'PATCH', body: fd, credentials: 'same-origin' })
      const data = (await res.json()) as { error?: string; slug?: string; slugChanged?: boolean }
      if (!res.ok) {
        setError(data.error ?? 'Opslaan mislukt.')
        stopBusy()
        setLoadingHint(null)
        return
      }
      const newSlug = data.slug ?? listing.slug
      setSuccess('Je dienstenprofiel is bijgewerkt.')
      onSaved?.(newSlug)
      if (data.slugChanged && newSlug) {
        setLoadingHint('Profiel openen…')
        router.push(`/beheer`)
        router.refresh()
        return
      }
      stopBusy()
      setLoadingHint(null)
      router.refresh()
    } catch {
      setError('Netwerkfout.')
      stopBusy()
      setLoadingHint(null)
    }
  }

  const selectedCats = new Set(listing.serviceCategories ?? [])

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="vysiongids-surface-card mt-4 space-y-5 rounded-xl bg-white p-5 sm:p-6"
      >
        <h2 className="text-lg font-bold text-gray-900">{t('diensten.beheerEditTitle')}</h2>
        <p className="text-sm text-gray-600">
          Pas je reclametekst, foto&apos;s en contactgegevens aan. Dit is wat klanten zien onder{' '}
          <strong>{t('meta.pages.diensten')}</strong>.
        </p>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900" role="status">
            {success}
          </p>
        ) : null}

        <div>
          <label className="vysiongids-form-label" htmlFor="bd-name">
            Bedrijfsnaam *
          </label>
          <TitleCaseTextInput
            id="bd-name"
            name="name"
            required
            minLength={3}
            defaultValue={listing.name}
            disabled={busy}
            className="vysiongids-form-input mt-1"
          />
        </div>

        <fieldset disabled={busy}>
          <legend className="vysiongids-form-label">Categorieën *</legend>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {GIDS_SERVICE_CATEGORIES.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    name="serviceCategories"
                    value={c.id}
                    defaultChecked={selectedCats.has(c.id)}
                    className="mt-0.5"
                  />
                  {c.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <div>
          <label className="vysiongids-form-label" htmlFor="bd-desc">
            Advertentietekst / wat bied je aan? *
          </label>
          <SentenceCaseTextarea
            id="bd-desc"
            name="serviceDescription"
            required
            minLength={20}
            maxLength={2000}
            rows={5}
            defaultValue={listing.serviceDescription ?? ''}
            disabled={busy}
            className="vysiongids-form-input mt-1 resize-y"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="vysiongids-form-label" htmlFor="bd-prov">
              Provincie *
            </label>
            <select
              id="bd-prov"
              name="province"
              required
              defaultValue={listing.province ?? ''}
              disabled={busy}
              className="vysiongids-form-input mt-1"
            >
              <option value="">Kies…</option>
              {BELGIUM_PROVINCES.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {localizedProvinceLabel(p.slug, t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="vysiongids-form-label" htmlFor="bd-postcode">
              Postcode *
            </label>
            <input
              id="bd-postcode"
              name="postcode"
              required
              defaultValue={listing.postcode}
              disabled={busy}
              className="vysiongids-form-input mt-1"
            />
          </div>
        </div>

        <div>
          <label className="vysiongids-form-label" htmlFor="bd-city">
            Gemeente *
          </label>
          <TitleCaseTextInput
            id="bd-city"
            name="city"
            required
            defaultValue={listing.city}
            disabled={busy}
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div>
          <label className="vysiongids-form-label" htmlFor="bd-address">
            Straat en nummer *
          </label>
          <TitleCaseTextInput
            id="bd-address"
            name="address"
            required
            defaultValue={listing.address}
            disabled={busy}
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="vysiongids-form-label" htmlFor="bd-phone">
              Telefoon *
            </label>
            <input
              id="bd-phone"
              name="phone"
              type="tel"
              required
              defaultValue={listing.phone ?? ''}
              disabled={busy}
              className="vysiongids-form-input mt-1"
            />
          </div>
          <div>
            <label className="vysiongids-form-label" htmlFor="bd-email">
              E-mail (optioneel)
            </label>
            <input
              id="bd-email"
              name="email"
              type="email"
              defaultValue={listing.email ?? ''}
              disabled={busy}
              className="vysiongids-form-input mt-1"
            />
          </div>
        </div>

        <div>
          <label className="vysiongids-form-label" htmlFor="bd-website">
            Website (optioneel)
          </label>
          <input
            id="bd-website"
            name="website"
            type="text"
            defaultValue={listing.website ?? ''}
            disabled={busy}
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div>
          <p className="vysiongids-form-label">Foto&apos;s (minstens 1)</p>
          <p className="mt-0.5 text-xs text-gray-500">Tot {GIDS_DIENSTEN_MAX_PHOTOS} reclamefoto&apos;s.</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {Array.from({ length: GIDS_DIENSTEN_MAX_PHOTOS }, (_, i) => (
              <EditPhotoField
                key={i}
                index={i}
                existingUrl={initialPhotos[i]}
                disabled={busy}
                removeChecked={removePhoto[i] ?? false}
                onRemoveChange={(checked) => {
                  setRemovePhoto((prev) => {
                    const next = [...prev]
                    next[i] = checked
                    return next
                  })
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-accent px-8 py-3 font-bold text-white hover:bg-accent/90 disabled:opacity-60"
        >
          {busy ? <GidsButtonLoadingContent label={loadingHint ?? 'Opslaan…'} /> : 'Wijzigingen opslaan'}
        </button>
      </form>
      <GidsPageLoadingOverlay open={busy} message={loadingHint ?? 'Profiel opslaan…'} />
    </>
  )
}
