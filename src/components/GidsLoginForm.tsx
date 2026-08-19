'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import TitleCaseTextInput from '@/components/TitleCaseTextInput'
import { writeGidsMeBootstrap, type GidsMeClientPayload } from '@/lib/gids-me-bootstrap'

export default function GidsLoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') ?? '').trim()
    const pin = String(fd.get('pin') ?? '').trim()
    try {
      const res = await fetch('/api/gids/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin }),
      })
      const data = (await res.json()) as {
        error?: string
        slug?: string
        me?: GidsMeClientPayload
      }
      if (!res.ok) {
        setError(data.error ?? 'Inloggen mislukt.')
        return
      }
      if (data.me?.authenticated && data.me.listing) {
        writeGidsMeBootstrap(data.me)
      }
      router.push('/beheer')
      router.refresh()
    } catch {
      setError('Netwerkfout.')
    } finally {
      setLoading(false)
    }
  }

  return (
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
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Bv. Nini-Burger"
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
          className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 tracking-widest"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-accent px-8 py-3 font-bold text-white hover:bg-accent/90 disabled:opacity-60"
      >
        {loading ? 'Bezig…' : 'Inloggen'}
      </button>
      <p className="text-sm text-gray-600">
        Nog geen zaak?{' '}
        <Link href="/zaak-toevoegen" className="font-semibold text-accent hover:underline">
          Zaak toevoegen
        </Link>
      </p>
    </form>
  )
}
