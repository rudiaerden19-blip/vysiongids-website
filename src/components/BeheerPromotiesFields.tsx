'use client'

import { useEffect, useRef, useState } from 'react'
import type { Listing } from '@/lib/listing-types'
import SentenceCaseTextarea from '@/components/SentenceCaseTextarea'
import TitleCaseTextInput from '@/components/TitleCaseTextInput'
import {
  formatPromotionPriceDisplay,
  MAX_PROMOTION_OFFER_ROWS,
} from '@/lib/listing-promotion-offers'

function PromotionPhotoField({
  existingUrl,
  disabled,
  removeChecked,
  onRemoveChange,
}: {
  existingUrl?: string
  disabled?: boolean
  removeChecked: boolean
  onRemoveChange: (checked: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const id = 'promotionPhoto0'

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  const showExisting = existingUrl && !localPreviewUrl && !removeChecked

  return (
    <div className="vysiongids-beheer-promo-photo">
      <label className="vysiongids-form-label text-sm" htmlFor={id}>
        Foto van je actie (optioneel)
      </label>
      {localPreviewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={localPreviewUrl}
          alt=""
          className="mt-2 aspect-[4/3] w-full max-w-md rounded-lg border border-gray-200 object-cover"
        />
      ) : showExisting ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={existingUrl}
          alt=""
          className="mt-2 aspect-[4/3] w-full max-w-md rounded-lg border border-gray-200 object-cover"
        />
      ) : (
        <div
          className="mt-2 flex aspect-[4/3] w-full max-w-md items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-500"
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
          if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
          setLocalPreviewUrl(f ? URL.createObjectURL(f) : null)
          if (f) onRemoveChange(false)
        }}
      />
      <input type="hidden" name="removePromotionPhoto0" value={removeChecked ? '1' : '0'} />
      <button
        type="button"
        className="vysiongids-photo-pick-btn mt-2 text-sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {existingUrl || localPreviewUrl ? 'Vervang foto' : 'Kies foto'}
      </button>
      <p className="mt-1 text-xs text-gray-500" aria-live="polite">
        {localPreviewUrl ? 'Nieuwe foto — klik «Wijzigingen opslaan» om te publiceren' : showExisting ? 'Huidige foto' : null}
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

export default function BeheerPromotiesFields({ listing, disabled }: Props) {
  const promo = listing?.infoExtras?.promotion
  const [removePhoto, setRemovePhoto] = useState(false)

  return (
    <section className="vysiongids-beheer-promo-card vysiongids-surface-card mt-8 rounded-xl bg-sky-50/80 p-5">
      <h3 className="text-lg font-bold text-gray-900">Promoties</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        Zet een actie op je zaakpagina (INFO): bv. «1 menu kopen, 1 cola gratis». Voeg een korte tekst en optioneel een
        foto toe.
      </p>
      <label className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-800">
        <input type="checkbox" name="infoPromotionEnabled" defaultChecked={promo?.enabled} disabled={disabled} />
        Promotie tonen op mijn zaakpagina
      </label>
      <label className="vysiongids-form-label mt-4 text-sm" htmlFor="infoPromotionText">
        Tekst van je promotie
      </label>
      <SentenceCaseTextarea
        id="infoPromotionText"
        name="infoPromotionText"
        rows={3}
        maxLength={500}
        defaultValue={promo?.text ?? ''}
        disabled={disabled}
        className="vysiongids-form-input mt-1 w-full max-w-2xl text-sm"
        placeholder="Bv. 1 menu kopen, 1 cola gratis — geldig t.e.m. einde maand."
      />
      <div className="mt-5">
        <p className="vysiongids-form-label text-sm">Promotieprijzen (optioneel, max. 3)</p>
        <p className="mt-0.5 text-xs text-gray-500">Bv. productnaam en actieprijs — zichtbaar in de promotie-popup en op INFO.</p>
        <ul className="vysiongids-beheer-promo-offers mt-3 space-y-3">
          {Array.from({ length: MAX_PROMOTION_OFFER_ROWS }, (_, i) => {
            const row = promo?.offers?.[i]
            const priceDefault =
              row?.priceEur != null && Number.isFinite(row.priceEur)
                ? row.priceEur.toFixed(2).replace('.', ',')
                : ''
            return (
              <li key={i} className="vysiongids-beheer-promo-offer-row">
                <div className="vysiongids-beheer-promo-offer-field">
                  <label className="vysiongids-form-label text-xs" htmlFor={`infoPromotionOfferLabel${i}`}>
                    Product {i + 1}
                  </label>
                  <TitleCaseTextInput
                    id={`infoPromotionOfferLabel${i}`}
                    name={`infoPromotionOfferLabel${i}`}
                    maxLength={80}
                    defaultValue={row?.label ?? ''}
                    disabled={disabled}
                    className="vysiongids-form-input mt-1 w-full text-sm"
                    placeholder="Bv. Sito"
                  />
                </div>
                <div className="vysiongids-beheer-promo-offer-field vysiongids-beheer-promo-offer-field--price">
                  <label className="vysiongids-form-label text-xs" htmlFor={`infoPromotionOfferPrice${i}`}>
                    Prijs (€)
                  </label>
                  <input
                    id={`infoPromotionOfferPrice${i}`}
                    name={`infoPromotionOfferPrice${i}`}
                    type="text"
                    inputMode="decimal"
                    defaultValue={priceDefault}
                    disabled={disabled}
                    className="vysiongids-form-input mt-1 w-full text-sm"
                    placeholder={formatPromotionPriceDisplay(2.5) || '2,50'}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      <PromotionPhotoField
        existingUrl={promo?.imageUrl}
        disabled={disabled}
        removeChecked={removePhoto}
        onRemoveChange={setRemovePhoto}
      />
    </section>
  )
}
