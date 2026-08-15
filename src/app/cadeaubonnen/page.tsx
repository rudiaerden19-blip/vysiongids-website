import SiteHeader from '@/components/SiteHeader'

export const metadata = { title: 'Cadeaubonnen' }

export default function CadeaubonnenPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Cadeaubonnen</h1>
        <p className="mt-4 text-gray-600">
          Cadeaubonnen per zaak volgen later. Vraag bij je favoriete zaak naar hun cadeauformule.
        </p>
      </main>
    </>
  )
}
