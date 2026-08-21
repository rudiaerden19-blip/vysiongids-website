import Link from 'next/link'
import { Suspense } from 'react'
import SiteHeader from '@/components/SiteHeader'
import DienstenZoekenClient from '@/components/DienstenZoekenClient'
import { loadDienstenListings } from '@/lib/listings-diensten'

export const metadata = { title: 'Publiciteit en diensten' }

export default async function DienstenPage() {
  const listings = await loadDienstenListings()

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap">
        <h1 className="vysiongids-diensten-page-title">Publiciteit en diensten</h1>
        <p className="vysiongids-diensten-page-lead">
          Heb je een onderneming die diensten verkoopt, bijv. kassasystemen, horecameubilair, inrichting horeca, of ben
          je een groothandel of leverancier? Dan zit je hier op de juiste plek. Met een zaakprofiel val je als verkoper
          20× meer op.
        </p>
        <p className="vysiongids-diensten-page-cta-wrap">
          <Link href="/diensten/aanmelden" className="vysiongids-header-nav-cta vysiongids-diensten-page-cta">
            Jouw dienstenprofiel toevoegen — €99/jaar
          </Link>
        </p>

        <Suspense fallback={<p className="text-gray-600">Zoeken laden…</p>}>
          <DienstenZoekenClient initialListings={listings} />
        </Suspense>
      </main>
    </>
  )
}
