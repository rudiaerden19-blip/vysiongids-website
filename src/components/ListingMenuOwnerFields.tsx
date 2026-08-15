'use client'

import { useRef, useState } from 'react'

type Props = {
  idPrefix: string
  defaultMenuUrl?: string
  existingMenuPdfUrl?: string
  disabled?: boolean
}

/** Onder «Bestel-URL»: menu-link en/of PDF-upload. */
export default function ListingMenuOwnerFields({
  idPrefix,
  defaultMenuUrl = '',
  existingMenuPdfUrl,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pdfLabel, setPdfLabel] = useState<string | null>(null)
  const [removePdf, setRemovePdf] = useState(false)
  const menuUrlId = `${idPrefix}-menuUrl`
  const menuPdfId = `${idPrefix}-menuPdf`

  return (
    <div className="vysiongids-form-menu-block">
      <p className="vysiongids-form-label">Menu</p>
      <p className="mb-2 text-xs text-gray-500">
        Of bouw je volledige menu (categorieën & producten) via{' '}
        <a href="/beheer/menu" className="font-semibold text-accent hover:underline">
          Menu beheren
        </a>
        . PDF/link hieronder is optioneel.
      </p>

      <label className="vysiongids-form-label mt-2 block text-sm" htmlFor={menuUrlId}>
        Menu-link (URL)
      </label>
      <input
        id={menuUrlId}
        name="menuUrl"
        type="text"
        inputMode="url"
        autoComplete="url"
        defaultValue={defaultMenuUrl}
        disabled={disabled}
        placeholder="https://jouwshop.be/menu"
        className="vysiongids-form-input mt-1"
      />

      <label className="vysiongids-form-label mt-3 block text-sm" htmlFor={menuPdfId}>
        Menu als PDF
      </label>
      {existingMenuPdfUrl && !pdfLabel && !removePdf ? (
        <p className="mt-1 text-sm text-gray-600">
          Huidig menu:{' '}
          <a href={existingMenuPdfUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-accent">
            PDF bekijken
          </a>
        </p>
      ) : null}
      <input
        ref={inputRef}
        id={menuPdfId}
        name="menuPdf"
        type="file"
        accept="application/pdf,.pdf"
        disabled={disabled}
        className="vysiongids-photo-pick-input"
        onChange={(e) => {
          const f = e.target.files?.[0]
          setPdfLabel(f ? f.name : null)
          if (f) setRemovePdf(false)
        }}
      />
      <input type="hidden" name="removeMenuPdf" value={removePdf ? '1' : '0'} />
      <button
        type="button"
        className="vysiongids-photo-pick-btn mt-2"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {existingMenuPdfUrl ? 'Vervang menu-PDF' : 'Kies PDF'}
      </button>
      <p className="vysiongids-photo-pick-hint" aria-live="polite">
        {pdfLabel ?? (existingMenuPdfUrl && !removePdf ? 'Huidige PDF blijft staan' : 'Geen PDF')}
      </p>
      {existingMenuPdfUrl ? (
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={removePdf}
            disabled={disabled}
            onChange={(e) => setRemovePdf(e.target.checked)}
          />
          Menu-PDF verwijderen
        </label>
      ) : null}
      <p className="mt-2 text-xs text-gray-500">PDF max. 12 MB. Een PDF heeft voorrang op de menu-link.</p>
    </div>
  )
}
