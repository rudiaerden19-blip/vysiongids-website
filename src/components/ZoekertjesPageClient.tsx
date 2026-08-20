'use client'

import { useCallback, useEffect, useState } from 'react'
import ZoekertjeDetailModal from '@/components/ZoekertjeDetailModal'
import ZoekertjePhotoLightbox from '@/components/ZoekertjePhotoLightbox'
import { zoekertjeCategoryLabel } from '@/lib/gids-zoekertjes-categories'
import { formatGidsZoekertjePriceDisplay } from '@/lib/gids-zoekertjes-price'
import { normalizeZoekertjeTitleInput } from '@/lib/gids-zoekertjes-text'
import { GIDS_ZOEKERTJES_SETUP_SQL_HINT } from '@/lib/gids-zoekertjes-db-errors'
import { fetchGidsZoekertjeDetailClient } from '@/lib/fetch-gids-zoekertje-detail-client'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'

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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxPhotos, setLightboxPhotos] = useState<GidsZoekertje['photos']>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

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

  function openLightbox(z: GidsZoekertje, startIndex: number) {
    if (!z.photos.length) return
    setLightboxPhotos(z.photos)
    setLightboxIndex(startIndex)
    setLightboxOpen(true)
  }

  function closeDetail() {
    setDetailOpen(false)
    setSelected(null)
  }

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

      <ul className="vysiongids-zoekertjes-grid vysiongids-zoekertjes-grid--browse">
        {zoekertjes.map((z) => {
          const thumb = z.photos[0]?.publicUrl
          const price = formatGidsZoekertjePriceDisplay(z.price)
          return (
            <li key={z.id} className="vysiongids-zoekertje-card vysiongids-zoekertje-card--browse">
              {thumb ? (
                <button
                  type="button"
                  className="vysiongids-zoekertje-card-media vysiongids-zoekertje-card-media--browse vysiongids-zoekertje-card-photo-hit"
                  onClick={() => openLightbox(z, 0)}
                  aria-label={`Foto: ${normalizeZoekertjeTitleInput(z.title)}`}
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
            </li>
          )
        })}
      </ul>

      <ZoekertjeDetailModal zoekertje={selected} open={detailOpen} onClose={closeDetail} />
      <ZoekertjePhotoLightbox
        open={lightboxOpen}
        photos={lightboxPhotos}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
