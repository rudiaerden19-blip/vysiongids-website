'use client'

import { useState } from 'react'
import ZoekertjeDetailModal from '@/components/ZoekertjeDetailModal'
import { zoekertjeCategoryLabel } from '@/lib/gids-zoekertjes-categories'
import { formatGidsZoekertjePlacedDate } from '@/lib/gids-zoekertjes-date'
import { formatGidsZoekertjePriceDisplay } from '@/lib/gids-zoekertjes-price'
import { normalizeZoekertjeTitleInput } from '@/lib/gids-zoekertjes-text'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'

type Props = {
  listingName: string
  zoekertjes: GidsZoekertje[]
}

function zoekertjeCountHeading(name: string, count: number): string {
  const label = count === 1 ? '1 zoekertje' : `${count} zoekertjes`
  return `${name} heeft ${label}`
}

function fieldRow(label: string, value: string | null | undefined) {
  const v = value?.trim()
  if (!v) return null
  return (
    <div className="vysiongids-zaak-zoekertje-field">
      <dt className="vysiongids-zaak-zoekertje-field-label">{label}</dt>
      <dd className="vysiongids-zaak-zoekertje-field-value">{v}</dd>
    </div>
  )
}

export default function ListingInfoZoekertjesSection({ listingName, zoekertjes }: Props) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<GidsZoekertje | null>(null)

  if (zoekertjes.length === 0) return null

  const sectionTitle = zoekertjeCountHeading(listingName.trim() || 'Deze zaak', zoekertjes.length)

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
        <p className="vysiongids-info-kicker">TE KOOP</p>
        <h2 className="vysiongids-info-title">{sectionTitle}</h2>
        <ul className="vysiongids-zaak-zoekertjes-list">
          {zoekertjes.map((z) => {
            const thumb = z.photos[0]?.publicUrl
            const title = normalizeZoekertjeTitleInput(z.title)
            const price = formatGidsZoekertjePriceDisplay(z.price)
            const category = zoekertjeCategoryLabel(z.category)
            const placed = formatGidsZoekertjePlacedDate(z.createdAt)
            return (
              <li key={z.id} className="vysiongids-zaak-zoekertje-card">
                {thumb ? (
                  <button
                    type="button"
                    className="vysiongids-zaak-zoekertje-photo"
                    onClick={() => openDetail(z)}
                    aria-label={`Foto: ${title}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt="" loading="lazy" decoding="async" />
                  </button>
                ) : (
                  <div className="vysiongids-zaak-zoekertje-photo vysiongids-zaak-zoekertje-photo--empty" aria-hidden>
                    Geen foto
                  </div>
                )}
                <div className="vysiongids-zaak-zoekertje-body">
                  <dl className="vysiongids-zaak-zoekertje-fields">
                    {fieldRow('Product', title)}
                    {fieldRow('Categorie', category)}
                    {fieldRow('Prijs', price)}
                    {fieldRow('Conditie', z.condition)}
                    {fieldRow('Soort', z.kind)}
                    {fieldRow('Type', z.itemType)}
                    {fieldRow('Merk', z.brand)}
                    {placed ? fieldRow('Geplaatst', placed) : null}
                  </dl>
                  <button type="button" className="vysiongids-zaak-zoekertje-detail-btn" onClick={() => openDetail(z)}>
                    Zoekertje bekijken
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
      <ZoekertjeDetailModal zoekertje={selected} open={detailOpen} onClose={closeDetail} />
    </>
  )
}
