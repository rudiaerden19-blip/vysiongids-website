'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/i18n/LanguageProvider'
import { formatStatNumber, zoekactiesPerDagDisplay } from '@/lib/gids-public-stats'

type StatProps = { display: string; label: string }

function Stat({ display, label }: StatProps) {
  return (
    <div className="vysiongids-home-stat">
      <p className="vysiongids-home-stat-value" aria-live="polite">
        {display}
      </p>
      <p className="vysiongids-home-stat-label">{label}</p>
    </div>
  )
}

export type HomeStatsBarProps = {
  zoekactiesPerDag: number
}

export default function HomeStatsBar({ zoekactiesPerDag }: HomeStatsBarProps) {
  const { t } = useLanguage()
  const [bezoekers, setBezoekers] = useState(zoekactiesPerDag)

  useEffect(() => {
    setBezoekers(zoekactiesPerDagDisplay())
    const id = window.setInterval(() => setBezoekers(zoekactiesPerDagDisplay()), 60_000)
    return () => window.clearInterval(id)
  }, [zoekactiesPerDag])

  return (
    <section className="vysiongids-home-stats" aria-label={t('home.statsAria')}>
      <h2 className="vysiongids-home-stats-title">{t('home.statsTitle')}</h2>
      <div className="vysiongids-home-stats-inner">
        <Stat display={formatStatNumber(bezoekers)} label={t('home.statsVisitorsToday')} />
        <Stat display="0%" label={t('home.statsZeroCommission')} />
      </div>
      <p className="vysiongids-home-stats-tagline">{t('home.statsTagline')}</p>
    </section>
  )
}
