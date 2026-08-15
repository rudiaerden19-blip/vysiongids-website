import { formatStatNumber } from '@/lib/gids-public-stats'

type StatProps = { value: string; label: string }

function Stat({ value, label }: StatProps) {
  return (
    <div className="vysiongids-home-stat">
      <p className="vysiongids-home-stat-value">{value}</p>
      <p className="vysiongids-home-stat-label">{label}</p>
    </div>
  )
}

export type HomeStatsBarProps = {
  activeZaken: number
  zoekactiesPerDag: number
}

export default function HomeStatsBar({ activeZaken, zoekactiesPerDag }: HomeStatsBarProps) {
  return (
    <section className="vysiongids-home-stats" aria-label="Platformcijfers">
      <div className="vysiongids-home-stats-inner">
        <Stat value={formatStatNumber(activeZaken)} label="Actieve zaken" />
        <Stat value={formatStatNumber(zoekactiesPerDag)} label="Zoekacties per dag" />
        <Stat value="100%" label="Gratis vermelding" />
      </div>
    </section>
  )
}
