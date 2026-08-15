'use client'

import type { Listing } from '@/lib/listing-types'
import { formatListingDailyViewCount, listingDailyViewCount } from '@/lib/gids-listing-daily-views'
import { getListingOpenStatus } from '@/lib/listing-info'
import { useEffect, useState } from 'react'

const REFRESH_MS = 60_000

export default function ListingPanelOpenStatus({ listing }: { listing: Listing }) {
  const [status, setStatus] = useState(() => getListingOpenStatus(listing))
  const [views, setViews] = useState(() => listingDailyViewCount(listing.slug))

  useEffect(() => {
    const refresh = () => {
      setStatus(getListingOpenStatus(listing))
      setViews(listingDailyViewCount(listing.slug))
    }
    refresh()
    const id = window.setInterval(refresh, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [listing])

  return (
    <div className="vysiongids-listing-panel-status-col">
      <p
        className={`vysiongids-listing-open-status ${status.isOpen ? 'is-open' : 'is-closed'}`}
        aria-live="polite"
      >
        {status.label}
      </p>
      <p className="vysiongids-listing-daily-views" aria-label={`Vandaag ${views} keer bekeken`}>
        Uw zaak is vandaag{' '}
        <span className="vysiongids-listing-daily-views-count">{formatListingDailyViewCount(views)}</span> keer
        bekeken
      </p>
    </div>
  )
}
