import SiteHeader from '@/components/SiteHeader'
import BeheerClient from '@/components/BeheerClient'

export const metadata = { title: 'Beheer' }

export default function BeheerPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Zaak beheren</h1>
        <BeheerClient />
      </main>
    </>
  )
}
