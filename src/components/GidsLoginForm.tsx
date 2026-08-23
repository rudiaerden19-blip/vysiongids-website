'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { GidsButtonLoadingContent } from '@/components/GidsLoadingSpinner'
import GidsInternalNavLink from '@/components/GidsInternalNavLink'
import GidsPageLoadingOverlay from '@/components/GidsPageLoadingOverlay'
import TitleCaseTextInput from '@/components/TitleCaseTextInput'
import { useGidsBusyUntilNav } from '@/hooks/use-gids-busy-until-nav'
import { storeGidsBeheerLoginHint } from '@/lib/gids-beheer-login-hint'

export default function GidsLoginForm() {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')?.trim()
  const [error, setError] = useState<string | null>(null)
  const { busy, startBusy, stopBusy } = useGidsBusyUntilNav()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startBusy()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') ?? '').trim()
    const pin = String(fd.get('pin') ?? '').trim()
    try {
      const res = await fetch('/api/gids/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, pin }),
      })
      const data = (await res.json()) as { error?: string; slug?: string; name?: string }
      if (!res.ok) {
        setError(data.error ?? 'Inloggen mislukt.')
        stopBusy()
        return
      }
      if (data.slug && data.name) {
        storeGidsBeheerLoginHint(data.slug, data.name)
      }
      const dest =
        returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/beheer'
      stopBusy()
      window.location.assign(dest)
    } catch {
      setError('Netwerkfout.')
      stopBusy()
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-4">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}
        <div>
          <label className="block text-sm font-semibold text-gray-700" htmlFor="name">
            Zaaknaam (zoals bij registratie)
          </label>
          <TitleCaseTextInput
            id="name"
            name="name"
            required
            autoComplete="organization"
            disabled={busy}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-60"
            placeholder="Bv. naam zaak"
          />
          <p className="mt-1 text-xs text-gray-500">
            Exact zoals in de gids (meervoud/enkelvoud maakt meestal niet uit). PIN = de 6 cijfers van bij registratie.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700" htmlFor="pin">
            6-cijferige PIN
          </label>
          <input
            id="pin"
            name="pin"
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            disabled={busy}
            className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 tracking-widest disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-accent px-8 py-3 font-bold text-white hover:bg-accent/90 disabled:opacity-60"
        >
          {busy ? <GidsButtonLoadingContent label="Inloggen…" /> : 'Inloggen'}
        </button>
        <p className="text-sm text-gray-600">
          Nog geen zaak?{' '}
          <GidsInternalNavLink
            href="/zaak-toevoegen"
            className="font-semibold text-accent hover:underline disabled:opacity-60"
            loadingMessage="Registratie openen…"
          >
            Zaak toevoegen
          </GidsInternalNavLink>
        </p>
      </form>
      <GidsPageLoadingOverlay open={busy} message="Bezig met inloggen…" />
    </>
  )
}
