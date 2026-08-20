'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { formatGidsPremiumDate, GIDS_PREMIUM_YEARLY_EUR } from '@/lib/gids-premium'
import type { GidsStaffListingRow } from '@/lib/gids-staff-listings-db'

type StaffLoginState = 'loading' | 'login' | 'ready' | 'unconfigured'

export default function GidsStaffListingsClient() {
  const [state, setState] = useState<StaffLoginState>('loading')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [listings, setListings] = useState<GidsStaffListingRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 80
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const refreshListings = useCallback(async (pageNum = page, search = filter): Promise<boolean> => {
    setLoadError(null)
    const params = new URLSearchParams({
      page: String(pageNum),
      limit: String(pageSize),
    })
    const q = search.trim()
    if (q) params.set('search', q)
    const r = await fetch(`/api/gids/staff/listings?${params.toString()}`, { credentials: 'same-origin' })
    if (r.status === 401) {
      return false
    }
    if (!r.ok) {
      const data = (await r.json().catch(() => ({}))) as { error?: string }
      setLoadError(
        data.error ??
          (r.status === 503
            ? 'Database niet bereikbaar. Voer supabase/STAFF_PREMIUM_COLUMNS.sql uit in Supabase.'
            : 'Lijst laden mislukt.'),
      )
      return false
    }
    const data = (await r.json()) as { listings: GidsStaffListingRow[]; total?: number }
    setListings(data.listings ?? [])
    setTotal(data.total ?? data.listings?.length ?? 0)
    setPage(pageNum)
    setState('ready')
    return true
  }, [filter, pageSize])

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (state !== 'ready') return
      void refreshListings(1, filter)
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
        const ok = await refreshListings(1, '')
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
      const ok = await refreshListings(1, filter)
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
    setListings([])
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
        setListings((prev) => prev.map((row) => (row.id === id ? data.listing! : row)))
      } else {
        await refreshListings(page, filter)
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
      setListings((prev) => prev.filter((l) => l.id !== row.id))
      setTotal((t) => Math.max(0, t - 1))
    } finally {
      setBusyId(null)
    }
  }

  const filtered = listings

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

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
        className="mx-auto max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Premium €{GIDS_PREMIUM_YEARLY_EUR}/jaar · volgende betaling +365 dagen na «Betaald».
        </p>
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
        placeholder="Zoek op naam, slug, stad…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="vysiongids-form-input max-w-md w-full"
      />

      {loadError ? <p className="text-red-700">{loadError}</p> : null}

      <div className="vysiongids-staff-table-wrap overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="vysiongids-staff-table">
          <thead>
            <tr>
              <th>Zaak</th>
              <th>Adres</th>
              <th>Betaald</th>
              <th>Betaling</th>
              <th>Volgende betaling</th>
              <th>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const busy = busyId === row.id
              const paidLabel = row.premiumActive ? 'Ja' : row.premium_member ? 'Verlopen / gepauzeerd' : 'Nee'
              return (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold text-gray-900">{row.name}</div>
                    <div className="text-xs text-gray-500">
                      <Link href={`/zaak/${row.slug}`} className="text-accent hover:underline" target="_blank">
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
                  <td>{formatGidsPremiumDate(row.premium_paid_at)}</td>
                  <td>{formatGidsPremiumDate(row.premium_expires_at)}</td>
                  <td className="text-sm">
                    {row.status === 'hidden' ? (
                      <span className="text-amber-800">Offline</span>
                    ) : (
                      <span className="text-green-800">Online</span>
                    )}
                    {row.premium_paused ? (
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
                        onClick={() => void patchListing(row.id, 'mark_paid')}
                      >
                        Betaald
                      </button>
                      {row.premium_member || row.premiumActive ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="vysiongids-staff-action-btn"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Premium voor «${row.name}» uitzetten? Betalingsdatums worden gewist.`,
                              )
                            ) {
                              return
                            }
                            void patchListing(row.id, 'revoke_premium')
                          }}
                        >
                          Niet betaald
                        </button>
                      ) : null}
                      {row.premium_paused ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="vysiongids-staff-action-btn"
                          onClick={() => void patchListing(row.id, 'resume')}
                        >
                          Hervatten
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          className="vysiongids-staff-action-btn"
                          onClick={() => void patchListing(row.id, 'pause')}
                        >
                          Pauzeren
                        </button>
                      )}
                      {row.status === 'hidden' ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="vysiongids-staff-action-btn"
                          onClick={() => void patchListing(row.id, 'show_listing')}
                        >
                          Online
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          className="vysiongids-staff-action-btn"
                          onClick={() => void patchListing(row.id, 'hide_listing')}
                        >
                          Offline
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        className="vysiongids-staff-action-btn vysiongids-staff-action-btn--danger"
                        onClick={() => void deleteListing(row)}
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
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">Geen zaken gevonden.</p>
        ) : null}
      </div>
      <p className="text-xs text-gray-500">
        Pagina {page} van {totalPages} · {total} {total === 1 ? 'zaak' : 'zaken'}
      </p>
      {totalPages > 1 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => void refreshListings(page - 1, filter)}
          >
            Vorige
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => void refreshListings(page + 1, filter)}
          >
            Volgende
          </button>
        </div>
      ) : null}
    </div>
  )
}
