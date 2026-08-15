'use client'

import { formatListingDailyViewCount, listingDailyViewCount } from '@/lib/gids-listing-daily-views'
import { useGidsOwnerSlug } from '@/lib/use-gids-owner-slug'
import { useEffect, useState } from 'react'

const REFRESH_MS = 60_000

type Props = {
  slug: string
  className?: string
  /** beheer = volledige balk boven het formulier */
  variant?: 'card' | 'beheer'
}

/** Alleen voor ingelogde zaakhouder van deze slug — niet zichtbaar voor bezoekers. */
export default function ListingOwnerDailyViews({ slug, className, variant = 'card' }: Props) {
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

  const variantClass =
    variant === 'beheer' ? 'vysiongids-listing-daily-views--beheer' : 'vysiongids-listing-daily-views'

  return (
    <div className={variant === 'beheer' ? 'vysiongids-beheer-views-card' : undefined}>
      {variant === 'beheer' ? (
        <p className="vysiongids-beheer-views-kicker">Vandaag in Vysiongids</p>
      ) : null}
      <p
        className={`${variantClass}${className ? ` ${className}` : ''}`}
        aria-label={`Vandaag ${views} keer bekeken`}
      >
        Uw zaak is vandaag{' '}
        <span className="vysiongids-listing-daily-views-count">{formatListingDailyViewCount(views)}</span> keer
        bekeken
      </p>
      {variant === 'beheer' ? (
        <p className="vysiongids-beheer-views-hint">Alleen zichtbaar in beheer — klanten zien dit niet.</p>
      ) : null}
    </div>
  )
}
