'use client'

import QRCode from 'qrcode'
import { useEffect, useMemo, useRef, useState } from 'react'
import { gidsListingPublicUrl } from '@/lib/gids-public-site-url'

type Props = {
  slug: string
  listingName: string
}

/** Compacte zaak-QR onder openingsuren (publieke profielpagina). */
export default function ListingZaakQr({ slug, listingName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)
  const publicUrl = useMemo(() => gidsListingPublicUrl(slug), [slug])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !publicUrl) return
    setError(false)
    void QRCode.toCanvas(canvas, publicUrl, {
      width: 140,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(() => setError(true))
  }, [publicUrl])

  if (!slug.trim()) return null

  return (
    <div className="vysiongids-zaak-info-qr" aria-hidden={error}>
      {!error ? (
        <canvas ref={canvasRef} role="img" aria-label={`QR-code naar ${listingName} op Vysiongids`} />
      ) : null}
    </div>
  )
}
