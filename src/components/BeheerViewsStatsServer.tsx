import { formatListingDailyViewCount, listingOwnerViewStats } from '@/lib/gids-listing-daily-views'
import { tServer } from '@/i18n/server-translate'

type Props = {
  slug: string
}

function ViewStatLine({
  label,
  value,
  suffix,
}: {
  label: string
  value: number
  suffix: string
}) {
  return (
    <p className="vysiongids-beheer-views-line">
      <span className="vysiongids-beheer-views-line-label">{label}</span>
      <span className="vysiongids-listing-daily-views-count">{formatListingDailyViewCount(value)}</span>
      <span className="vysiongids-beheer-views-line-suffix"> {suffix}</span>
    </p>
  )
}

/** Weergave-statistieken — server-rendered, geen client-bundle of hydration. */
export async function BeheerViewsStatsServer({ slug }: Props) {
  if (!slug.trim()) return null

  const stats = listingOwnerViewStats(slug)
  const [kicker, todayLabel, weekLabel, monthLabel, suffix, hint] = await Promise.all([
    tServer('beheer.viewsKicker'),
    tServer('beheer.viewsToday'),
    tServer('beheer.viewsWeek'),
    tServer('beheer.viewsMonth'),
    tServer('beheer.viewsSuffix'),
    tServer('beheer.viewsHint'),
  ])

  return (
    <div className="vysiongids-beheer-views-card">
      <p className="vysiongids-beheer-views-kicker">{kicker}</p>
      <div className="vysiongids-beheer-views-stats" aria-live="polite">
        <ViewStatLine label={todayLabel} value={stats.today} suffix={suffix} />
        <ViewStatLine label={weekLabel} value={stats.week} suffix={suffix} />
        <ViewStatLine label={monthLabel} value={stats.month} suffix={suffix} />
      </div>
      <p className="vysiongids-beheer-views-hint">{hint}</p>
    </div>
  )
}
