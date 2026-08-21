'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DienstenListingCard from '@/components/DienstenListingCard'
import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { GIDS_SERVICE_CATEGORIES } from '@/lib/gids-service-categories'
import type { Listing } from '@/lib/listing-types'

type Props = {
  initialListings: Listing[]
}

export default function DienstenZoekenClient({ initialListings }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qParam = searchParams.get('q') ?? ''
  const catParam = searchParams.get('cat') ?? ''
  const provParam = searchParams.get('prov') ?? ''

  const [q, setQ] = useState(qParam)
  const [cat, setCat] = useState(catParam)
  const [prov, setProv] = useState(provParam)
  const [pickerOpen, setPickerOpen] = useState(false)

  const filtered = useMemo(() => {
    const qNorm = q.trim().toLowerCase()
    return initialListings.filter((listing) => {
      if (prov && listing.province !== prov) return false
      if (cat && !listing.serviceCategories?.includes(cat)) return false
      if (!qNorm) return true
      const hay = [
        listing.name,
        listing.city,
        listing.postcode,
        listing.address,
        listing.serviceDescription ?? '',
        ...(listing.serviceCategories ?? []),
      ]
        .join(' ')
        .toLowerCase()
      return qNorm.split(/\s+/).filter(Boolean).every((t) => hay.includes(t))
    })
  }, [initialListings, q, cat, prov])

  function applySearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (cat) params.set('cat', cat)
    if (prov) params.set('prov', prov)
    const qs = params.toString()
    router.push(qs ? `/diensten?${qs}` : '/diensten')
  }

  const catLabel = cat ? GIDS_SERVICE_CATEGORIES.find((c) => c.id === cat)?.label : null

  return (
    <section className="vysiongids-diensten-zoeken" aria-label="Zoek leveranciers">
      <form onSubmit={applySearch} className="vysiongids-diensten-zoek-form">
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op naam, product of plaats…"
          className="vysiongids-diensten-zoek-input"
          autoComplete="off"
        />
        <select
          name="prov"
          value={prov}
          onChange={(e) => setProv(e.target.value)}
          className="vysiongids-diensten-zoek-select"
          aria-label="Provincie"
        >
          <option value="">Heel België</option>
          {BELGIUM_PROVINCES.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="button" className="vysiongids-diensten-zoek-cat-btn" onClick={() => setPickerOpen(true)}>
          {catLabel ? catLabel : 'Kies categorie'}
        </button>
        <button type="submit" className="vysiongids-diensten-zoek-submit">
          Zoeken
        </button>
      </form>

      {cat ? (
        <p className="vysiongids-diensten-zoek-active-cat">
          Filter: {catLabel}{' '}
          <button type="button" className="vysiongids-diensten-zoek-clear-cat" onClick={() => setCat('')}>
            wissen
          </button>
        </p>
      ) : null}

      {pickerOpen ? (
        <>
          <div className="vysiongids-diensten-cat-backdrop" aria-hidden onClick={() => setPickerOpen(false)} />
          <div className="vysiongids-diensten-cat-dialog" role="dialog" aria-modal="true" aria-label="Categorieën">
            <h3 className="vysiongids-diensten-cat-dialog-title">Kies categorie</h3>
            <ul className="vysiongids-diensten-cat-list">
              {GIDS_SERVICE_CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`vysiongids-diensten-cat-pick${cat === c.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setCat(c.id)
                      setPickerOpen(false)
                    }}
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="vysiongids-diensten-cat-close" onClick={() => setPickerOpen(false)}>
              Sluiten
            </button>
          </div>
        </>
      ) : null}

      <p className="vysiongids-diensten-zoek-count">
        {filtered.length === 0
          ? 'Geen leveranciers gevonden. Pas je zoekterm of categorie aan.'
          : `${filtered.length} leverancier${filtered.length === 1 ? '' : 's'}`}
      </p>

      <ul className="vysiongids-diensten-results">
        {filtered.map((listing) => (
          <li key={listing.slug}>
            <DienstenListingCard listing={listing} />
          </li>
        ))}
      </ul>
    </section>
  )
}
