'use client'

import {
  formatListingDailyViewCount,
  listingOwnerViewStats,
  type ListingOwnerViewStats,
} from '@/lib/gids-listing-daily-views'
import { useLanguage } from '@/i18n/LanguageProvider'
import { useGidsOwnerSlug } from '@/lib/use-gids-owner-slug'
import { useEffect, useState } from 'react'

const REFRESH_MS = 60_000

type Props = {
  slug: string
  className?: string
  /** beheer = volledige balk boven het formulier */
  variant?: 'card' | 'beheer'
}

function ViewStatLine({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <p className="vysiongids-beheer-views-line">
      <span className="vysiongids-beheer-views-line-label">{label}</span>
      <span className="vysiongids-listing-daily-views-count">{formatListingDailyViewCount(value)}</span>
      <span className="vysiongids-beheer-views-line-suffix"> {suffix}</span>
    </p>
  )
}

function BeheerViewsCard({ slug }: { slug: string }) {
  const { t } = useLanguage()
  const [stats, setStats] = useState<ListingOwnerViewStats>(() => listingOwnerViewStats(slug))
  const suffix = t('beheer.viewsSuffix')

  useEffect(() => {
    const refresh = () => setStats(listingOwnerViewStats(slug))
    refresh()
    const id = window.setInterval(refresh, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [slug])

  return (
    <div className="vysiongids-beheer-views-card">
      <p className="vysiongids-beheer-views-kicker">{t('beheer.viewsKicker')}</p>
      <div className="vysiongids-beheer-views-stats" aria-live="polite">
        <ViewStatLine label={t('beheer.viewsToday')} value={stats.today} suffix={suffix} />
        <ViewStatLine label={t('beheer.viewsWeek')} value={stats.week} suffix={suffix} />
        <ViewStatLine label={t('beheer.viewsMonth')} value={stats.month} suffix={suffix} />
      </div>
      <p className="vysiongids-beheer-views-hint">{t('beheer.viewsHint')}</p>
    </div>
  )
}

/** Alleen voor ingelogde zaakhouder van deze slug — niet zichtbaar voor bezoekers. */
export default function ListingOwnerDailyViews({ slug, className, variant = 'card' }: Props) {
  if (variant === 'beheer') {
    return <BeheerViewsCard slug={slug} />
  }

  return <ListingOwnerDailyViewsPublic slug={slug} className={className} />
}

function ListingOwnerDailyViewsPublic({ slug, className }: { slug: string; className?: string }) {
  const { t } = useLanguage()
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

  const views = stats.today
  const count = formatListingDailyViewCount(views)
  const variantClass = 'vysiongids-listing-daily-views'

  return (
    <p
      className={`${variantClass}${className ? ` ${className}` : ''}`}
      aria-label={t('beheer.viewsAriaToday', { count })}
    >
      {t('beheer.viewsPublicLine', { count })}
    </p>
  )
}
