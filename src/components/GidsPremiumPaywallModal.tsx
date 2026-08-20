'use client'

import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { GIDS_PREMIUM_YEARLY_EUR, gidsPremiumSubscribeMailtoHref } from '@/lib/gids-premium'

type Props = {
  open: boolean
  onClose: () => void
  listingName?: string
}

export default function GidsPremiumPaywallModal({ open, onClose, listingName }: Props) {
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

  if (!open) return null

  const mailHref = gidsPremiumSubscribeMailtoHref(listingName)

  const panel = (
    <div className="vysiongids-job-modal-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label="Sluiten" onClick={onClose} />
      <div className="vysiongids-job-modal-panel vysiongids-premium-modal-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label="Sluiten">
          ×
        </button>
        <p className="vysiongids-job-modal-kicker">Premium</p>
        <h2 id={titleId} className="vysiongids-job-modal-title">
          Vysiongids-lidmaatschap
        </h2>
        <p className="vysiongids-premium-modal-text">
          U kunt alleen <strong>vacatures</strong> en <strong>zoekertjes</strong> plaatsen als u betalend lid bent van
          de Vysiongids. Dit kost <strong>€{GIDS_PREMIUM_YEARLY_EUR} per jaar</strong> — dan geniet u van alle
          premiumvoordelen van de gids.
        </p>
        <div className="vysiongids-job-card-actions vysiongids-job-modal-actions">
          <a href={mailHref} className="vysiongids-job-card-btn vysiongids-job-card-btn--phone">
            Premium aanvragen
          </a>
          <button type="button" className="vysiongids-job-card-btn vysiongids-job-card-btn--email" onClick={onClose}>
            Sluiten
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
