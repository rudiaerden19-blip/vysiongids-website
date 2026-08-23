import { Suspense } from 'react'
import SiteHeader from '@/components/SiteHeader'
import BeheerChangePinPanel from '@/components/BeheerChangePinPanel'
import { BeheerFormSkeleton } from '@/components/BeheerFormSkeleton'
import { BeheerListingAndExtras } from '@/components/BeheerListingAndExtras'
import { BeheerAuthFallback } from '@/components/BeheerClientExtras'
import { BeheerLoggedInHeader } from '@/components/BeheerPageIntroServer'
import { BeheerViewsStatsServer } from '@/components/BeheerViewsStatsServer'
import BeheerChatUnderViews from '@/components/BeheerChatUnderViews'
import { tServer } from '@/i18n/server-translate'
import { loadBeheerPageShell } from '@/lib/gids-beheer-server'

export async function generateMetadata() {
  return { title: await tServer('meta.pages.beheer') }
}

export const dynamic = 'force-dynamic'

export default async function BeheerPage() {
  const shell = await loadBeheerPageShell()
  const pageTitle = await tServer('beheer.pageTitle')

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <div className="mt-6 space-y-8">
          {!shell.authenticated || !shell.slug || !shell.name || !shell.listingId ? (
            <BeheerAuthFallback />
          ) : (
            <>
              <BeheerLoggedInHeader
                name={shell.name}
                slug={shell.slug}
                listingSegment={shell.listingSegment}
              />
              <BeheerChangePinPanel
                businessName={shell.name}
                variant={shell.pinMustChange ? 'firstLogin' : 'beheer'}
              />
              <BeheerViewsStatsServer slug={shell.slug} />
              <Suspense fallback={null}>
                <BeheerChatUnderViews />
              </Suspense>
              {!shell.pinMustChange ? (
                <Suspense fallback={<BeheerFormSkeleton />}>
                  <BeheerListingAndExtras listingId={shell.listingId} />
                </Suspense>
              ) : null}
            </>
          )}
        </div>
      </main>
    </>
  )
}
