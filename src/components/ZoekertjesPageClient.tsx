'use client'

import { useCallback, useEffect, useState } from 'react'
import { zoekertjeCategoryLabel } from '@/lib/gids-zoekertjes-categories'
import { GIDS_ZOEKERTJES_SETUP_SQL_HINT } from '@/lib/gids-zoekertjes-db-errors'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'

/** Publiek overzicht — alleen bekijken, geen plaatsen (dat gebeurt in beheer). */
export default function ZoekertjesPageClient() {
  const [zoekertjes, setZoekertjes] = useState<GidsZoekertje[]>([])
  const [setupRequired, setSetupRequired] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
    void loadList()
  }, [loadList])

  return (
    <>
      <p style={{ margin: '0 0 1.25rem', maxWidth: '40rem', color: '#4b5563', lineHeight: 1.6 }}>
        Klein advertentiebord voor horeca: materiaal te koop, ruil, hulp gezocht, … Alleen bekijken. Horeca-zaken
        plaatsen zoekertjes via <strong>Login → Beheer</strong>.
      </p>

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

      <ul className="vysiongids-zoekertjes-grid">
        {zoekertjes.map((z) => {
          const thumb = z.photos[0]?.publicUrl
          return (
            <li key={z.id} className="vysiongids-zoekertje-card">
              {thumb ? (
                <div className="vysiongids-zoekertje-card-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb} alt="" />
                </div>
              ) : (
                <div className="vysiongids-zoekertje-card-media vysiongids-zoekertje-card-media--empty">Geen foto</div>
              )}
              <div className="vysiongids-zoekertje-card-body">
                <p className="vysiongids-zoekertje-card-meta">
                  {z.listingName} · {z.listingCity}
                </p>
                <h2 className="vysiongids-zoekertje-card-title">{z.title}</h2>
                <p className="vysiongids-zoekertje-card-tags">
                  {zoekertjeCategoryLabel(z.category)} · {z.priceClass}
                </p>
                <p className="vysiongids-zoekertje-card-desc">{z.description}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
