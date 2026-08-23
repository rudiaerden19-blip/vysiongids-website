'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useEffect, useRef, useState, type SyntheticEvent } from 'react'
import type { Listing } from '@/lib/listing-types'
import { HIRING_JOB_TYPES } from '@/lib/listing-hiring'
import TitleCaseTextInput from '@/components/TitleCaseTextInput'
import SentenceCaseTextarea from '@/components/SentenceCaseTextarea'
import GidsPremiumPaywallModal from '@/components/GidsPremiumPaywallModal'
import { listingHasGidsPremium } from '@/lib/gids-premium'

function SpecialtyPhotoField({
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
  const id = `specialtyPhoto${index}`

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const showExisting = existingUrl && !localPreviewUrl && !removeChecked

  return (
    <div className="vysiongids-info-specialty-photo">
      <label className="vysiongids-form-label text-sm" htmlFor={id}>
        Foto specialiteit {index + 1}
      </label>
      {localPreviewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={localPreviewUrl}
          alt=""
          className="mt-2 aspect-[4/3] w-full rounded-lg border border-gray-200 object-cover"
        />
      ) : showExisting ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={existingUrl}
          alt=""
          className="mt-2 aspect-[4/3] w-full rounded-lg border border-gray-200 object-cover"
        />
      ) : (
        <div
          className="mt-2 flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-500"
          aria-hidden
        >
          Geen foto
        </div>
      )}
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          setFileLabel(f ? f.name : null)
          if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
          setLocalPreviewUrl(f ? URL.createObjectURL(f) : null)
          if (f) onRemoveChange(false)
        }}
      />
      <input type="hidden" name={`removeSpecialtyPhoto${index}`} value={removeChecked ? '1' : '0'} />
      <button type="button" className="vysiongids-photo-pick-btn mt-2 w-full text-sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
        {existingUrl || localPreviewUrl ? 'Vervang foto' : 'Kies foto'}
      </button>
      <p className="mt-1 text-xs text-gray-500" aria-live="polite">
        {localPreviewUrl
          ? 'Nieuwe foto — klik Opslaan om te publiceren'
          : showExisting
            ? 'Huidige foto'
            : fileLabel
              ? fileLabel
              : null}
      </p>
      {existingUrl || localPreviewUrl ? (
        <label className="mt-1 flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={removeChecked}
            disabled={disabled}
            onChange={(e) => {
              onRemoveChange(e.target.checked)
              if (e.target.checked) {
                if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
                setLocalPreviewUrl(null)
                setFileLabel(null)
                if (inputRef.current) inputRef.current.value = ''
              }
            }}
          />
          Foto verwijderen
        </label>
      ) : null}
    </div>
  )
}

type Props = {
  listing?: Listing
  disabled?: boolean
}

