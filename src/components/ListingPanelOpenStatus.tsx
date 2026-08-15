'use client'

import type { Listing } from '@/lib/listing-types'
import { getListingOpenStatus } from '@/lib/listing-info'
import { useEffect, useState } from 'react'

export default function ListingPanelOpenStatus({ listing }: { listing: Listing }) {
  const [status, setStatus] = useState(() => getListingOpenStatus(listing))

  useEffect(() => {
    setStatus(getListingOpenStatus(listing))
    const id = window.setInterval(() => setStatus(getListingOpenStatus(listing)), 60_000)
    return () => window.clearInterval(id)
  }, [listing])

  return (
    <p
      className={`vysiongids-listing-open-status ${status.isOpen ? 'is-open' : 'is-closed'}`}
      aria-live="polite"
    >
      {status.label}
    </p>
  )
}
