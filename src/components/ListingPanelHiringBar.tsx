'use client'

import { useState } from 'react'
import JobVacancyDetailModal from '@/components/JobVacancyDetailModal'
import type { Listing } from '@/lib/listing-types'

type Props = {
  listing: Listing
  message: string
  active: boolean
}

export default function ListingPanelHiringBar({ listing, message, active }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div
        className={`vysiongids-listing-panel-hiring${active ? ' vysiongids-listing-panel-hiring--active' : ' vysiongids-listing-panel-hiring--empty'}`}
      >
        <div className="vysiongids-listing-panel-hiring-inner">
          <div className="vysiongids-listing-panel-hiring-copy">
            <span className="vysiongids-listing-panel-hiring-text">{message}</span>
          </div>
          {active ? (
            <div className="vysiongids-listing-panel-hiring-btn-wrap">
              <button
                type="button"
                className="vysiongids-listing-panel-hiring-btn"
                onClick={() => setModalOpen(true)}
              >
                Open
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {active ? (
        <JobVacancyDetailModal listing={listing} open={modalOpen} onClose={() => setModalOpen(false)} />
      ) : null}
    </>
  )
}
