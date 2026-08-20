'use client'

import { useCallback, useEffect, useState } from 'react'
import ZoekertjesPlaceModal from '@/components/ZoekertjesPlaceModal'
import { zoekertjeCategoryLabel } from '@/lib/gids-zoekertjes-categories'
import { formatGidsZoekertjePriceDisplay } from '@/lib/gids-zoekertjes-price'
import {
  normalizeZoekertjeDescriptionInput,
  normalizeZoekertjeTitleInput,
} from '@/lib/gids-zoekertjes-text'
import { GIDS_ZOEKERTJES_SETUP_SQL_HINT } from '@/lib/gids-zoekertjes-db-errors'
import { listingHasGidsPremium } from '@/lib/gids-premium'
import type { GidsZoekertje } from '@/lib/gids-zoekertjes-types'
import { GIDS_ZOEKERTJE_MAX_PER_LISTING } from '@/lib/gids-zoekertjes-types'

type Props = {
  premiumMember?: boolean
  modalOpen: boolean
  onModalOpenChange: (open: boolean) => void
  /** Telkens +1 vanuit quick nav: open popup voor nieuw zoekertje. */
  placeRequestId?: number
}

export default function BeheerZoekertjesSection({
  premiumMember,
  modalOpen,
  onModalOpenChange,
  placeRequestId = 0,
}: Props) {
  const isPremium = listingHasGidsPremium(premiumMember)
  const [mine, setMine] = useState<GidsZoekertje[]>([])
  const [setupRequired, setSetupRequired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)

  const loadList = useCallback(async () => {
    if (!isPremium) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/gids/zoekertjes?mine=1', { credentials: 'same-origin' })
      const data = (await r.json()) as {
        zoekertjes?: GidsZoekertje[]
        ownerListingId?: string | null
        setupRequired?: boolean
        maxPerListing?: number
      }
      if (!r.ok) {
        setMine([])
        return
      }
      setSetupRequired(data.setupRequired === true)
      setMine(data.zoekertjes ?? [])
    } catch {
      setMine([])
    } finally {
      setLoading(false)
    }
  }, [isPremium])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (placeRequestId < 1) return
    setEditId(null)
    onModalOpenChange(true)
  }, [placeRequestId, onModalOpenChange])

  function openNew() {
    setEditId(null)
    onModalOpenChange(true)
  }

  function openEdit(id: string) {
    setEditId(id)
    onModalOpenChange(true)
  }

  function closeModal() {
    onModalOpenChange(false)
    setEditId(null)
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

  if (!isPremium) return null

  return (
    <section id="zoekertje-beheer" className="rounded-xl border border-accent/30 bg-sky-50/80 p-5">
      <h2 className="text-lg font-bold text-gray-900">Zoekertjes</h2>
      <p className="mt-2 text-sm text-gray-600">
        Plaats hier je zoekertje — iedereen kan dit zien op de{' '}
        <a href="/zoekertjes" className="font-semibold text-accent underline">
          Zoekertjes
        </a>
        -pagina. Je mag <strong>meerdere zoekertjes</strong> plaatsen (max. {GIDS_ZOEKERTJE_MAX_PER_LISTING} per
        zaak).
      </p>

      <div className="vysiongids-zoekertje-beheer-warn mt-3" role="note">
        <p className="vysiongids-zoekertje-beheer-warn-title">Let Op</p>
        <p className="vysiongids-zoekertje-beheer-warn-text">
          Geef geen bankgegevens aan derden. Een zoekertje dat met een koerier moet worden opgehaald, of een
          misleidend zoekertje, wordt onmiddellijk verwijderd.
        </p>
      </div>

      {setupRequired ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {GIDS_ZOEKERTJES_SETUP_SQL_HINT}
        </p>
      ) : null}

      <button
        type="button"
        className="vysiongids-beheer-quick-nav-btn mt-4"
        onClick={openNew}
        disabled={!loading && mine.length >= GIDS_ZOEKERTJE_MAX_PER_LISTING}
      >
        {mine.length > 0 ? 'Nog een zoekertje plaatsen' : 'Zoekertje plaatsen'}
      </button>

      {!loading && mine.length >= GIDS_ZOEKERTJE_MAX_PER_LISTING ? (
        <p className="mt-2 text-sm text-amber-900">
          Maximum {GIDS_ZOEKERTJE_MAX_PER_LISTING} zoekertjes bereikt — verwijder er één om een nieuwe te plaatsen.
        </p>
      ) : null}

      {!loading && mine.length > 0 ? (
        <p className="mt-3 text-sm font-semibold text-gray-800">
          Jouw zoekertjes ({mine.length})
        </p>
      ) : null}

      {loading ? <p className="mt-4 text-sm text-gray-600">Je zoekertjes laden…</p> : null}

      {!loading && mine.length === 0 ? (
        <p className="mt-4 text-sm text-gray-600">Je hebt nog geen zoekertje geplaatst.</p>
      ) : null}

      {mine.length > 0 ? (
        <ul className="vysiongids-zoekertjes-grid mt-4">
          {mine.map((z) => {
            const thumb = z.photos[0]?.publicUrl
            return (
              <li key={z.id} className="vysiongids-zoekertje-card">
                {thumb ? (
                  <div className="vysiongids-zoekertje-card-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt="" />
                  </div>
                ) : (
                  <div className="vysiongids-zoekertje-card-media vysiongids-zoekertje-card-media--empty">
                    Geen foto
                  </div>
                )}
                <div className="vysiongids-zoekertje-card-body">
                  <h3 className="vysiongids-zoekertje-card-title">{normalizeZoekertjeTitleInput(z.title)}</h3>
                  <p className="vysiongids-zoekertje-card-tags">
                    {zoekertjeCategoryLabel(z.category)} · {formatGidsZoekertjePriceDisplay(z.price)}
                  </p>
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
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      <ZoekertjesPlaceModal
        open={modalOpen}
        editId={editId}
        setupRequired={setupRequired}
        onClose={closeModal}
        onSaved={() => {
          void loadList()
          closeModal()
        }}
      />
    </section>
  )
}
