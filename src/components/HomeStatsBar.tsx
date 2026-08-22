'use client'

import { useEffect, useState } from 'react'
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
  activeZaken: number
  zoekactiesPerDag: number
}

export default function HomeStatsBar({ activeZaken, zoekactiesPerDag }: HomeStatsBarProps) {
  const [bezoekers, setBezoekers] = useState(zoekactiesPerDag)

  useEffect(() => {
    setBezoekers(zoekactiesPerDagDisplay())
    const id = window.setInterval(() => setBezoekers(zoekactiesPerDagDisplay()), 60_000)
    return () => window.clearInterval(id)
  }, [zoekactiesPerDag])

  return (
    <section className="vysiongids-home-stats" aria-label="Platformcijfers">
      <div className="vysiongids-home-stats-inner">
        <Stat display={formatStatNumber(activeZaken)} label="Actieve ondernemers" />
        <Stat display={formatStatNumber(bezoekers)} label="Bezoekers vandaag" />
        <Stat display="0%" label="0% commissie" />
      </div>
    </section>
  )
}
