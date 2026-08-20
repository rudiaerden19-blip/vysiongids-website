import { Suspense } from 'react'
import SiteHeader from '@/components/SiteHeader'
import JobsPageClient from '@/components/JobsPageClient'
import { listingHiringIsActive } from '@/lib/listing-hiring'
import { getAllListings } from '@/lib/listings'

export const metadata = { title: 'Jobs' }

export const revalidate = 60

export default async function JobsPage() {
  const listings = (await getAllListings()).filter((l) => listingHiringIsActive(l.infoExtras?.hiring))

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap">
        <h1 className="vysiongids-jobs-page-title">Jobs</h1>
        <p className="vysiongids-jobs-page-lead">
          Vacatures bij horeca in België — solliciteer rechtstreeks bij de zaak.
        </p>
        <Suspense fallback={<p className="vysiongids-jobs-empty">Vacatures laden…</p>}>
          <JobsPageClient listings={listings} />
        </Suspense>
      </main>
    </>
  )
}
