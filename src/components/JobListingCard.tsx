'use client'

import { useState } from 'react'
import JobVacancyDetailModal from '@/components/JobVacancyDetailModal'
import ZoekertjeCardPlacedStrip from '@/components/ZoekertjeCardPlacedStrip'
import type { Listing } from '@/lib/listing-types'
import { listingHiringBarTitle, resolveListingHiringPostedAt } from '@/lib/listing-hiring'

type Props = {
  listing: Listing
}

export default function JobListingCard({ listing }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const hiring = listing.infoExtras?.hiring
  if (!hiring) return null

  const title = listingHiringBarTitle(hiring)
  const postedAt = resolveListingHiringPostedAt(hiring, listing.updatedAt)

  return (
    <>
      <article className="vysiongids-job-card vysiongids-job-card--clickable">
        <button
          type="button"
          className="vysiongids-job-card-open"
          onClick={() => setModalOpen(true)}
          aria-haspopup="dialog"
        >
          <h2 className="vysiongids-job-card-title">{title}</h2>
          <p className="vysiongids-job-card-zaak">
            <span className="vysiongids-job-card-zaak-name">{listing.name}</span>
            <span className="vysiongids-job-card-meta"> · {listing.city}</span>
          </p>
          <span className="vysiongids-job-card-more">Open →</span>
        </button>
        {postedAt ? <ZoekertjeCardPlacedStrip createdAt={postedAt} /> : null}
      </article>
      <JobVacancyDetailModal listing={listing} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
