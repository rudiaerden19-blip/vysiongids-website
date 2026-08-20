'use client'

import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import ZoekertjePhotoLightbox from '@/components/ZoekertjePhotoLightbox'
import { zoekertjeCategoryLabel } from '@/lib/gids-zoekertjes-categories'
import { formatGidsZoekertjePriceDisplay } from '@/lib/gids-zoekertjes-price'
import {
  normalizeZoekertjeDescriptionInput,
  normalizeZoekertjeTitleInput,
} from '@/lib/gids-zoekertjes-text'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'

type Props = {
  zoekertje: GidsZoekertje | null
  open: boolean
  onClose: () => void
}

function detailLine(label: string, value: string | null | undefined) {
  const v = value?.trim()
  if (!v) return null
  return (
    <p className="vysiongids-zoekertje-detail-row">
      <span className="vysiongids-zoekertje-detail-label">{label}</span>
      <span className="vysiongids-zoekertje-detail-value">{v}</span>
    </p>
  )
}

export default function ZoekertjeDetailModal({ zoekertje, open, onClose }: Props) {
  const titleId = useId()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    if (!open) {
      setLightboxOpen(false)
      setLightboxIndex(0)
    }
  }, [open])

  useEffect(() => {
    if (!open || lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, lightboxOpen])

  function openPhotoAt(i: number) {
    setLightboxIndex(i)
    setLightboxOpen(true)
  }

  if (!open || !zoekertje) return null

  const z = zoekertje
  const title = normalizeZoekertjeTitleInput(z.title)
  const description = normalizeZoekertjeDescriptionInput(z.description)
  const price = formatGidsZoekertjePriceDisplay(z.price)
  const category = zoekertjeCategoryLabel(z.category)

  const panel = (
    <div className="vysiongids-job-modal-root vysiongids-zoekertje-detail-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label="Sluiten" onClick={onClose} />
      <div
        className="vysiongids-job-modal-panel vysiongids-zoekertje-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label="Sluiten">
          ×
        </button>
        <div className="vysiongids-zoekertje-detail-scroll">
          <p className="vysiongids-job-modal-kicker">Zoekertje · {category}</p>
          <h2 id={titleId} className="vysiongids-job-modal-title">
            {title}
          </h2>
          <p className="vysiongids-zoekertje-detail-zaak">
            {z.listingName} · {z.listingCity}
          </p>
          <p className="vysiongids-zoekertje-detail-price" aria-label="Prijs">
            {price}
          </p>

          {z.photos.length > 0 ? (
            <div className="vysiongids-zoekertje-detail-photos">
              {z.photos.map((p, i) => (
                <button
                  key={p.publicUrl}
                  type="button"
                  className="vysiongids-zoekertje-detail-photo"
                  onClick={() => openPhotoAt(i)}
                  aria-label={`Foto ${i + 1} vergroten`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.publicUrl} alt="" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="vysiongids-zoekertje-detail-meta">
            {detailLine('Conditie', z.condition)}
            {detailLine('Soort', z.kind)}
            {detailLine('Type', z.itemType)}
            {detailLine('Merk', z.brand)}
          </div>

          <div className="vysiongids-zoekertje-detail-desc">
            <p className="vysiongids-zoekertje-detail-label">Beschrijving</p>
            <p className="vysiongids-zoekertje-detail-description">{description}</p>
          </div>
        </div>
        <div className="vysiongids-zoekertje-detail-actions vysiongids-zoekertje-modal-actions">
          <button type="button" className="vysiongids-zoekertje-primary-btn vysiongids-zoekertje-primary-btn--wide" onClick={onClose}>
            Sluiten
          </button>
          {z.listingSlug ? (
            <Link
              href={`/zaak/${z.listingSlug}`}
              className="vysiongids-zoekertje-primary-btn vysiongids-zoekertje-primary-btn--wide vysiongids-zoekertje-primary-btn--link"
              onClick={onClose}
            >
              Naar de verkoper
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return (
    <>
      {createPortal(panel, document.body)}
      <ZoekertjePhotoLightbox
        open={lightboxOpen}
        photos={z.photos}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
