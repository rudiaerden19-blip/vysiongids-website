import { Suspense } from 'react'
import SiteHeader from '@/components/SiteHeader'
import BeheerListingEditor from '@/components/BeheerListingEditor'
import BeheerClientExtras, { BeheerAuthFallback } from '@/components/BeheerClientExtras'
import { BeheerLoggedInHeader, BeheerMenuCardLink } from '@/components/BeheerPageIntroServer'
import { isDienstenListing } from '@/lib/listing-segment'
import { loadBeheerServerSession } from '@/lib/gids-beheer-server'

export const metadata = { title: 'Beheer' }

export const dynamic = 'force-dynamic'

export default async function BeheerPage() {
  const serverSession = await loadBeheerServerSession()
  const listing = serverSession.listing

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Zaak beheren</h1>
        <div className="mt-6 space-y-8">
          {!serverSession.authenticated || !listing ? (
            <BeheerAuthFallback />
          ) : (
            <>
              <BeheerLoggedInHeader listing={listing} />
              <BeheerListingEditor initialListing={listing} />
              {!isDienstenListing(listing) ? <BeheerMenuCardLink /> : null}
              <Suspense fallback={null}>
                <BeheerClientExtras listing={listing} />
              </Suspense>
            </>
          )}
        </div>
      </main>
    </>
  )
}
