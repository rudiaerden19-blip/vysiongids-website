import SiteHeader from '@/components/SiteHeader'
import JobListingCard from '@/components/JobListingCard'
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
        {listings.length === 0 ? (
          <p className="vysiongids-jobs-empty">Momenteel geen open vacatures in de gids.</p>
        ) : (
          <ul className="vysiongids-jobs-grid">
            {listings.map((listing) => (
              <li key={listing.slug}>
                <JobListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
