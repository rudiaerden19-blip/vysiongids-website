'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Props = {
  pdfUrl: string
  zaakHref: string
  zaakName: string
}

export default function ListingMenuPdfViewer({ pdfUrl, zaakHref, zaakName }: Props) {
  const router = useRouter()

  return (
    <div className="vysiongids-menu-pdf-page">
      <header className="vysiongids-menu-pdf-toolbar">
        <button type="button" className="vysiongids-menu-pdf-close" onClick={() => router.back()}>
          Sluiten
        </button>
        <p className="vysiongids-menu-pdf-title">Menu · {zaakName}</p>
        <Link href={zaakHref} className="vysiongids-menu-pdf-back-link">
          Terug naar zaak
        </Link>
      </header>
      <iframe
        title={`Menu ${zaakName}`}
        src={pdfUrl}
        className="vysiongids-menu-pdf-frame"
      />
    </div>
  )
}
