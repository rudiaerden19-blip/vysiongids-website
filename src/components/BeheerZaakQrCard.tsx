'use client'

import QRCode from 'qrcode'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { gidsListingPublicUrl } from '@/lib/gids-public-site-url'

type Props = {
  slug: string
  listingName: string
}

export default function BeheerZaakQrCard({ slug, listingName }: Props) {
  const printRegionId = useId().replace(/:/g, '')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const publicUrl = useMemo(() => gidsListingPublicUrl(slug), [slug])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !publicUrl) return
    setError(null)
    void QRCode.toCanvas(canvas, publicUrl, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(() => {
      setError('QR-code kon niet worden gemaakt.')
    })
  }, [publicUrl])

  function onPrint() {
    window.print()
  }

  async function onDownloadPng() {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `vysiongids-qr-${slug}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      setError('Download mislukt.')
    }
  }

  if (!slug.trim()) return null

  return (
    <section
      className="vysiongids-beheer-qr-card vysiongids-surface-card mt-8 rounded-xl bg-white p-5"
      aria-labelledby={`${printRegionId}-title`}
    >
      <div id={printRegionId} className="vysiongids-beheer-qr-print-target">
        <h3 id={`${printRegionId}-title`} className="text-lg font-bold text-gray-900">
          QR-code van je zaak
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Dit is jouw QR-code met de link van jouw zaak. Druk deze af en hang hem in je zaak of zet hem op je verpakking.
        </p>
        <p className="mt-3 text-sm font-semibold text-gray-800">{listingName}</p>
        <div className="vysiongids-surface-card vysiongids-beheer-qr-frame mt-4 inline-flex rounded-xl bg-white p-3">
          <canvas ref={canvasRef} role="img" aria-label={`QR-code naar ${listingName}`} />
        </div>
        <p className="vysiongids-beheer-qr-url mt-3 break-all text-xs text-gray-500">{publicUrl}</p>
      </div>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      <div className="vysiongids-beheer-qr-actions mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
          onClick={onPrint}
        >
          Afdrukken
        </button>
        <button
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          onClick={() => void onDownloadPng()}
        >
          Download PNG
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-accent px-4 py-2.5 text-sm font-semibold text-accent hover:bg-sky-50"
        >
          Link openen
        </a>
      </div>
    </section>
  )
}
