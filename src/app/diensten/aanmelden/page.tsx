import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import DienstenIntroGate from '@/components/DienstenIntroGate'
import DienstenAanmeldenForm from '@/components/DienstenAanmeldenForm'

export const metadata = { title: 'Leverancier registreren' }

export default function DienstenAanmeldenPage() {
  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Jouw leveranciersprofiel toevoegen</h1>
        <p className="mt-2 text-sm text-gray-600">
          Alleen voor leveranciers en diensten — geen horecazaak.{' '}
          <Link href="/diensten" className="font-semibold text-accent hover:underline">
            Terug naar overzicht
          </Link>
        </p>
        <div className="mt-8">
          <DienstenIntroGate>
            <DienstenAanmeldenForm />
          </DienstenIntroGate>
        </div>
      </main>
    </>
  )
}
