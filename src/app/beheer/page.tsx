import { Suspense } from 'react'
import SiteHeader from '@/components/SiteHeader'
import BeheerChangePinPanel from '@/components/BeheerChangePinPanel'
import BeheerOwnerViewsTop from '@/components/BeheerOwnerViewsTop'
import BeheerListingEditor from '@/components/BeheerListingEditor'
import BeheerClientExtras, { BeheerAuthFallback } from '@/components/BeheerClientExtras'
import { BeheerLoggedInHeader, BeheerMenuCardLink } from '@/components/BeheerPageIntroServer'
import { tServer } from '@/i18n/server-translate'
import { isDienstenListing } from '@/lib/listing-segment'
import { loadBeheerServerSession } from '@/lib/gids-beheer-server'

export async function generateMetadata() {
  return { title: await tServer('meta.pages.beheer') }
}

export const dynamic = 'force-dynamic'

export default async function BeheerPage() {
  const serverSession = await loadBeheerServerSession()
  const listing = serverSession.listing
  const pageTitle = await tServer('beheer.pageTitle')

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <div className="mt-6 space-y-8">
          {!serverSession.authenticated || !listing ? (
            <BeheerAuthFallback />
          ) : serverSession.pinMustChange ? (
            <>
              <BeheerLoggedInHeader listing={listing} />
              <BeheerOwnerViewsTop slug={listing.slug} />
              <BeheerChangePinPanel businessName={listing.name} variant="firstLogin" />
            </>
          ) : (
            <>
              <BeheerLoggedInHeader listing={listing} />
              <BeheerOwnerViewsTop slug={listing.slug} />
              <BeheerChangePinPanel />
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
