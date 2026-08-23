import { Suspense } from 'react'
import SiteHeader from '@/components/SiteHeader'
import BeheerClient from '@/components/BeheerClient'
import { loadBeheerServerSession } from '@/lib/gids-beheer-server'

export const metadata = { title: 'Beheer' }

/** Sessie + listing op server — formulier meteen ingevuld na inloggen. */
export const dynamic = 'force-dynamic'

export default async function BeheerPage() {
  const serverSession = await loadBeheerServerSession()

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Zaak beheren</h1>
        <div className="mt-6">
          <Suspense fallback={<p className="text-gray-600">Bezig met laden…</p>}>
            <BeheerClient serverSession={serverSession} />
          </Suspense>
        </div>
      </main>
    </>
  )
}
