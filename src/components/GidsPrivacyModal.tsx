'use client'

import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import GidsPrivacyPolicyContent from '@/components/GidsPrivacyPolicyContent'

type Props = {
  open: boolean
  onClose: () => void
}

export default function GidsPrivacyModal({ open, onClose }: Props) {
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
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label="Sluiten" onClick={onClose} />
      <div
        className="vysiongids-job-modal-panel vysiongids-privacy-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label="Sluiten">
          ×
        </button>
        <div className="vysiongids-privacy-modal-scroll">
          <h2 id={titleId} className="vysiongids-job-modal-title">
            Privacy Policy
          </h2>
          <GidsPrivacyPolicyContent />
        </div>
        <div className="vysiongids-privacy-modal-footer">
          <button type="button" className="vysiongids-contact-modal-btn vysiongids-privacy-modal-close-btn" onClick={onClose}>
            Sluiten
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