export default function BeheerInfoExtrasFields({ listing, disabled }: Props) {
  const { t } = useLanguage()
  const extras = listing?.infoExtras
  const specialties = extras?.specialties ?? []
  const [removeSpecialty, setRemoveSpecialty] = useState<[boolean, boolean, boolean]>([false, false, false])
  const [paywallOpen, setPaywallOpen] = useState(false)
  const isPremium = listingHasGidsPremium(listing?.premiumMember)
  const hiringLocked = !isPremium

  function guardPremium(e: SyntheticEvent) {
    if (!hiringLocked) return
    e.preventDefault()
    setPaywallOpen(true)
  }

  return (
    <fieldset className="vysiongids-owner-options mt-8 border-t border-gray-200 pt-8">
      <legend className="vysiongids-form-label text-lg font-bold text-gray-900">{t('beheer.infoExtras.legend')}</legend>
      <p className="mt-1 text-sm text-gray-500">
        Klanten zien dit als ze op <strong>{t('common.info')}</strong> tikken (ook op de zoekkaart). Alles optioneel.
      </p>

      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-900">{t('beheer.infoExtras.specialtiesTitle')}</h3>
        <p className="text-xs text-gray-500">{t('beheer.infoExtras.specialtiesHint')}</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="vysiongids-surface-card rounded-xl p-3">
              <label className="vysiongids-form-label text-sm" htmlFor={`infoSpecialtyCaption${i}`}>
                Tekst op foto
              </label>
              <TitleCaseTextInput
                id={`infoSpecialtyCaption${i}`}
                name={`infoSpecialtyCaption${i}`}
                maxLength={120}
                defaultValue={specialties[i]?.caption ?? ''}
                disabled={disabled}
                className="vysiongids-form-input mt-1 text-sm"
                placeholder={t('beheer.infoExtras.specialtyCaptionPlaceholder')}
              />
              <SpecialtyPhotoField
                index={i}
                existingUrl={specialties[i]?.imageUrl}
                disabled={disabled}
                removeChecked={removeSpecialty[i] ?? false}
                onRemoveChange={(checked) => {
                  setRemoveSpecialty((prev) => {
                    const next = [...prev] as [boolean, boolean, boolean]
                    next[i] = checked
                    return next
                  })
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="vysiongids-beheer-hiring-block"
        id="vacature-beheer"
        onClickCapture={hiringLocked ? guardPremium : undefined}
      >
        <h3 className="text-base font-semibold text-gray-900">{t('beheer.infoExtras.hiringTitle')}</h3>
        <p className="text-xs text-gray-500">
          De blauwe balk onderaan elke zoekkaart is altijd zichtbaar. Vul hier je vacature in om «Soliciteren» te tonen.
        </p>
        {hiringLocked ? (
          <p className="mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-gray-800">
            Vacatures zijn enkel voor betalende Vysiongids-leden. Gebruik bovenaan{' '}
            <strong>{t('beheer.quickNav.postVacancy')}</strong> om premium aan te vragen.
          </p>
        ) : null}
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="infoHiringEnabled"
            defaultChecked={extras?.hiring?.enabled}
            disabled={disabled || hiringLocked}
          />
          Vacature actief (zoekkaart + INFO)
        </label>
        <p className="mt-3 text-sm font-medium text-gray-800">{t('beheer.infoExtras.hiringTypeLabel')}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {HIRING_JOB_TYPES.map((type) => (
            <label key={type.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="infoHiringJobType"
                value={type.id}
                defaultChecked={extras?.hiring?.jobTypes?.includes(type.id)}
                disabled={disabled || hiringLocked}
              />
              {type.label}
            </label>
          ))}
        </div>
        <label className="vysiongids-form-label mt-3 text-sm" htmlFor="infoHiringTitle">
          Titel vacature (Jobs-pagina)
        </label>
        <TitleCaseTextInput
          id="infoHiringTitle"
          name="infoHiringTitle"
          defaultValue={extras?.hiring?.title ?? ''}
          disabled={disabled || hiringLocked}
          className="vysiongids-form-input mt-1 w-full max-w-md text-sm"
          placeholder={t('beheer.infoExtras.hiringTitlePlaceholder')}
        />
        <label className="vysiongids-form-label mt-3 text-sm" htmlFor="infoHiringText">
          Omschrijving
        </label>
        <SentenceCaseTextarea
          id="infoHiringText"
          name="infoHiringText"
          rows={4}
          defaultValue={extras?.hiring?.text ?? ''}
          disabled={disabled || hiringLocked}
          className="vysiongids-form-input mt-1 w-full text-sm"
          placeholder={t('beheer.infoExtras.hiringTextPlaceholder')}
        />
        <label className="vysiongids-form-label mt-3 text-sm" htmlFor="infoHiringHours">
          Uren
        </label>
        <SentenceCaseTextarea
          id="infoHiringHours"
          name="infoHiringHours"
          rows={2}
          defaultValue={extras?.hiring?.hours ?? ''}
          disabled={disabled || hiringLocked}
          className="vysiongids-form-input mt-1 w-full max-w-xl text-sm"
          placeholder={t('beheer.infoExtras.hiringHoursPlaceholder')}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:max-w-2xl">
          <div>
            <label className="vysiongids-form-label text-sm" htmlFor="infoHiringEmail">
              E-mail voor sollicitaties
            </label>
            <input
              id="infoHiringEmail"
              name="infoHiringEmail"
              type="email"
              defaultValue={extras?.hiring?.email ?? ''}
              disabled={disabled || hiringLocked}
              className="vysiongids-form-input mt-1 w-full text-sm"
              placeholder={t('beheer.infoExtras.hiringEmailPlaceholder')}
            />
          </div>
          <div>
            <label className="vysiongids-form-label text-sm" htmlFor="infoHiringPhone">
              Telefoon voor sollicitaties
            </label>
            <input
              id="infoHiringPhone"
              name="infoHiringPhone"
              type="tel"
              defaultValue={extras?.hiring?.phone ?? ''}
              disabled={disabled || hiringLocked}
              className="vysiongids-form-input mt-1 w-full text-sm"
              placeholder={t('beheer.infoExtras.hiringPhonePlaceholder')}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-gray-900">{t('beheer.infoExtras.giftTitle')}</h3>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" name="infoGiftEnabled" defaultChecked={extras?.giftCard?.enabled} disabled={disabled} />
          Cadeaubon-sectie tonen
        </label>
        <SentenceCaseTextarea
          name="infoGiftIntro"
          rows={2}
          defaultValue={extras?.giftCard?.intro ?? ''}
          disabled={disabled}
          className="vysiongids-form-input mt-2 w-full text-sm"
          placeholder={t('beheer.infoExtras.giftIntroPlaceholder')}
        />
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="vysiongids-form-label text-sm" htmlFor="infoGiftOrderUrl">
              Link cadeaubon bestellen
            </label>
            <input
              id="infoGiftOrderUrl"
              name="infoGiftOrderUrl"
              type="url"
              defaultValue={extras?.giftCard?.orderUrl ?? ''}
              disabled={disabled}
              className="vysiongids-form-input mt-1 text-sm"
              placeholder={t('beheer.infoExtras.giftUrlPlaceholder')}
            />
          </div>
          <div>
            <label className="vysiongids-form-label text-sm" htmlFor="infoGiftValueEur">
              Waarde op kaart (€)
            </label>
            <input
              id="infoGiftValueEur"
              name="infoGiftValueEur"
              type="text"
              inputMode="decimal"
              defaultValue={extras?.giftCard?.valueEur ?? ''}
              disabled={disabled}
              className="vysiongids-form-input mt-1 text-sm"
              placeholder="50"
            />
          </div>
        </div>
      </div>
      <GidsPremiumPaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        listingName={listing?.name}
      />
    </fieldset>
  )
}
