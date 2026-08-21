'use client'

import { createPortal } from 'react-dom'
import GidsLoadingSpinner from '@/components/GidsLoadingSpinner'

type Props = {
  open: boolean
  message?: string
}

export default function GidsPageLoadingOverlay({ open, message = 'Even geduld…' }: Props) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="gids-page-loading-overlay" aria-live="polite" aria-busy="true">
      <div className="gids-page-loading-overlay-card">
        <GidsLoadingSpinner size={44} variant="onLight" />
        <p className="gids-page-loading-overlay-text">{message}</p>
      </div>
    </div>,
    document.body,
  )
}
