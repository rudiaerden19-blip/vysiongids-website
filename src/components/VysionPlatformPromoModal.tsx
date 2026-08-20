'use client'

import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

export type VysionPlatformPromoKind = 'order' | 'reservations'

const CONFIG: Record<
  VysionPlatformPromoKind,
  { title: string; body: string; cta: string; href: string }
> = {
  order: {
    title: 'Online bestelplatform',
    body:
      'Indien u lid bent van Vysiongids, betaalt u niet €49 per maand voor het online bestelplatform, maar €49 per jaar.',
    cta: 'Ga naar het online bestelplatform',
    href: 'https://www.vysionorder.com',
  },
  reservations: {
    title: 'Restaurantreserveringen',
    body:
      'Indien u lid bent van Vysiongids, betaalt u niet €49 per maand voor het restaurantreserveringsplatform, maar €49 per jaar.',
    cta: 'Ga naar de reserveringssoftware',
    href: 'https://www.tablevysion.com',
  },
}

type Props = {
  kind: VysionPlatformPromoKind | null
  open: boolean
  onClose: () => void
}

export default function VysionPlatformPromoModal({ kind, open, onClose }: Props) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
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
  }, [open, onClose])

  if (!open || !kind) return null

  const { title, body, cta, href } = CONFIG[kind]

  const panel = (
    <div className="vysiongids-platform-promo-modal-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label="Sluiten" onClick={onClose} />
      <div
        className="vysiongids-job-modal-panel vysiongids-platform-promo-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label="Sluiten">
          ×
        </button>
        <p className="vysiongids-job-modal-kicker">Voor leden van Vysiongids</p>
        <h2 id={titleId} className="vysiongids-job-modal-title">
          {title}
        </h2>
        <p className="vysiongids-platform-promo-modal-text">{body}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="vysiongids-platform-promo-modal-cta"
          onClick={onClose}
        >
          {cta}
        </a>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
