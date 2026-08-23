'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ZoekertjeDetailModal from '@/components/ZoekertjeDetailModal'
import ZoekertjeCardPlacedStrip from '@/components/ZoekertjeCardPlacedStrip'
import {
  ZOEKERTJES_BROWSE_KIND_OPTIONS,
  ZOEKERTJES_CATEGORIES,
  zoekertjeCategoryLabel,
  zoekertjeMatchesBrowseKind,
} from '@/lib/gids-zoekertjes-categories'
import { formatGidsZoekertjePriceDisplay } from '@/lib/gids-zoekertjes-price'
import { normalizeZoekertjeTitleInput } from '@/lib/gids-zoekertjes-text'
import { GIDS_ZOEKERTJES_SETUP_SQL_HINT } from '@/lib/gids-zoekertjes-db-errors'
import { fetchGidsZoekertjeDetailClient } from '@/lib/fetch-gids-zoekertje-detail-client'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'
import { BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { GIDS_HORECA_YEARLY_EUR } from '@/lib/gids-premium'

const ALL_PROVINCES = 'all'

type Props = {
  initialZoekertjes?: GidsZoekertje[]
  initialSetupRequired?: boolean
  initialLoadError?: string | null
}

/** Publiek overzicht — alleen bekijken, geen plaatsen (dat gebeurt in beheer). */
export default function ZoekertjesPageClient({
  initialZoekertjes,
  initialSetupRequired = false,
  initialLoadError = null,
}: Props) {
  const hasServerList = initialZoekertjes !== undefined
  const [zoekertjes, setZoekertjes] = useState<GidsZoekertje[]>(initialZoekertjes ?? [])
  const [setupRequired, setSetupRequired] = useState(initialSetupRequired)
  const [loadError, setLoadError] = useState<string | null>(initialLoadError)
  const [loading, setLoading] = useState(!hasServerList)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<GidsZoekertje | null>(null)
  const [kindFilter, setKindFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [provinceFilter, setProvinceFilter] = useState(ALL_PROVINCES)

  const filteredZoekertjes = useMemo(() => {
    return zoekertjes.filter((z) => {
      if (!zoekertjeMatchesBrowseKind(z.kind, kindFilter)) return false
      if (categoryFilter && z.category !== categoryFilter) return false
      if (provinceFilter !== ALL_PROVINCES && z.listingProvince !== provinceFilter) return false
      return true
    })
  }, [zoekertjes, kindFilter, categoryFilter, provinceFilter])

  const loadList = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const r = await fetch('/api/gids/zoekertjes', { credentials: 'same-origin' })
      const data = (await r.json()) as {
        zoekertjes?: GidsZoekertje[]
        setupRequired?: boolean
        error?: string
      }
      if (!r.ok) {
        setLoadError(data.error ?? 'Laden mislukt.')
        setSetupRequired(false)
        setZoekertjes([])
        return
      }
      setZoekertjes(data.zoekertjes ?? [])
      setSetupRequired(data.setupRequired === true)
    } catch {
      setLoadError('Laden mislukt.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasServerList) return
    void loadList()
  }, [hasServerList, loadList])

  function openDetail(z: GidsZoekertje) {
    setSelected(z)
    setDetailOpen(true)
    void fetchGidsZoekertjeDetailClient(z.id).then((full) => {
      if (full) setSelected(full)
    })
  }

  function closeDetail() {
    setDetailOpen(false)
    setSelected(null)
  }

  return (
    <>
      <div className="vysiongids-zoekertjes-intro">
        <h1 className="vysiongids-jobs-page-title">Zoekertjes</h1>

        <p className="vysiongids-zoekertjes-intro-lead">
          Welkom op het zoekertjesplatform van Vysiongids. Zoekertjes komen van horeca-leden met premium (
          <strong>€{GIDS_HORECA_YEARLY_EUR}/jaar</strong>). Plaats je eigen zoekertje via je dashboard na registratie
          en premium in beheer.
        </p>

        <div className="vysiongids-zoekertje-beheer-warn vysiongids-zoekertjes-intro-warn" role="note">
          <p className="vysiongids-zoekertje-beheer-warn-title">Let Op</p>
          <p className="vysiongids-zoekertje-beheer-warn-text">
            Geef geen bankgegevens aan derden. Een zoekertje dat met een koerier moet worden opgehaald, of een
            misleidend zoekertje, wordt onmiddellijk verwijderd.
          </p>
        </div>

        <div className="vysiongids-zoekertjes-filters">
          <div className="vysiongids-zoekertjes-filter-block">
            <p className="vysiongids-jobs-province-label">Soort &amp; categorie</p>
            <div className="vysiongids-zoekertjes-filter-row">
              <select
                id="zoekertjes-kind"
                className="vysiongids-jobs-province-select"
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                aria-label="Soort zoekertje"
              >
                {ZOEKERTJES_BROWSE_KIND_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                id="zoekertjes-category"
                className="vysiongids-jobs-province-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Categorie"
              >
                <option value="">Alle categorieën</option>
                {ZOEKERTJES_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="vysiongids-jobs-province-picker vysiongids-zoekertjes-province-picker">
            <label className="vysiongids-jobs-province-label" htmlFor="zoekertjes-province">
              Provincie
            </label>
            <select
              id="zoekertjes-province"
              className="vysiongids-jobs-province-select"
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
            >
              <option value={ALL_PROVINCES}>Heel België</option>
              {BELGIUM_PROVINCES.map((prov) => (
                <option key={prov.slug} value={prov.slug}>
                  {prov.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="vysiongids-zoekertjes-listings">
      {setupRequired ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {GIDS_ZOEKERTJES_SETUP_SQL_HINT}
        </p>
      ) : null}

      {loadError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{loadError}</p>
      ) : null}

      {loading ? <p className="vysiongids-jobs-empty">Zoekertjes laden…</p> : null}

      {!loading && !loadError && zoekertjes.length === 0 ? (
        <p className="vysiongids-jobs-empty">
          {setupRequired ? 'Nog geen zoekertjes zichtbaar.' : 'Nog geen zoekertjes.'}
        </p>
      ) : null}

      {!loading && !loadError && zoekertjes.length > 0 && filteredZoekertjes.length === 0 ? (
        <p className="vysiongids-jobs-empty">Geen zoekertjes voor deze filters. Pas soort, categorie of provincie aan.</p>
      ) : null}

      <ul className="vysiongids-zoekertjes-grid vysiongids-zoekertjes-grid--browse">
        {filteredZoekertjes.map((z) => {
          const thumb = z.photos[0]?.publicUrl
          const price = formatGidsZoekertjePriceDisplay(z.price)
          return (
            <li key={z.id} className="vysiongids-zoekertje-card vysiongids-zoekertje-card--browse">
              {thumb ? (
                <button
                  type="button"
                  className="vysiongids-zoekertje-card-media vysiongids-zoekertje-card-media--browse vysiongids-zoekertje-card-photo-hit"
                  onClick={() => openDetail(z)}
                  aria-label={`Bekijk zoekertje: ${normalizeZoekertjeTitleInput(z.title)}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt="" loading="lazy" decoding="async" />
                </button>
              ) : (
                <div className="vysiongids-zoekertje-card-media vysiongids-zoekertje-card-media--browse vysiongids-zoekertje-card-media--empty">
                  Geen Foto
                </div>
              )}
              <button type="button" className="vysiongids-zoekertje-card-body-hit" onClick={() => openDetail(z)}>
                <div className="vysiongids-zoekertje-card-body vysiongids-zoekertje-card-body--browse">
                  <p className="vysiongids-zoekertje-card-price">{price}</p>
                  <h2 className="vysiongids-zoekertje-card-title vysiongids-zoekertje-card-title--browse">
                    {normalizeZoekertjeTitleInput(z.title)}
                  </h2>
                  <p className="vysiongids-zoekertje-card-tags vysiongids-zoekertje-card-tags--browse">
                    {zoekertjeCategoryLabel(z.category)}
                  </p>
                  <p className="vysiongids-zoekertje-card-meta">
                    {z.listingName} · {z.listingCity}
                  </p>
                </div>
              </button>
              <ZoekertjeCardPlacedStrip createdAt={z.createdAt} />
            </li>
          )
        })}
      </ul>
      </div>

      <ZoekertjeDetailModal zoekertje={selected} open={detailOpen} onClose={closeDetail} />
    </>
  )
}
