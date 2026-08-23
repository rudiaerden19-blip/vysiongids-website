'use client'

import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import type { Listing } from '@/lib/listing-types'
import { listingPanelPromotionActive } from '@/lib/listing-panel-promotion'

type Props = {
  listing: Listing
  open: boolean
  onClose: () => void
}

export default function ListingPromotionModal({ listing, open, onClose }: Props) {
  const titleId = useId()
  const promotion = listingPanelPromotionActive(listing.infoExtras)

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

  if (!open || !promotion) return null

  const panel = (
    <div className="vysiongids-job-modal-root vysiongids-promotion-modal-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label="Sluiten" onClick={onClose} />
      <div
        className="vysiongids-job-modal-panel vysiongids-promotion-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label="Sluiten">
          ×
        </button>
        <p className="vysiongids-job-modal-kicker">Promotie</p>
        <h2 id={titleId} className="vysiongids-job-modal-title">
          {listing.name}
        </h2>
        {promotion.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={promotion.imageUrl} alt="" className="vysiongids-promotion-modal-img" />
        ) : null}
        {promotion.text ? <p className="vysiongids-promotion-modal-text">{promotion.text}</p> : null}
        {listing.orderUrl?.trim() ? (
          <div className="vysiongids-job-card-actions vysiongids-job-modal-actions">
            <a
              href={listing.orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vysiongids-job-card-btn vysiongids-job-card-btn--email"
            >
              Bestel
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}
