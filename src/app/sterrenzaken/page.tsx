import SiteHeader from '@/components/SiteHeader'

export const metadata = { title: 'Sterrenzaken' }

export default function SterrenzakenPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Sterrenzaken</h1>
        <p className="mt-4 text-gray-600">
          Topbeoordeelde zaken in de gids — binnenkort een apart overzicht. Tot die tijd: zoek op stad of
          provincie.
        </p>
      </main>
    </>
  )
}
