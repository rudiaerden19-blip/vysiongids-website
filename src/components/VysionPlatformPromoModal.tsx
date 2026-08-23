'use client'

import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '@/i18n/LanguageProvider'

export type VysionPlatformPromoKind = 'order' | 'reservations'

const HREF: Record<VysionPlatformPromoKind, string> = {
  order: 'https://www.vysionorder.com',
  reservations: 'https://www.tablevysion.com',
}

type Props = {
  kind: VysionPlatformPromoKind | null
  open: boolean
  onClose: () => void
}

export default function VysionPlatformPromoModal({ kind, open, onClose }: Props) {
  const { t } = useLanguage()
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

  const titleKey = kind === 'order' ? 'modals.platformPromo.orderTitle' : 'modals.platformPromo.reservationsTitle'
  const bodyKey = kind === 'order' ? 'modals.platformPromo.orderBody' : 'modals.platformPromo.reservationsBody'
  const ctaKey = kind === 'order' ? 'modals.platformPromo.orderCta' : 'modals.platformPromo.reservationsCta'
  const href = HREF[kind]

  const panel = (
    <div className="vysiongids-platform-promo-modal-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div
        className="vysiongids-job-modal-panel vysiongids-platform-promo-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
        <p className="vysiongids-job-modal-kicker">{t('modals.platformPromo.kicker')}</p>
        <h2 id={titleId} className="vysiongids-job-modal-title">
          {t(titleKey)}
        </h2>
        <p className="vysiongids-platform-promo-modal-text">{t(bodyKey)}</p>
        <p className="vysiongids-platform-promo-modal-text vysiongids-platform-promo-modal-text--highlight">
          {t(kind === 'order' ? 'modals.platformPromo.orderBodyHighlight' : 'modals.platformPromo.reservationsBodyHighlight')}
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="vysiongids-platform-promo-modal-cta"
          onClick={onClose}
        >
          {t(ctaKey)}
        </a>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
