import type { ListingPromotionOfferRow } from '@/lib/listing-promotion-offers'
import { formatPromotionPriceDisplay } from '@/lib/listing-promotion-offers'

type Props = {
  offers: ListingPromotionOfferRow[]
  className?: string
}

export default function ListingPromotionOffersList({ offers, className }: Props) {
  const visible = offers.filter((r) => r.label.trim() || r.priceEur != null)
  if (visible.length === 0) return null

  return (
    <ul className={className ?? 'vysiongids-promotion-offers-list'}>
      {visible.map((row, i) => {
        const price = formatPromotionPriceDisplay(row.priceEur)
        return (
          <li key={i} className="vysiongids-promotion-offers-row">
            <span className="vysiongids-promotion-offers-label">{row.label.trim() || '—'}</span>
            {price ? <span className="vysiongids-promotion-offers-price">{price}</span> : null}
          </li>
        )
      })}
    </ul>
  )
}
