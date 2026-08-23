'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { GidsButtonLoadingContent } from '@/components/GidsLoadingSpinner'
import GidsPageLoadingOverlay from '@/components/GidsPageLoadingOverlay'
import { useGidsBusyUntilNav } from '@/hooks/use-gids-busy-until-nav'
import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { localizedProvinceLabel } from '@/lib/geo-i18n'
import { type ListingDayHours } from '@/lib/listing-types'
import OpeningHoursEditor, { type OpeningHoursPayload } from '@/components/OpeningHoursEditor'
import OpeningScheduleExtrasEditor from '@/components/OpeningScheduleExtrasEditor'
import { normalizeHttpsUrl } from '@/lib/normalize-url'
import { GIDS_REGISTER_MAX_TOTAL_PHOTO_BYTES } from '@/lib/gids-register-limits'
import { compressListingPhoto } from '@/lib/compress-listing-photo'
import ListingOwnerOptionsFields from '@/components/ListingOwnerOptionsFields'
import BeheerInfoExtrasFields from '@/components/BeheerInfoExtrasFields'
import ListingMenuOwnerFields from '@/components/ListingMenuOwnerFields'
import DeliveryRadiusKmField from '@/components/DeliveryRadiusKmField'
import KitchenTypeSelect from '@/components/KitchenTypeSelect'
import HorecaTypesCheckboxGroup from '@/components/HorecaTypesCheckboxGroup'
import TitleCaseTextInput, { applyTitleCaseFormFields } from '@/components/TitleCaseTextInput'

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

