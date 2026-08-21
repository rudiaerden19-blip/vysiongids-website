'use client'

import { useState } from 'react'
import JobVacancyDetailModal from '@/components/JobVacancyDetailModal'
import ZoekertjeCardPlacedStrip from '@/components/ZoekertjeCardPlacedStrip'
import type { Listing } from '@/lib/listing-types'
import { formatListingAddressLines } from '@/lib/listing-display'
import { formatGidsSentenceText } from '@/lib/gids-text'
import {
  hiringJobTypeLabels,
  listingHiringBarTitle,
  resolveListingHiringPostedAt,
} from '@/lib/listing-hiring'

type Props = {
  listing: Listing
}

export default function JobListingCard({ listing }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const hiring = listing.infoExtras?.hiring
  if (!hiring) return null

  const title = listingHiringBarTitle(hiring)
  const postedAt = resolveListingHiringPostedAt(hiring, listing.updatedAt)
  const typeLabels = hiringJobTypeLabels(hiring.jobTypes)
  const typeLine = typeLabels.length ? typeLabels.join(' · ') : 'Type niet opgegeven'
  const { street, cityLine } = formatListingAddressLines(listing)
  const hoursRaw = hiring.hours?.trim()
  const hoursLine = hoursRaw ? formatGidsSentenceText(hoursRaw) : 'Niet opgegeven'

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
          </p>
          <div className="vysiongids-job-card-detail">
            <p
              className={
                typeLabels.length
                  ? 'vysiongids-job-card-types'
                  : 'vysiongids-job-card-types vysiongids-job-card-types--muted'
              }
            >
              {typeLine}
            </p>
            <address className="vysiongids-job-card-address">
              {street ? (
                <>
                  {street}
                  <br />
                </>
              ) : null}
              {cityLine}
            </address>
            <p className="vysiongids-job-card-hours">
              <span className="vysiongids-job-card-hours-label">Uren</span> {hoursLine}
            </p>
          </div>
          <span className="vysiongids-job-card-more">Open →</span>
        </button>
        {postedAt ? <ZoekertjeCardPlacedStrip createdAt={postedAt} /> : null}
      </article>
      <JobVacancyDetailModal listing={listing} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
