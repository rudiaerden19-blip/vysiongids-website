'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { type Listing, type ListingDayHours } from '@/lib/listing-types'
import OpeningHoursEditor, { type OpeningHoursPayload } from '@/components/OpeningHoursEditor'
import OpeningScheduleExtrasEditor from '@/components/OpeningScheduleExtrasEditor'
import { normalizeHttpsUrl } from '@/lib/normalize-url'
import { GIDS_REGISTER_MAX_TOTAL_PHOTO_BYTES } from '@/lib/gids-register-limits'
import { compressListingPhoto } from '@/lib/compress-listing-photo'
import DeliveryRadiusKmField from '@/components/DeliveryRadiusKmField'
import ListingOwnerOptionsFields from '@/components/ListingOwnerOptionsFields'
import ListingMenuOwnerFields from '@/components/ListingMenuOwnerFields'
import BeheerInfoExtrasFields from '@/components/BeheerInfoExtrasFields'
import KitchenTypeSelect from '@/components/KitchenTypeSelect'
import HorecaTypesCheckboxGroup from '@/components/HorecaTypesCheckboxGroup'
import TitleCaseTextInput, { applyTitleCaseFormFields } from '@/components/TitleCaseTextInput'
import BeheerZaakQrCard from '@/components/BeheerZaakQrCard'
import BeheerPromotiesFields from '@/components/BeheerPromotiesFields'

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
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const id = `photo${index}`

  return (
    <div className="vysiongids-photo-pick">
      <label className="vysiongids-photo-pick-label" htmlFor={id}>
        Foto {index + 1}
      </label>
      {localPreviewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={localPreviewUrl}
          alt=""
          className="mt-1 h-24 w-full max-w-[200px] rounded-lg border border-gray-200 object-cover"
        />
      ) : existingUrl && !fileLabel ? (
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
          if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
          setLocalPreviewUrl(f ? URL.createObjectURL(f) : null)
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
        {fileLabel ? 'Nieuwe foto — klik Opslaan om te publiceren' : existingUrl ? 'Huidige foto' : 'Geen foto'}
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
  const { t } = useLanguage()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingHint, setLoadingHint] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState<[boolean, boolean, boolean]>([false, false, false])

  const initialPhotos = listing.photoUrls?.length ? listing.photoUrls : listing.photoUrl ? [listing.photoUrl] : []
  const hoursInitial = listing.hoursByDay as ListingDayHours[] | undefined
  const hoursPayloadRef = useRef<OpeningHoursPayload>({ json: '[]', error: null })

  const onHoursPayloadChange = useCallback((payload: OpeningHoursPayload) => {
    hoursPayloadRef.current = payload
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    applyTitleCaseFormFields(fd, ['name', 'city', 'address'])
    const hoursPayload = hoursPayloadRef.current
    const hoursRaw = hoursPayload.json || String(fd.get('hoursByDay') ?? '[]')
    if (hoursPayload.error) {
      setError(hoursPayload.error)
      setLoading(false)
      return
    }
    if (hoursRaw === '[]' || hoursRaw === '') {
      setError('Controleer je openingsuren per dag.')
      setLoading(false)
      return
    }

    const websiteRaw = String(fd.get('website') ?? '').trim()
    const orderUrlRaw = String(fd.get('orderUrl') ?? '').trim()
    const menuUrlRaw = String(fd.get('menuUrl') ?? '').trim()
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
    if (menuUrlRaw) {
      const menuUrlNorm = normalizeHttpsUrl(menuUrlRaw)
      if (!menuUrlNorm.ok) {
        setError(`Menu-link: ${menuUrlNorm.message}`)
        setLoading(false)
        return
      }
      fd.set('menuUrl', menuUrlNorm.url)
    } else {
      fd.set('menuUrl', '')
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

  return (
    <section className="vysiongids-surface-card rounded-xl bg-white p-5">
      <h2 className="text-xl font-bold text-gray-900">{t('beheer.editFormTitle')}</h2>
      <p className="mt-1 text-sm text-gray-600">{t('beheer.editFormLead')}</p>

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
          <RequiredLabel htmlFor="edit-name">{t('beheer.editForm.nameLabel')}</RequiredLabel>
          <TitleCaseTextInput
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
            placeholder={t('beheer.editForm.newPinPlaceholder')}
            className="vysiongids-form-input mt-1 max-w-xs tracking-widest"
          />
        </div>

        <div>
          <p className="vysiongids-form-label">
            Type zaak (meerdere mogelijk)
            <span className="vysiongids-form-required" aria-hidden>
              *
            </span>
          </p>
          <HorecaTypesCheckboxGroup idPrefix="edit" listing={listing} disabled={loading} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <RequiredLabel htmlFor="edit-province">{t('common.province')}</RequiredLabel>
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

        <KitchenTypeSelect id="edit-cuisineType" defaultValue={listing.cuisineType} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <RequiredLabel htmlFor="edit-city">{t('beheer.editForm.cityLabel')}</RequiredLabel>
            <TitleCaseTextInput
              id="edit-city"
              name="city"
              required
              defaultValue={listing.city}
              className="vysiongids-form-input mt-1"
            />
          </div>
          <div>
            <RequiredLabel htmlFor="edit-postcode">{t('beheer.editForm.postcodeLabel')}</RequiredLabel>
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
          <RequiredLabel htmlFor="edit-address">{t('beheer.editForm.addressLabel')}</RequiredLabel>
          <TitleCaseTextInput
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
            placeholder={t('beheer.editForm.phonePlaceholder')}
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div>
          <label className="vysiongids-form-label" htmlFor="edit-email">
            E-mail
          </label>
          <input
            id="edit-email"
            name="email"
            type="email"
            defaultValue={listing.email ?? ''}
            className="vysiongids-form-input mt-1"
          />
        </div>

        <div>
          <label className="vysiongids-form-label" htmlFor="edit-website">
            Website
          </label>
          <input
            id="edit-website"
            name="website"
            type="text"
            defaultValue={listing.website ?? ''}
            placeholder={t('beheer.editForm.websitePlaceholder')}
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
            placeholder={t('common.optional')}
            className="vysiongids-form-input mt-1"
          />
        </div>

        <ListingMenuOwnerFields
          idPrefix="edit"
          defaultMenuUrl={listing.menuUrl ?? ''}
          existingMenuPdfUrl={listing.menuPdfUrl}
          disabled={loading}
        />

        <div>
          <p className="vysiongids-form-label">
            Openingstijden per dag
            <span className="vysiongids-form-required" aria-hidden>
              *
            </span>
          </p>
          <OpeningHoursEditor initialHoursByDay={hoursInitial} onPayloadChange={onHoursPayloadChange} />
          <OpeningScheduleExtrasEditor initial={listing.infoExtras?.schedule} />
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
            <label className="vysiongids-form-label" htmlFor="edit-pickupTimeMin">
              Afhaaltijd vanaf (min)
            </label>
            <input
              id="edit-pickupTimeMin"
              name="pickupTimeMin"
              type="number"
              min={1}
              max={180}
              defaultValue={listing.pickupTimeMin ?? ''}
              placeholder={t('beheer.editForm.pickupPlaceholderExample')}
              className="vysiongids-form-input mt-1"
            />
          </div>
          <div>
            <label className="vysiongids-form-label" htmlFor="edit-pickupTimeMax">
              Afhaaltijd tot (min)
            </label>
            <input
              id="edit-pickupTimeMax"
              name="pickupTimeMax"
              type="number"
              min={1}
              max={240}
              defaultValue={listing.pickupTimeMax ?? ''}
              placeholder={t('beheer.editForm.pickupMaxPlaceholderExample')}
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

        <DeliveryRadiusKmField idPrefix="edit-" defaultValueKm={listing.deliveryRadiusKm} />

        <div>
          <p className="vysiongids-form-label">Foto&apos;s</p>
          <p className="mt-0.5 text-xs text-gray-500">{t('beheer.editForm.photosHint')}</p>
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

        <BeheerInfoExtrasFields listing={listing} disabled={loading} />

        <BeheerZaakQrCard slug={listing.slug} listingName={listing.name} />

        <BeheerPromotiesFields listing={listing} disabled={loading} />

        <button
          type="submit"
          disabled={loading}
          className="vysiongids-form-submit mt-8 w-full rounded-xl bg-accent py-3.5 text-lg font-bold text-white hover:bg-accent/90 disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {loading ? (loadingHint ?? 'Bezig…') : 'Wijzigingen opslaan'}
        </button>
      </form>
    </section>
  )
}