function PhotoPickField({
  index,
  required,
  disabled,
}: {
  index: number
  required?: boolean
  disabled?: boolean
}) {
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const id = `photo${index}`
  const isRequired = required ?? false

  return (
    <div className="vysiongids-photo-pick">
      <label className="vysiongids-photo-pick-label" htmlFor={id}>
        {t('beheer.editForm.photoSlotLabel', { index: index + 1 })}
        {isRequired ? (
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
        required={isRequired}
        disabled={disabled}
        className="vysiongids-photo-pick-input"
        onChange={(e) => {
          const f = e.target.files?.[0]
          setFileLabel(f ? f.name : null)
        }}
      />
      <button
        type="button"
        className="vysiongids-photo-pick-btn"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {t('beheer.editForm.photoChoose')}
      </button>
      <p className="vysiongids-photo-pick-hint" aria-live="polite">
        {fileLabel ?? t('beheer.editForm.photoHintEmpty')}
      </p>
    </div>
  )
}

export default function ZaakToevoegenForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loadingHint, setLoadingHint] = useState<string | null>(null)
  const { busy, startBusy, stopBusy } = useGidsBusyUntilNav()
  const hoursPayloadRef = useRef<OpeningHoursPayload>({ json: '[]', error: null })

  const onHoursPayloadChange = useCallback((payload: OpeningHoursPayload) => {
    hoursPayloadRef.current = payload
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startBusy()
    const form = e.currentTarget
    const fd = new FormData(form)
    applyTitleCaseFormFields(fd, ['name', 'city', 'address'])
    const hoursPayload = hoursPayloadRef.current
    const hoursRaw = hoursPayload.json || String(fd.get('hoursByDay') ?? '[]')
    if (hoursPayload.error) {
      setError(hoursPayload.error)
      stopBusy()
      return
    }
    if (hoursRaw === '[]' || hoursRaw === '') {
      setError(t('errors.openingHoursCheckDetail'))
      stopBusy()
      return
    }

    const websiteRaw = String(fd.get('website') ?? '').trim()
    const orderUrlRaw = String(fd.get('orderUrl') ?? '').trim()
    if (websiteRaw) {
      const websiteNorm = normalizeHttpsUrl(websiteRaw)
      if (!websiteNorm.ok) {
        setError(t('errors.websiteInvalid', { message: websiteNorm.message }))
        stopBusy()
        return
      }
      fd.set('website', websiteNorm.url)
    } else {
      fd.set('website', '')
    }
    if (orderUrlRaw) {
      const orderUrlNorm = normalizeHttpsUrl(orderUrlRaw)
      if (!orderUrlNorm.ok) {
        setError(t('errors.orderUrlInvalid', { message: orderUrlNorm.message }))
        stopBusy()
        return
      }
      fd.set('orderUrl', orderUrlNorm.url)
    } else {
      fd.set('orderUrl', '')
    }
    try {
      const rows = JSON.parse(hoursRaw) as ListingDayHours[]
      if (!Array.isArray(rows) || rows.length !== 7) {
        setError(t('errors.hoursFillAllDays'))
        stopBusy()
        return
      }
      if (rows.every((r) => r.hours === 'gesloten')) {
        setError(t('errors.hoursAtLeastOneOpen'))
        stopBusy()
        return
      }
    } catch {
      setError(t('errors.hoursInvalid'))
      stopBusy()
      return
    }
    try {
      setLoadingHint(t('forms.zaakToevoegen.photosCompressing'))
      let totalPhotoBytes = 0
      let hasPhoto = false
      for (let i = 0; i < 3; i++) {
        const f = fd.get(`photo${i}`)
        if (!(f instanceof File) || f.size === 0) continue
        hasPhoto = true
        let compressed: File
        try {
          compressed = await compressListingPhoto(f)
        } catch {
          setError(t('errors.photoProcessFailedDetail', { index: i + 1 }))
          stopBusy()
          setLoadingHint(null)
          return
        }
        fd.set(`photo${i}`, compressed, compressed.name)
        totalPhotoBytes += compressed.size
      }
      if (!hasPhoto) {
        setError(t('errors.photoMinOne'))
        stopBusy()
        setLoadingHint(null)
        return
      }
      if (totalPhotoBytes > GIDS_REGISTER_MAX_TOTAL_PHOTO_BYTES) {
        setError(t('errors.photosStillTooLarge'))
        stopBusy()
        setLoadingHint(null)
        return
      }

      setLoadingHint(t('forms.zaakToevoegen.publishingOnline'))
      const res = await fetch('/api/gids/register', { method: 'POST', body: fd })
      const raw = await res.text()
      let data: { error?: string; url?: string } = {}
      if (raw) {
        try {
          data = JSON.parse(raw) as { error?: string; url?: string }
        } catch {
          if (res.status === 413) {
            setError(t('errors.uploadTooLarge'))
          } else {
            setError(t('errors.serverBadResponseRetry', { status: res.status }))
          }
          stopBusy()
          setLoadingHint(null)
          return
        }
      }
      if (!res.ok) {
        setError(data.error ?? t('errors.registerFailed'))
        stopBusy()
        setLoadingHint(null)
        return
      }
      if (data.url) {
        setLoadingHint(t('forms.zaakToevoegen.redirecting'))
        window.location.assign(data.url)
        return
      }
      setLoadingHint(t('forms.zaakToevoegen.openingSearch'))
      router.push('/zoeken')
    } catch {
      setError(t('errors.connectionFailedInternet'))
      stopBusy()
      setLoadingHint(null)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="vysiongids-zaak-form vysiongids-surface-card mt-8 space-y-5 rounded-xl bg-white p-5 sm:p-6"
    >
      <p className="text-sm text-gray-600">
        Velden met <span className="vysiongids-form-required" aria-hidden>*</span> zijn verplicht.
      </p>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <RequiredLabel htmlFor="name">{t('forms.zaakToevoegen.nameLabel')}</RequiredLabel>
        <TitleCaseTextInput
          id="name"
          name="name"
          required
          minLength={3}
          placeholder={t('forms.zaakToevoegen.namePlaceholder')}
          className="vysiongids-form-input mt-1"
        />
      </div>

      <div>
        <RequiredLabel htmlFor="pin">{t('forms.zaakToevoegen.pinLabel')}</RequiredLabel>
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

      <div>
        <p className="vysiongids-form-label">
          Type zaak (meerdere mogelijk)
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </p>
        <HorecaTypesCheckboxGroup disabled={busy} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 sm:max-w-md">
          <RequiredLabel htmlFor="province">{t('common.province')}</RequiredLabel>
          <select id="province" name="province" required className="vysiongids-form-input mt-1" defaultValue="">
            <option value="" disabled>
              Kies provincie
            </option>
            {BELGIUM_PROVINCES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {localizedProvinceLabel(p.slug, t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <KitchenTypeSelect />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <RequiredLabel htmlFor="city">{t('beheer.editForm.cityLabel')}</RequiredLabel>
          <TitleCaseTextInput id="city" name="city" required className="vysiongids-form-input mt-1" />
        </div>
        <div>
          <RequiredLabel htmlFor="postcode">{t('beheer.editForm.postcodeLabel')}</RequiredLabel>
          <input id="postcode" name="postcode" required className="vysiongids-form-input mt-1" />
        </div>
      </div>

      <div>
        <RequiredLabel htmlFor="address">{t('beheer.editForm.addressLabel')}</RequiredLabel>
        <TitleCaseTextInput id="address" name="address" required className="vysiongids-form-input mt-1" />
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="phone">
          Telefoon
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder={t('beheer.editForm.phonePlaceholder')}
          className="vysiongids-form-input mt-1"
        />
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="email">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="email" className="vysiongids-form-input mt-1" />
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="website">
          Website
        </label>
        <input
          id="website"
          name="website"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder={t('forms.zaakToevoegen.websitePlaceholder')}
          className="vysiongids-form-input mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">{t('forms.zaakToevoegen.websiteHintHttps')}</p>
      </div>

      <div>
        <label className="vysiongids-form-label" htmlFor="orderUrl">
          Bestel of reserveer-URL
        </label>
        <input
          id="orderUrl"
          name="orderUrl"
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder={t('forms.zaakToevoegen.orderUrlPlaceholder')}
          className="vysiongids-form-input mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">
          Leeg laten = de website-link wordt gebruikt voor «Bestel».
        </p>
      </div>

      <ListingMenuOwnerFields idPrefix="register" disabled={busy} />

      <div>
        <p className="vysiongids-form-label">
          Openingstijden per dag
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </p>
        <OpeningHoursEditor onPayloadChange={onHoursPayloadChange} />
        <OpeningScheduleExtrasEditor />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="vysiongids-form-label" htmlFor="deliveryFeeEur">
            Leveringskosten (€)
          </label>
          <input
            id="deliveryFeeEur"
            name="deliveryFeeEur"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            placeholder={t('forms.zaakToevoegen.deliveryFeePlaceholder')}
            className="vysiongids-form-input mt-1"
          />
        </div>
        <div>
          <label className="vysiongids-form-label" htmlFor="minOrderEur">
            Minimum bestelbedrag (€)
          </label>
          <input
            id="minOrderEur"
            name="minOrderEur"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            placeholder={t('common.optional')}
            className="vysiongids-form-input mt-1"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="vysiongids-form-label" htmlFor="pickupTimeMin">
            Afhaaltijd vanaf (min)
          </label>
          <input
            id="pickupTimeMin"
            name="pickupTimeMin"
            type="number"
            inputMode="numeric"
            min={1}
            max={180}
            placeholder={t('beheer.editForm.pickupPlaceholderExample')}
            className="vysiongids-form-input mt-1"
          />
        </div>
        <div>
          <label className="vysiongids-form-label" htmlFor="pickupTimeMax">
            Afhaaltijd tot (min)
          </label>
          <input
            id="pickupTimeMax"
            name="pickupTimeMax"
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            placeholder={t('beheer.editForm.pickupMaxPlaceholderExample')}
            className="vysiongids-form-input mt-1"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="vysiongids-form-label" htmlFor="deliveryTimeMin">
            Levertijd vanaf (min)
          </label>
          <input
            id="deliveryTimeMin"
            name="deliveryTimeMin"
            type="number"
            inputMode="numeric"
            min={1}
            max={180}
            placeholder={t('common.optional')}
            className="vysiongids-form-input mt-1"
          />
        </div>
        <div>
          <label className="vysiongids-form-label" htmlFor="deliveryTimeMax">
            Levertijd tot (min)
          </label>
          <input
            id="deliveryTimeMax"
            name="deliveryTimeMax"
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            placeholder={t('common.optional')}
            className="vysiongids-form-input mt-1"
          />
        </div>
      </div>

      <DeliveryRadiusKmField />

      <div>
        <p className="vysiongids-form-label">
          Foto&apos;s
          <span className="vysiongids-form-required" aria-hidden>
            *
          </span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          Minstens 1 foto, tot max. 3. Grote foto&apos;s van je telefoon verkleinen we automatisch.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {[0, 1, 2].map((i) => (
            <PhotoPickField key={i} index={i} required={i === 0} disabled={busy} />
          ))}
        </div>
      </div>

      <ListingOwnerOptionsFields />

      <BeheerInfoExtrasFields disabled={busy} />

      <button
        type="submit"
        disabled={busy}
        className="vysiongids-form-submit w-full rounded-xl bg-accent py-3.5 text-lg font-bold text-white hover:bg-accent/90 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {busy ? (
          <GidsButtonLoadingContent label={loadingHint ?? 'Bezig…'} />
        ) : (
          t('forms.zaakToevoegen.submit')
        )}
      </button>
      <GidsPageLoadingOverlay open={busy} message={loadingHint ?? t('forms.zaakToevoegen.overlayDefault')} />
    </form>
  )
}
