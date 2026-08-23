import { Suspense } from 'react'
import SiteHeader from '@/components/SiteHeader'
import JobsPageClient from '@/components/JobsPageClient'
import { getJobListings } from '@/lib/listings'
import { tServer } from '@/i18n/server-translate'

export const metadata = { title: 'Jobs' }

export const revalidate = 60

export default async function JobsPage() {
  const listings = await getJobListings()

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap">
        <Suspense fallback={<p className="vysiongids-jobs-empty">{await tServer('jobs.pageFallbackLoading')}</p>}>
          <JobsPageClient listings={listings} />
        </Suspense>
      </main>
    </>
  )
}
