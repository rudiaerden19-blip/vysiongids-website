'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { formatGidsPremiumDate, GIDS_HORECA_YEARLY_EUR } from '@/lib/gids-premium'
import { GIDS_DIENSTEN_YEARLY_EUR } from '@/lib/gids-diensten-pricing'
import type { GidsStaffListingRow, StaffListingsSegment } from '@/lib/gids-staff-listings-db'
import {
  staffListingExpiresAt,
  staffListingHasMembershipRecord,
  staffListingIsClaimed,
  staffListingIsDiensten,
  staffListingMembershipPaidLabel,
  staffListingPaidAt,
} from '@/lib/gids-staff-listings-db'

type StaffLoginState = 'loading' | 'login' | 'ready' | 'unconfigured'

type SegmentState = {
  listings: GidsStaffListingRow[]
  total: number
  page: number
}

const emptySegment = (): SegmentState => ({ listings: [], total: 0, page: 1 })

type StaffTableProps = {
  segment: StaffListingsSegment
  title: string
  priceLabel: string
  state: SegmentState
  busyId: string | null
  onPatch: (id: string, action: string) => void
  onDelete: (row: GidsStaffListingRow) => void
  onPage: (page: number) => void
  pageSize: number
}

function StaffListingsTable({
  segment,
  title,
  priceLabel,
  state,
  busyId,
  onPatch,
  onDelete,
  onPage,
  pageSize,
}: StaffTableProps) {
  const totalPages = Math.max(1, Math.ceil(state.total / pageSize))
  const emptyLabel = segment === 'diensten' ? 'Geen bedrijven gevonden.' : 'Geen frituren gevonden.'

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">
          Lidmaatschap €{priceLabel}/jaar · volgende betaling +365 dagen na «Betaald». Geclaimde zaken staan
          bovenaan (groene rij).
        </p>
      </div>

      <div className="vysiongids-surface-card vysiongids-staff-table-wrap overflow-x-auto rounded-xl bg-white">
        <table className="vysiongids-staff-table">
          <thead>
            <tr>
              <th>{segment === 'diensten' ? 'Bedrijf' : 'Zaak'}</th>
              <th>Adres</th>
              <th>Betaald</th>
              <th>Betaling</th>
              <th>Volgende betaling</th>
              <th>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {state.listings.map((row) => {
              const busy = busyId === row.id
              const isDiensten = staffListingIsDiensten(row)
              const paidLabel = staffListingMembershipPaidLabel(row)
              const profileHref = isDiensten ? `/diensten/${row.slug}` : `/zaak/${row.slug}`
              const claimed = staffListingIsClaimed(row)

              return (
                <tr
                  key={row.id}
                  className={claimed ? 'vysiongids-staff-table-row--claimed' : undefined}
                >
                  <td>
                    <div className="font-semibold text-gray-900">{row.name}</div>
                    <div className="text-xs text-gray-500">
                      <Link href={profileHref} className="text-accent hover:underline" target="_blank">
                        {row.slug}
                      </Link>
                    </div>
                  </td>
                  <td className="text-sm text-gray-700">
                    {row.address}
                    <br />
                    {row.postcode} {row.city}
                  </td>
                  <td>{paidLabel}</td>
                  <td>{formatGidsPremiumDate(staffListingPaidAt(row))}</td>
                  <td>{formatGidsPremiumDate(staffListingExpiresAt(row))}</td>
                  <td className="text-sm">
                    {row.status === 'hidden' ? (
                      <span className="text-amber-800">Offline</span>
                    ) : (
                      <span className="text-green-800">Online</span>
                    )}
                    {!isDiensten && row.premium_paused ? (
                      <>
                        <br />
                        <span className="text-amber-800">Premium gepauzeerd</span>
                      </>
                    ) : null}
                  </td>
                  <td>
                    <div className="vysiongids-staff-actions">
                      <button
                        type="button"
                        disabled={busy}
                        className="vysiongids-staff-action-btn"
                        onClick={() => onPatch(row.id, 'mark_paid')}
                      >
                        Betaald
                      </button>
                      {staffListingHasMembershipRecord(row) ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="vysiongids-staff-action-btn"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Lidmaatschap voor «${row.name}» uitzetten? Betalingsdatums worden gewist.`,
                              )
                            ) {
                              return
                            }
                            onPatch(row.id, 'revoke_premium')
                          }}
                        >
                          Niet betaald
                        </button>
                      ) : null}
                      {!isDiensten ? (
                        row.premium_paused ? (
                          <button
                            type="button"
                            disabled={busy}
                            className="vysiongids-staff-action-btn"
                            onClick={() => onPatch(row.id, 'resume')}
                          >
                            Hervatten
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            className="vysiongids-staff-action-btn"
                            onClick={() => onPatch(row.id, 'pause')}
                          >
                            Pauzeren
                          </button>
                        )
                      ) : null}
                      {row.status === 'hidden' ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="vysiongids-staff-action-btn"
                          onClick={() => onPatch(row.id, 'show_listing')}
                        >
                          Online
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          className="vysiongids-staff-action-btn"
                          onClick={() => onPatch(row.id, 'hide_listing')}
                        >
                          Offline
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        className="vysiongids-staff-action-btn vysiongids-staff-action-btn--danger"
                        onClick={() => onDelete(row)}
                      >
                        Verwijderen
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {state.listings.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">{emptyLabel}</p>
        ) : null}
      </div>
      <p className="text-xs text-gray-500">
        Pagina {state.page} van {totalPages}
      </p>
      {totalPages > 1 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={state.page <= 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => onPage(state.page - 1)}
          >
            Vorige
          </button>
          <button
            type="button"
            disabled={state.page >= totalPages}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => onPage(state.page + 1)}
          >
            Volgende
          </button>
        </div>
      ) : null}
    </section>
  )
}

export default function GidsStaffListingsClient() {
  const [state, setState] = useState<StaffLoginState>('loading')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [horeca, setHoreca] = useState<SegmentState>(emptySegment)
  const [diensten, setDiensten] = useState<SegmentState>(emptySegment)
  const pageSize = 80
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const fetchSegment = useCallback(
    async (
      segment: StaffListingsSegment,
      pageNum: number,
      search: string,
    ): Promise<{ ok: true; data: SegmentState } | { ok: false }> => {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(pageSize),
        segment,
      })
      const q = search.trim()
      if (q) params.set('search', q)
      const r = await fetch(`/api/gids/staff/listings?${params.toString()}`, { credentials: 'same-origin' })
      if (r.status === 401) return { ok: false }
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string }
        setLoadError(
          data.error ??
            (r.status === 503
              ? 'Database niet bereikbaar. Voer supabase/STAFF_PREMIUM_COLUMNS.sql uit in Supabase.'
              : 'Lijst laden mislukt.'),
        )
        return { ok: false }
      }
      const data = (await r.json()) as { listings: GidsStaffListingRow[]; total?: number }
      return {
        ok: true,
        data: {
          listings: data.listings ?? [],
          total: data.total ?? data.listings?.length ?? 0,
          page: pageNum,
        },
      }
    },
    [pageSize],
  )

  const refreshListings = useCallback(
    async (opts?: { horecaPage?: number; dienstenPage?: number; search?: string }): Promise<boolean> => {
      setLoadError(null)
      const search = opts?.search ?? filter
      const hPage = opts?.horecaPage ?? horeca.page
      const dPage = opts?.dienstenPage ?? diensten.page

      const [hRes, dRes] = await Promise.all([
        fetchSegment('horeca', hPage, search),
        fetchSegment('diensten', dPage, search),
      ])

      if (!hRes.ok || !dRes.ok) return false

      setHoreca(hRes.data)
      setDiensten(dRes.data)
      setState('ready')
      return true
    },
    [diensten.page, fetchSegment, filter, horeca.page],
  )

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (state !== 'ready') return
      void refreshListings({ horecaPage: 1, dienstenPage: 1, search: filter })
    }, 300)
    return () => window.clearTimeout(t)
  }, [filter, state, refreshListings])

  useEffect(() => {
    void (async () => {
      const r = await fetch('/api/gids/staff/login', { credentials: 'same-origin' })
      const data = (await r.json()) as { authenticated?: boolean; configured?: boolean }
      if (!data.configured) {
        setState('unconfigured')
        return
      }
      if (data.authenticated) {
        const ok = await refreshListings({ horecaPage: 1, dienstenPage: 1, search: '' })
        if (!ok) setState('login')
      } else {
        setState('login')
      }
    })()
  }, [refreshListings])

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoadError(null)
    setLoggingIn(true)
    try {
      const r = await fetch('/api/gids/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password: password.trim() }),
      })
      const data = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        setLoginError(data.error ?? 'Inloggen mislukt.')
        return
      }
      setPassword('')
      const ok = await refreshListings({ horecaPage: 1, dienstenPage: 1, search: filter })
      if (ok) return
      setLoginError('Sessie start mislukt — pagina wordt ververst…')
      window.location.reload()
    } catch {
      setLoginError('Netwerkfout. Probeer opnieuw.')
    } finally {
      setLoggingIn(false)
    }
  }

  async function logout() {
    await fetch('/api/gids/staff/login', { method: 'DELETE', credentials: 'same-origin' })
    setHoreca(emptySegment())
    setDiensten(emptySegment())
    setState('login')
  }

  async function patchListing(id: string, action: string) {
    setBusyId(id)
    try {
      const r = await fetch(`/api/gids/staff/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action }),
      })
      const data = (await r.json()) as { error?: string; listing?: GidsStaffListingRow }
      if (!r.ok) {
        alert(data.error ?? 'Actie mislukt.')
        return
      }
      if (data.listing) {
        const row = data.listing
        const updater = (prev: SegmentState) => ({
          ...prev,
          listings: prev.listings.map((item) => (item.id === id ? row : item)),
        })
        if (staffListingIsDiensten(row)) {
          setDiensten(updater)
        } else {
          setHoreca(updater)
        }
      } else {
        await refreshListings()
      }
    } finally {
      setBusyId(null)
    }
  }

  async function deleteListing(row: GidsStaffListingRow) {
    const ok = window.confirm(
      `«${row.name}» permanent verwijderen uit de gids?\n\nDit verwijdert ook foto’s, reviews en menu.`,
    )
    if (!ok) return
    setBusyId(row.id)
    try {
      const r = await fetch(`/api/gids/staff/listings/${row.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = (await r.json()) as { error?: string }
      if (!r.ok) {
        alert(data.error ?? 'Verwijderen mislukt.')
        return
      }
      if (staffListingIsDiensten(row)) {
        setDiensten((prev) => ({
          ...prev,
          listings: prev.listings.filter((l) => l.id !== row.id),
          total: Math.max(0, prev.total - 1),
        }))
      } else {
        setHoreca((prev) => ({
          ...prev,
          listings: prev.listings.filter((l) => l.id !== row.id),
          total: Math.max(0, prev.total - 1),
        }))
      }
    } finally {
      setBusyId(null)
    }
  }

  if (state === 'loading') {
    return <p className="text-gray-600">Bezig met laden…</p>
  }

  if (state === 'unconfigured') {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Zet <code>VYSIONGIDS_STAFF_PASSWORD</code> in Vercel (min. 12 tekens).
      </p>
    )
  }

  if (state === 'login') {
    return (
      <form
        onSubmit={(e) => void onLogin(e)}
        className="vysiongids-surface-card mx-auto max-w-sm space-y-4 rounded-xl bg-white p-6"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
      >
        <h2 className="text-lg font-bold text-gray-900">Medewerkerslogin</h2>
        <label className="block text-sm font-medium text-gray-800" htmlFor="staffAccessKey">
          Toegangscode
        </label>
        <input
          id="staffAccessKey"
          name="vysiongids-staff-access"
          type="password"
          autoComplete="one-time-code"
          inputMode="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="vysiongids-form-input w-full"
          required
        />
        {loginError ? <p className="text-sm text-red-700">{loginError}</p> : null}
        {loadError ? <p className="text-sm text-red-700">{loadError}</p> : null}
        <button
          type="submit"
          disabled={loggingIn}
          className="w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:opacity-95 disabled:opacity-60"
        >
          {loggingIn ? 'Bezig…' : 'Inloggen'}
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Uitloggen
        </button>
      </div>

      <input
        type="search"
        placeholder="Zoek op naam, slug, stad… (beide lijsten)"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="vysiongids-form-input max-w-md w-full"
      />

      {loadError ? <p className="text-red-700">{loadError}</p> : null}

      <StaffListingsTable
        segment="horeca"
        title="Frituren & horeca"
        priceLabel={String(GIDS_HORECA_YEARLY_EUR)}
        state={horeca}
        busyId={busyId}
        onPatch={(id, action) => void patchListing(id, action)}
        onDelete={(row) => void deleteListing(row)}
        onPage={(page) => void refreshListings({ horecaPage: page, dienstenPage: diensten.page })}
        pageSize={pageSize}
      />

      <StaffListingsTable
        segment="diensten"
        title="Bedrijven & leveranciers (diensten)"
        priceLabel={String(GIDS_DIENSTEN_YEARLY_EUR)}
        state={diensten}
        busyId={busyId}
        onPatch={(id, action) => void patchListing(id, action)}
        onDelete={(row) => void deleteListing(row)}
        onPage={(page) => void refreshListings({ horecaPage: horeca.page, dienstenPage: page })}
        pageSize={pageSize}
      />
    </div>
  )
}
