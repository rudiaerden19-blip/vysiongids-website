'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ZoekertjesPlaceButton from '@/components/ZoekertjesPlaceButton'
import ZoekertjesPlaceModal from '@/components/ZoekertjesPlaceModal'
import { zoekertjeCategoryLabel } from '@/lib/gids-zoekertjes-categories'
import { GIDS_ZOEKERTJES_SETUP_SQL_HINT } from '@/lib/gids-zoekertjes-db-errors'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'

export default function ZoekertjesPageClient() {
  const searchParams = useSearchParams()
  const [zoekertjes, setZoekertjes] = useState<GidsZoekertje[]>([])
  const [ownerListingId, setOwnerListingId] = useState<string | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const r = await fetch('/api/gids/zoekertjes', { credentials: 'same-origin' })
      const data = (await r.json()) as {
        zoekertjes?: GidsZoekertje[]
        ownerListingId?: string | null
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
      setOwnerListingId(data.ownerListingId ?? null)
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

  useEffect(() => {
    if (searchParams.get('nieuw') === '1') {
      setEditId(null)
      setModalOpen(true)
    }
  }, [searchParams])

  function openNew() {
    setEditId(null)
    setModalOpen(true)
  }

  function openEdit(id: string) {
    setEditId(id)
    setModalOpen(true)
  }

  async function onDelete(id: string, adTitle: string) {
    if (!window.confirm(`Zoekertje «${adTitle}» verwijderen?`)) return
    const r = await fetch(`/api/gids/zoekertjes/${id}`, { method: 'DELETE', credentials: 'same-origin' })
    const data = (await r.json().catch(() => ({}))) as { error?: string }
    if (!r.ok) {
      window.alert(data.error ?? 'Verwijderen mislukt.')
      return
    }
    void loadList()
  }

  return (
    <>
      <p style={{ margin: '0 0 1.25rem', maxWidth: '40rem', color: '#4b5563', lineHeight: 1.6 }}>
        Klein advertentiebord voor horeca: materiaal te koop, ruil, hulp gezocht, … Klik op{' '}
        <strong>Zoekertje plaatsen</strong> — ingelogde premium-leden krijgen een popup om alles in te vullen (5 stappen,
        daarna «Plaats zoekertje»).
      </p>
      <p style={{ margin: '0 0 1.5rem' }}>
        <ZoekertjesPlaceButton onPremiumReady={openNew} />
      </p>

      {setupRequired ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {GIDS_ZOEKERTJES_SETUP_SQL_HINT} Daarna werkt het overzicht en kun je alsnog via de knop de popup invullen.
        </p>
      ) : null}

      {loadError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{loadError}</p>
      ) : null}

      {loading ? <p className="vysiongids-jobs-empty">Zoekertjes laden…</p> : null}

      {!loading && !loadError && zoekertjes.length === 0 ? (
        <p className="vysiongids-jobs-empty">
          {setupRequired ? 'Nog geen zoekertjes (database eerst aanmaken).' : 'Nog geen zoekertjes — wees de eerste.'}
        </p>
      ) : null}

      <ul className="vysiongids-zoekertjes-grid">
        {zoekertjes.map((z) => {
          const isOwner = ownerListingId != null && z.listingId === ownerListingId
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
                {isOwner ? (
                  <div className="vysiongids-zoekertje-card-actions">
                    <button type="button" className="vysiongids-zoekertje-action-btn" onClick={() => openEdit(z.id)}>
                      Bewerken
                    </button>
                    <button
                      type="button"
                      className="vysiongids-zoekertje-action-btn vysiongids-zoekertje-action-btn--danger"
                      onClick={() => void onDelete(z.id, z.title)}
                    >
                      Verwijderen
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      <ZoekertjesPlaceModal
        open={modalOpen}
        editId={editId}
        setupRequired={setupRequired}
        onClose={() => setModalOpen(false)}
        onSaved={() => void loadList()}
      />
    </>
  )
}
