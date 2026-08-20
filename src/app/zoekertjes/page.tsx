import { Suspense } from 'react'
import ZoekertjesPageClient from '@/components/ZoekertjesPageClient'
import SiteHeader from '@/components/SiteHeader'
import { getCachedPublishedGidsZoekertjesBrowse } from '@/lib/gids-zoekertjes-public-cache'

export const metadata = { title: 'Zoekertjes' }
export const revalidate = 60

export default async function ZoekertjesPage() {
  const cached = await getCachedPublishedGidsZoekertjesBrowse()
  const initialZoekertjes = cached?.zoekertjes ?? []
  const initialSetupRequired = cached?.setupRequired === true
  const initialLoadError =
    cached === null ? 'Zoekertjes laden mislukt (database niet bereikbaar).' : null

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap">
        <Suspense fallback={<p className="vysiongids-jobs-empty">Laden…</p>}>
          <ZoekertjesPageClient
            initialZoekertjes={initialZoekertjes}
            initialSetupRequired={initialSetupRequired}
            initialLoadError={initialLoadError}
          />
        </Suspense>
      </main>
    </>
  )
}
