'use client'

import {
  formatListingDailyViewCount,
  listingOwnerViewStats,
  type ListingOwnerViewStats,
} from '@/lib/gids-listing-daily-views'
import { useGidsOwnerSlug } from '@/lib/use-gids-owner-slug'
import { useEffect, useState } from 'react'

const REFRESH_MS = 60_000

type Props = {
  slug: string
  className?: string
  /** beheer = volledige balk boven het formulier */
  variant?: 'card' | 'beheer'
}

function ViewStatLine({ label, value }: { label: string; value: number }) {
  return (
    <p className="vysiongids-beheer-views-line">
      <span className="vysiongids-beheer-views-line-label">{label}</span>
      <span className="vysiongids-listing-daily-views-count">{formatListingDailyViewCount(value)}</span>
      <span className="vysiongids-beheer-views-line-suffix"> weergaves</span>
    </p>
  )
}

/** Alleen voor ingelogde zaakhouder van deze slug — niet zichtbaar voor bezoekers. */
export default function ListingOwnerDailyViews({ slug, className, variant = 'card' }: Props) {
  const { ownerSlug, authChecked } = useGidsOwnerSlug()
  const [stats, setStats] = useState<ListingOwnerViewStats>(() => listingOwnerViewStats(slug))

  useEffect(() => {
    if (ownerSlug !== slug) return
    const refresh = () => setStats(listingOwnerViewStats(slug))
    refresh()
    const id = window.setInterval(refresh, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [ownerSlug, slug])

  if (!authChecked || ownerSlug !== slug) return null

  if (variant === 'beheer') {
    return (
      <div className="vysiongids-beheer-views-card">
        <p className="vysiongids-beheer-views-kicker">Weergaves in Vysiongids</p>
        <div className="vysiongids-beheer-views-stats" aria-live="polite">
          <ViewStatLine label="Vandaag" value={stats.today} />
          <ViewStatLine label="Deze week" value={stats.week} />
          <ViewStatLine label="Deze maand" value={stats.month} />
        </div>
        <p className="vysiongids-beheer-views-hint">Alleen zichtbaar in beheer — klanten zien dit niet.</p>
      </div>
    )
  }

  const views = stats.today
  const variantClass = 'vysiongids-listing-daily-views'

  return (
    <p
      className={`${variantClass}${className ? ` ${className}` : ''}`}
      aria-label={`Vandaag ${views} weergaves`}
    >
      Uw zaak heeft vandaag{' '}
      <span className="vysiongids-listing-daily-views-count">{formatListingDailyViewCount(views)}</span> weergaves
    </p>
  )
}
