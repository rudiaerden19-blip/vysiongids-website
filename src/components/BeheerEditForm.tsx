'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { LISTING_TYPES, type Listing, type ListingDayHours } from '@/lib/listing-types'
import OpeningHoursEditor from '@/components/OpeningHoursEditor'
import { normalizeHttpsUrl } from '@/lib/normalize-url'
import { GIDS_REGISTER_MAX_TOTAL_PHOTO_BYTES } from '@/lib/gids-register-limits'
import { compressListingPhoto } from '@/lib/compress-listing-photo'
import ListingOwnerOptionsFields from '@/components/ListingOwnerOptionsFields'

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

function EditPhotoField({
  index,
  existingUrl,
  disabled,
  onRemoveChange,
  removeChecked,
}: {
  index: number
  existingUrl?: string
  disabled?: boolean
  removeChecked: boolean
  onRemoveChange: (checked: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const id = `photo${index}`

  return (
    <div className="vysiongids-photo-pick">
      <label className="vysiongids-photo-pick-label" htmlFor={id}>
        Foto {index + 1}
      </label>
      {existingUrl && !fileLabel ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={existingUrl}
          alt=""
          className="mt-1 h-24 w-full max-w-[200px] rounded-lg border border-gray-200 object-cover"
        />
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
          if (f) onRemoveChange(false)
        }}
      />
      <input type="hidden" name={`removePhoto${index}`} value={removeChecked ? '1' : '0'} />
      <button
        type="button"
        className="vysiongids-photo-pick-btn"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {existingUrl ? 'Vervang foto' : 'Kies bestand'}
      </button>
      <p className="vysiongids-photo-pick-hint" aria-live="polite">
        {fileLabel ?? (existingUrl ? 'Huidige foto blijft staan' : 'Geen foto')}
      </p>
      {existingUrl ? (
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={removeChecked}
            disabled={disabled}
            onChange={(e) => onRemoveChange(e.target.checked)}
          />
          Foto verwijderen
        </label>
      ) : null}
    </div>
  )
}

type BeheerEditFormProps = {
  listing: Listing
  onSaved?: (slug: string) => void
}

export default function BeheerEditForm({ listing, onSaved }: BeheerEditFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingHint, setLoadingHint] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState<[boolean, boolean, boolean]>([false, false, false])

  const initialPhotos = listing.photoUrls?.length ? listing.photoUrls : listing.photoUrl ? [listing.photoUrl] : []
  const hoursInitial = listing.hoursByDay as ListingDayHours[] | undefined

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    const hoursRaw = String(fd.get('hoursByDay') ?? '[]')
    if (hoursRaw === '[]' || hoursRaw === '') {
      setError('Controleer je openingsuren per dag.')
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
    fd.set('website', websiteNorm.url)
    if (orderUrlRaw) {
      const orderUrlNorm = normalizeHttpsUrl(orderUrlRaw)
      if (!orderUrlNorm.ok) {
        setError(`Bestel- of reserveer-URL: ${orderUrlNorm.message}`)
        setLoading(false)
        return
      }
      fd.set('orderUrl', orderUrlNorm.url)
    } else {
      fd.set('orderUrl', '')
    }

    try {
      setLoadingHint("Foto's verwerken…")
      let totalPhotoBytes = 0
      for (let i = 0; i < 3; i++) {
        const f = fd.get(`photo${i}`)
        if (!(f instanceof File) || f.size === 0) continue
        let compressed: File
        try {
          compressed = await compressListingPhoto(f)
        } catch {
          setError(`Foto ${i + 1} kon niet verwerkt worden.`)
          setLoading(false)
          setLoadingHint(null)
          return
        }
        fd.set(`photo${i}`, compressed, compressed.name)
        totalPhotoBytes += compressed.size
      }
      if (totalPhotoBytes > GIDS_REGISTER_MAX_TOTAL_PHOTO_BYTES) {
        setError("Foto's samen te groot na verkleinen.")
        setLoading(false)
        setLoadingHint(null)
        return
      }

      setLoadingHint('Opslaan…')
      const res = await fetch('/api/gids/me', { method: 'PATCH', body: fd })
      const raw = await res.text()
      let data: { error?: string; slug?: string; slugChanged?: boolean } = {}
      if (raw) {
        try {
          data = JSON.parse(raw) as typeof data
        } catch {
          setError(`Server antwoordde niet correct (${res.status}).`)
          setLoading(false)
          setLoadingHint(null)
          return
        }
      }
      if (!res.ok) {
        setError(data.error ?? 'Opslaan mislukt.')
        setLoading(false)
        setLoadingHint(null)
        return
      }

      const slug = data.slug ?? listing.slug
      setSuccess(
        data.slugChanged
          ? 'Opgeslagen. Je publieke link is gewijzigd — bookmark de nieuwe pagina.'
          : 'Je gegevens zijn opgeslagen.',
      )
      onSaved?.(slug)
      router.refresh()
    } catch {
      setError('Verbinding mislukt. Probeer opnieuw.')
    } finally {
      setLoading(false)
      setLoadingHint(null)
    }
  }

  const types = LISTING_TYPES.filter((t) => t.id !== 'all')

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">Gegevens bewerken</h2>
      <p className="mt-1 text-sm text-gray-600">Wijzigingen zijn direct zichtbaar op je publieke pagina.</p>

      <form onSubmit={onSubmit} noValidate className="vysiongids-zaak-form mt-6 space-y-5">
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
          <RequiredLabel htmlFor="edit-name">Volledige zaaknaam</RequiredLabel>
          <input
            id="edit-name"
            name="name"
            required
            minLength={3}
            defaultValue={listing.name}
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div>
          <label className="vysiongids-form-label" htmlFor="newPin">
            Nieuwe PIN (optioneel)
          </label>
          <input
            id="newPin"
            name="newPin"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="off"
            placeholder="6 cijfers — leeg laten = PIN blijft"
            className="vysiongids-form-input mt-1 max-w-xs tracking-widest"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <RequiredLabel htmlFor="edit-type">Type zaak</RequiredLabel>
            <select
              id="edit-type"
              name="type"
              required
              defaultValue={listing.type}
              className="vysiongids-form-input mt-1"
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <RequiredLabel htmlFor="edit-province">Provincie</RequiredLabel>
            <select
              id="edit-province"
              name="province"
              required
              defaultValue={listing.province ?? ''}
              className="vysiongids-form-input mt-1"
            >
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
            <RequiredLabel htmlFor="edit-city">Gemeente</RequiredLabel>
            <input id="edit-city" name="city" required defaultValue={listing.city} className="vysiongids-form-input mt-1" />
          </div>
          <div>
            <RequiredLabel htmlFor="edit-postcode">Postcode</RequiredLabel>
            <input
              id="edit-postcode"
              name="postcode"
              required
              defaultValue={listing.postcode}
              className="vysiongids-form-input mt-1"
            />
          </div>
        </div>

        <div>
          <RequiredLabel htmlFor="edit-address">Straat + nummer</RequiredLabel>
          <input
            id="edit-address"
            name="address"
            required
            defaultValue={listing.address}
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div>
          <label className="vysiongids-form-label" htmlFor="edit-phone">
            Telefoon
          </label>
          <input
            id="edit-phone"
            name="phone"
            type="tel"
            defaultValue={listing.phone ?? ''}
            placeholder="+32 … (optioneel)"
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div>
          <RequiredLabel htmlFor="edit-email">E-mail</RequiredLabel>
          <input
            id="edit-email"
            name="email"
            type="email"
            required
            defaultValue={listing.email ?? ''}
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div>
          <RequiredLabel htmlFor="edit-website">Website</RequiredLabel>
          <input
            id="edit-website"
            name="website"
            type="text"
            required
            defaultValue={listing.website ?? ''}
            placeholder="jouwzaak.be"
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div>
          <label className="vysiongids-form-label" htmlFor="edit-orderUrl">
            Bestel of reserveer-URL
          </label>
          <input
            id="edit-orderUrl"
            name="orderUrl"
            type="text"
            defaultValue={listing.orderUrl !== listing.website ? listing.orderUrl : ''}
            placeholder="Optioneel"
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div>
          <p className="vysiongids-form-label">
            Openingstijden per dag
            <span className="vysiongids-form-required" aria-hidden>
              *
            </span>
          </p>
          <OpeningHoursEditor initialHoursByDay={hoursInitial} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="vysiongids-form-label" htmlFor="edit-deliveryFeeEur">
              Leveringskosten (€)
            </label>
            <input
              id="edit-deliveryFeeEur"
              name="deliveryFeeEur"
              type="number"
              min={0}
              step={0.5}
              defaultValue={listing.deliveryFeeEur ?? ''}
              className="vysiongids-form-input mt-1"
            />
          </div>
          <div>
            <label className="vysiongids-form-label" htmlFor="edit-minOrderEur">
              Minimum bestelbedrag (€)
            </label>
            <input
              id="edit-minOrderEur"
              name="minOrderEur"
              type="number"
              min={0}
              step={0.5}
              defaultValue={listing.minOrderEur ?? ''}
              className="vysiongids-form-input mt-1"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="vysiongids-form-label" htmlFor="edit-deliveryTimeMin">
              Levertijd vanaf (min)
            </label>
            <input
              id="edit-deliveryTimeMin"
              name="deliveryTimeMin"
              type="number"
              min={1}
              max={180}
              defaultValue={listing.deliveryTimeMin ?? ''}
              className="vysiongids-form-input mt-1"
            />
          </div>
          <div>
            <label className="vysiongids-form-label" htmlFor="edit-deliveryTimeMax">
              Levertijd tot (min)
            </label>
            <input
              id="edit-deliveryTimeMax"
              name="deliveryTimeMax"
              type="number"
              min={1}
              max={240}
              defaultValue={listing.deliveryTimeMax ?? ''}
              className="vysiongids-form-input mt-1"
            />
          </div>
        </div>

        <div>
          <p className="vysiongids-form-label">Foto&apos;s</p>
          <p className="mt-0.5 text-xs text-gray-500">Minstens 1 foto. Vervang of verwijder per slot (max. 3).</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {[0, 1, 2].map((i) => (
              <EditPhotoField
                key={i}
                index={i}
                existingUrl={initialPhotos[i]}
                disabled={loading}
                removeChecked={removePhoto[i] ?? false}
                onRemoveChange={(checked) => {
                  setRemovePhoto((prev) => {
                    const next = [...prev] as [boolean, boolean, boolean]
                    next[i] = checked
                    return next
                  })
                }}
              />
            ))}
          </div>
        </div>

        <ListingOwnerOptionsFields initialAmenities={listing.amenities} />

        <button
          type="submit"
          disabled={loading}
          className="vysiongids-form-submit w-full rounded-xl bg-accent py-3.5 text-lg font-bold text-white hover:bg-accent/90 disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {loading ? (loadingHint ?? 'Bezig…') : 'Wijzigingen opslaan'}
        </button>
      </form>
    </section>
  )
}
