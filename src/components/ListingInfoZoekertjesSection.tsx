'use client'

import { useState } from 'react'
import ZoekertjeDetailModal from '@/components/ZoekertjeDetailModal'
import ZoekertjeCardPlacedStrip from '@/components/ZoekertjeCardPlacedStrip'
import { zoekertjeCategoryLabel } from '@/lib/gids-zoekertjes-categories'
import { formatGidsZoekertjePriceDisplay } from '@/lib/gids-zoekertjes-price'
import { normalizeZoekertjeTitleInput } from '@/lib/gids-zoekertjes-text'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'

type Props = {
  zoekertjes: GidsZoekertje[]
}

export default function ListingInfoZoekertjesSection({ zoekertjes }: Props) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<GidsZoekertje | null>(null)

  if (zoekertjes.length === 0) return null

  function openDetail(z: GidsZoekertje) {
    setSelected(z)
    setDetailOpen(true)
  }

  function closeDetail() {
    setDetailOpen(false)
    setSelected(null)
  }

  return (
    <>
      <section id="zoekertjes" className="vysiongids-info-block vysiongids-info-block--zoekertjes">
        <p className="vysiongids-info-kicker">MARKTPLAATS</p>
        <h2 className="vysiongids-info-title">Te koop bij ons</h2>
        <ul className="vysiongids-zaak-info-zoekertjes-grid">
          {zoekertjes.map((z) => {
            const thumb = z.photos[0]?.publicUrl
            const price = formatGidsZoekertjePriceDisplay(z.price)
            const title = normalizeZoekertjeTitleInput(z.title)
            return (
              <li key={z.id} className="vysiongids-zoekertje-card vysiongids-zoekertje-card--zaak-info">
                {thumb ? (
                  <button
                    type="button"
                    className="vysiongids-zoekertje-card-media vysiongids-zoekertje-card-media--zaak-info vysiongids-zoekertje-card-photo-hit"
                    onClick={() => openDetail(z)}
                    aria-label={`Bekijk zoekertje: ${title}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt="" loading="lazy" decoding="async" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="vysiongids-zoekertje-card-media vysiongids-zoekertje-card-media--zaak-info vysiongids-zoekertje-card-media--empty"
                    onClick={() => openDetail(z)}
                    aria-label={`Bekijk zoekertje: ${title}`}
                  >
                    Geen foto
                  </button>
                )}
                <button type="button" className="vysiongids-zoekertje-card-body-hit" onClick={() => openDetail(z)}>
                  <div className="vysiongids-zoekertje-card-body vysiongids-zoekertje-card-body--zaak-info">
                    <p className="vysiongids-zoekertje-card-price">{price}</p>
                    <h3 className="vysiongids-zoekertje-card-title vysiongids-zoekertje-card-title--zaak-info">{title}</h3>
                    <p className="vysiongids-zoekertje-card-tags">{zoekertjeCategoryLabel(z.category)}</p>
                  </div>
                </button>
                <ZoekertjeCardPlacedStrip createdAt={z.createdAt} />
              </li>
            )
          })}
        </ul>
      </section>
      <ZoekertjeDetailModal zoekertje={selected} open={detailOpen} onClose={closeDetail} />
    </>
  )
}
