import { formatGidsZoekertjePlacedDate } from '@/lib/gids-zoekertjes-date'

type Props = {
  createdAt: string
}

export default function ZoekertjeCardPlacedStrip({ createdAt }: Props) {
  const dateLabel = formatGidsZoekertjePlacedDate(createdAt)
  if (!dateLabel) return null
  return (
    <p className="vysiongids-zoekertje-card-placed">
      Geplaatst op {dateLabel}
    </p>
  )
}
