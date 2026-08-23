'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useEffect, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'

type Photo = { publicUrl: string }

type Props = {
  open: boolean
  photos: Photo[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export default function ZoekertjePhotoLightbox({ open, photos, index, onIndexChange, onClose }: Props) {
  const { t } = useLanguage()
  const total = photos.length
  const current = photos[index]

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && total > 1) onIndexChange((index - 1 + total) % total)
      if (e.key === 'ArrowRight' && total > 1) onIndexChange((index + 1) % total)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, index, total, onClose, onIndexChange])

  if (!open || !current) return null

  function goPrev(e: MouseEvent) {
    e.stopPropagation()
    if (total <= 1) return
    onIndexChange((index - 1 + total) % total)
  }

  function goNext(e: MouseEvent) {
    e.stopPropagation()
    if (total <= 1) return
    onIndexChange((index + 1) % total)
  }

  const panel = (
    <div className="vysiongids-zoekertje-lightbox" role="dialog" aria-modal="true" aria-label="Foto vergroten">
      <button type="button" className="vysiongids-zoekertje-lightbox-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <button type="button" className="vysiongids-zoekertje-lightbox-close" onClick={onClose} aria-label={t('common.close')}>
        ×
      </button>
      {total > 1 ? (
        <>
          <button type="button" className="vysiongids-zoekertje-lightbox-nav vysiongids-zoekertje-lightbox-nav--prev" onClick={goPrev} aria-label="Vorige foto">
            ‹
          </button>
          <button type="button" className="vysiongids-zoekertje-lightbox-nav vysiongids-zoekertje-lightbox-nav--next" onClick={goNext} aria-label="Volgende foto">
            ›
          </button>
          <p className="vysiongids-zoekertje-lightbox-counter">
            {index + 1} / {total}
          </p>
        </>
      ) : null}
      <div className="vysiongids-zoekertje-lightbox-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.publicUrl} alt="" className="vysiongids-zoekertje-lightbox-img" />
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
