'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatGidsPremiumDate, GIDS_PREMIUM_YEARLY_EUR } from '@/lib/gids-premium'
import type { GidsStaffListingRow } from '@/lib/gids-staff-listings-db'

const PUBLIC_GIDS =
  process.env.NEXT_PUBLIC_VYSIONGIDS_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://www.vysiongids.be'

type StaffLoginState = 'loading' | 'login' | 'ready' | 'unconfigured'

export default function StaffListingsClient() {
  const [state, setState] = useState<StaffLoginState>('loading')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [listings, setListings] = useState<GidsStaffListingRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const refreshListings = useCallback(async () => {
    setLoadError(null)
    const r = await fetch('/api/staff/listings', { credentials: 'same-origin' })
    if (r.status === 401) {
      setState('login')
      return
    }
    if (!r.ok) {
      setLoadError('Lijst laden mislukt.')
      return
    }
    const data = (await r.json()) as { listings: GidsStaffListingRow[] }
    setListings(data.listings ?? [])
    setState('ready')
  }, [])

  useEffect(() => {
    void (async () => {
      const r = await fetch('/api/staff/login', { credentials: 'same-origin' })
      const data = (await r.json()) as { authenticated?: boolean; configured?: boolean }
      if (!data.configured) {
        setState('unconfigured')
        return
      }
      if (data.authenticated) {
        await refreshListings()
      } else {
        setState('login')
      }
    })()
  }, [refreshListings])

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    setLoginError(null)
    const r = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password }),
    })
    if (!r.ok) {
      const data = (await r.json()) as { error?: string }
      setLoginError(data.error ?? 'Inloggen mislukt.')
      return
    }
    setPassword('')
    await refreshListings()
  }

  async function logout() {
    await fetch('/api/staff/login', { method: 'DELETE', credentials: 'same-origin' })
    setListings([])
    setState('login')
  }

  async function patchListing(id: string, action: string) {
    setBusyId(id)
    try {
      const r = await fetch(`/api/staff/listings/${id}`, {
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
      const r = await fetch(`/api/staff/listings/${row.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = (await r.json()) as { error?: string }
      if (!r.ok) {
        alert(data.error ?? 'Verwijderen mislukt.')
        return
      }
      setListings((prev) => prev.filter((l) => l.id !== row.id))
    } finally {
      setBusyId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return listings
    return listings.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.slug.includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q),
    )
  }, [listings, filter])

  if (state === 'loading') {
    return <p className="text-gray-600">Bezig met laden…</p>
  }

  if (state === 'unconfigured') {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Zet <code>VYSIONGIDS_STAFF_PASSWORD</code> en Supabase-keys in de omgeving van dit portaal.
      </p>
    )
  }

  if (state === 'login') {
    return (
      <form
        onSubmit={(e) => void onLogin(e)}
        className="mx-auto max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold text-gray-900">Medewerkerslogin</h2>
        <p className="text-sm text-gray-600">Alleen Vysion-personeel.</p>
        <label className="block text-sm font-medium text-gray-800" htmlFor="staffPassword">
          Wachtwoord
        </label>
        <input
          id="staffPassword"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="staff-form-input"
          required
        />
        {loginError ? <p className="text-sm text-red-700">{loginError}</p> : null}
        <button type="submit" className="staff-btn-primary w-full px-4 py-2.5">
          Inloggen
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Premium: €{GIDS_PREMIUM_YEARLY_EUR}/jaar · volgende betaling = +365 dagen na «Betaald».
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
        className="staff-form-input max-w-md"
      />

      {loadError ? <p className="text-red-700">{loadError}</p> : null}

      <div className="staff-table-wrap overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="staff-table">
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
                      <a
                        href={`${PUBLIC_GIDS}/zaak/${row.slug}`}
                        className="staff-link"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.slug}
                      </a>
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
                    <div className="staff-actions">
                      <button
                        type="button"
                        disabled={busy}
                        className="staff-action-btn"
                        onClick={() => void patchListing(row.id, 'mark_paid')}
                      >
                        Betaald
                      </button>
                      {row.premium_paused ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="staff-action-btn"
                          onClick={() => void patchListing(row.id, 'resume')}
                        >
                          Hervatten
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          className="staff-action-btn"
                          onClick={() => void patchListing(row.id, 'pause')}
                        >
                          Pauzeren
                        </button>
                      )}
                      {row.status === 'hidden' ? (
                        <button
                          type="button"
                          disabled={busy}
                          className="staff-action-btn"
                          onClick={() => void patchListing(row.id, 'show_listing')}
                        >
                          Online
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          className="staff-action-btn"
                          onClick={() => void patchListing(row.id, 'hide_listing')}
                        >
                          Offline
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        className="staff-action-btn staff-action-btn--danger"
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
        {filtered.length} van {listings.length} zaken · publieke gids: {PUBLIC_GIDS}
      </p>
    </div>
  )
}
