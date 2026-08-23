'use client'

import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

import { GIDS_CONTACT } from '@/lib/gids-contact'
import { useLanguage } from '@/i18n/LanguageProvider'

type Props = {
  open: boolean
  onClose: () => void
}

export default function GidsContactModal({ open, onClose }: Props) {
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

  if (!open) return null

  const panel = (
    <div className="vysiongids-job-modal-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div
        className="vysiongids-job-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
        <h2 id={titleId} className="vysiongids-job-modal-title">
          {t('modals.contact.title')}
        </h2>
        <address className="vysiongids-job-modal-address not-italic">
          {GIDS_CONTACT.street}
          <br />
          {GIDS_CONTACT.cityLine}
        </address>
        <dl className="vysiongids-job-modal-body mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-gray-600">{t('modals.contact.emailLabel')}</dt>
            <dd className="mt-0.5">
              <a href={`mailto:${GIDS_CONTACT.email}`} className="font-semibold text-accent hover:underline">
                {GIDS_CONTACT.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-600">{t('modals.contact.phoneLabel')}</dt>
            <dd className="mt-0.5">
              <a href={`tel:${GIDS_CONTACT.phoneTel}`} className="font-semibold text-accent hover:underline">
                {GIDS_CONTACT.phoneDisplay}
              </a>
            </dd>
          </div>
        </dl>
        <div className="vysiongids-contact-modal-actions">
          <a
            href={`mailto:${GIDS_CONTACT.email}`}
            className="vysiongids-contact-modal-btn"
            onClick={onClose}
          >
            {t('modals.contact.mailUs')}
          </a>
          <a href={`tel:${GIDS_CONTACT.phoneTel}`} className="vysiongids-contact-modal-btn" onClick={onClose}>
            {t('modals.contact.callUs')}
          </a>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
