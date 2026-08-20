'use client'

import { useEffect, useState } from 'react'
import { formatStatNumber } from '@/lib/gids-public-stats'

function useCountUp(target: number, durationMs: number, run: boolean): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!run) {
      setValue(target)
      return
    }
    setValue(0)
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs, run])

  return value
}

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
  const [animate, setAnimate] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) setAnimate(false)
    const onChange = () => setAnimate(!mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const active = useCountUp(activeZaken, 1500, animate)
  const searches = useCountUp(zoekactiesPerDag, 1800, animate)
  const gratis = useCountUp(0, 1200, animate)

  return (
    <section className="vysiongids-home-stats" aria-label="Platformcijfers">
      <div className="vysiongids-home-stats-inner">
        <Stat display={formatStatNumber(active)} label="Actieve ondernemers" />
        <Stat display={formatStatNumber(searches)} label="Bezoekers vandaag" />
        <Stat display={`${gratis}%`} label="0% commissie" />
      </div>
    </section>
  )
}
