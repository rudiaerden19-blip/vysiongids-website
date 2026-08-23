'use client'

import type { Listing } from '@/lib/listing-types'
import { useLanguage } from '@/i18n/LanguageProvider'
import { getLocalizedListingOpenStatus } from '@/lib/listing-i18n'
import { useEffect, useState } from 'react'

export default function ListingPanelOpenStatus({ listing }: { listing: Listing }) {
  const { t } = useLanguage()
  const [status, setStatus] = useState(() => getLocalizedListingOpenStatus(listing, t))

  useEffect(() => {
    setStatus(getLocalizedListingOpenStatus(listing, t))
    const id = window.setInterval(() => setStatus(getLocalizedListingOpenStatus(listing, t)), 60_000)
    return () => window.clearInterval(id)
  }, [listing, t])

  return (
    <p
      className={`vysiongids-listing-open-status ${status.isOpen ? 'is-open' : 'is-closed'}`}
      aria-live="polite"
    >
      {status.label}
    </p>
  )
}
