'use client'

import { useRef, useState } from 'react'
import type { Listing } from '@/lib/listing-types'

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
  const id = `specialtyPhoto${index}`

  return (
    <div className="vysiongids-info-specialty-photo">
      <label className="vysiongids-form-label text-sm" htmlFor={id}>
        Foto specialiteit {index + 1}
      </label>
      {existingUrl && !fileLabel ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={existingUrl} alt="" className="mt-1 h-20 w-full max-w-[140px] rounded-lg object-cover" />
      ) : null}
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
          if (f) onRemoveChange(false)
        }}
      />
      <input type="hidden" name={`removeSpecialtyPhoto${index}`} value={removeChecked ? '1' : '0'} />
      <button type="button" className="vysiongids-photo-pick-btn mt-1 text-sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
        {existingUrl ? 'Vervang' : 'Kies foto'}
      </button>
      {existingUrl ? (
        <label className="mt-1 flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={removeChecked} disabled={disabled} onChange={(e) => onRemoveChange(e.target.checked)} />
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
  const extras = listing?.infoExtras
  const specialties = extras?.specialties ?? []
  const [removeSpecialty, setRemoveSpecialty] = useState<[boolean, boolean, boolean]>([false, false, false])

  return (
    <fieldset className="vysiongids-owner-options mt-8 border-t border-gray-200 pt-8">
      <legend className="vysiongids-form-label text-lg font-bold text-gray-900">Extra INFO op je zaakpagina</legend>
      <p className="mt-1 text-sm text-gray-500">
        Klanten zien dit als ze op <strong>Info</strong> tikken (ook op de zoekkaart). Alles optioneel.
      </p>

      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-900">Onze specialiteiten</h3>
        <p className="text-xs text-gray-500">Max. 3 gerechten met foto en korte tekst.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-3">
              <label className="vysiongids-form-label text-sm" htmlFor={`infoSpecialtyCaption${i}`}>
                Tekst op foto
              </label>
              <input
                id={`infoSpecialtyCaption${i}`}
                name={`infoSpecialtyCaption${i}`}
                type="text"
                maxLength={120}
                defaultValue={specialties[i]?.caption ?? ''}
                disabled={disabled}
                className="vysiongids-form-input mt-1 text-sm"
                placeholder="Bv. Onze heerlijke friet kebab"
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

      <div className="mt-8">
        <h3 className="text-base font-semibold text-gray-900">Wij zoeken personeel</h3>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" name="infoHiringEnabled" defaultChecked={extras?.hiring?.enabled} disabled={disabled} />
          Vacature tonen op INFO
        </label>
        <textarea
          name="infoHiringText"
          rows={3}
          defaultValue={extras?.hiring?.text ?? ''}
          disabled={disabled}
          className="vysiongids-form-input mt-2 w-full text-sm"
          placeholder="Bv. Wij zoeken dringend een keukenhulp"
        />
        <label className="vysiongids-form-label mt-2 text-sm" htmlFor="infoHiringPhone">
          Telefoon voor sollicitaties
        </label>
        <input
          id="infoHiringPhone"
          name="infoHiringPhone"
          type="tel"
          defaultValue={extras?.hiring?.phone ?? ''}
          disabled={disabled}
          className="vysiongids-form-input mt-1 max-w-xs text-sm"
          placeholder="0492 12 34 56"
        />
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-gray-900">Cadeaubon</h3>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" name="infoGiftEnabled" defaultChecked={extras?.giftCard?.enabled} disabled={disabled} />
          Cadeaubon-sectie tonen
        </label>
        <textarea
          name="infoGiftIntro"
          rows={2}
          defaultValue={extras?.giftCard?.intro ?? ''}
          disabled={disabled}
          className="vysiongids-form-input mt-2 w-full text-sm"
          placeholder="Bestel een cadeaubon en verras iemand met een heerlijke maaltijd."
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
              placeholder="https://…"
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
    </fieldset>
  )
}
