'use client'

import Link from 'next/link'
import { useState } from 'react'
import JobVacancyDetailModal from '@/components/JobVacancyDetailModal'
import type { Listing } from '@/lib/listing-types'
import { listingHiringBarTitle } from '@/lib/listing-hiring'

type Props = {
  listing: Listing
}

export default function JobListingCard({ listing }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const hiring = listing.infoExtras?.hiring
  if (!hiring) return null

  const title = listingHiringBarTitle(hiring)
  const hasDetails = Boolean(hiring.text?.trim())

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
            <span className="vysiongids-job-card-zaak-link">{listing.name}</span>
            <span className="vysiongids-job-card-meta"> · {listing.city}</span>
          </p>
          <span className="vysiongids-job-card-more">{hasDetails ? 'Klik voor vacature →' : 'Klik voor contact →'}</span>
        </button>
        <Link
          href={`/zaak/${listing.slug}#vacature`}
          className="vysiongids-job-card-profile-link"
          onClick={(e) => e.stopPropagation()}
        >
          Zaakpagina
        </Link>
      </article>
      <JobVacancyDetailModal listing={listing} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
