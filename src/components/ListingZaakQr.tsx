'use client'

import QRCode from 'qrcode'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '@/i18n/LanguageProvider'
import { gidsListingPublicUrl } from '@/lib/gids-public-site-url'

type Props = {
  slug: string
  listingName: string
  /** Canvasbreedte in px (standaard 140; compact op urenregel). */
  size?: number
}

/** Compacte zaak-QR op de zondag-regel tussen dag en uren. */
export default function ListingZaakQr({ slug, listingName, size = 140 }: Props) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)
  const publicUrl = useMemo(() => gidsListingPublicUrl(slug), [slug])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !publicUrl) return
    setError(false)
    void QRCode.toCanvas(canvas, publicUrl, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(() => setError(true))
  }, [publicUrl, size])

  if (!slug.trim()) return null

  return (
    <div className="vysiongids-zaak-info-qr" aria-hidden={error}>
      {!error ? (
        <canvas ref={canvasRef} role="img" aria-label={t('listing.qrAria', { name: listingName })} />
      ) : null}
    </div>
  )
}
