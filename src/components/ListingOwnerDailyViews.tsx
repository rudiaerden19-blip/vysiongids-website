'use client'

import { formatListingDailyViewCount, listingDailyViewCount } from '@/lib/gids-listing-daily-views'
import { useGidsOwnerSlug } from '@/lib/use-gids-owner-slug'
import { useEffect, useState } from 'react'

const REFRESH_MS = 60_000

type Props = {
  slug: string
  className?: string
}

/** Alleen voor ingelogde zaakhouder van deze slug — niet zichtbaar voor bezoekers. */
export default function ListingOwnerDailyViews({ slug, className }: Props) {
  const { ownerSlug, authChecked } = useGidsOwnerSlug()
  const [views, setViews] = useState(() => listingDailyViewCount(slug))

  useEffect(() => {
    if (ownerSlug !== slug) return
    const refresh = () => setViews(listingDailyViewCount(slug))
    refresh()
    const id = window.setInterval(refresh, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [ownerSlug, slug])

  if (!authChecked || ownerSlug !== slug) return null

  return (
    <p
      className={`vysiongids-listing-daily-views${className ? ` ${className}` : ''}`}
      aria-label={`Vandaag ${views} keer bekeken`}
    >
      Uw zaak is vandaag{' '}
      <span className="vysiongids-listing-daily-views-count">{formatListingDailyViewCount(views)}</span> keer
      bekeken
    </p>
  )
}
