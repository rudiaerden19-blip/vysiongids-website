'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type MeResponse = {
  authenticated: boolean
  name?: string
  slug?: string
  listing?: { orderUrl: string; city: string }
}

export default function BeheerClient() {
  const router = useRouter()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/gids/me')
      .then((r) => r.json())
      .then((data: MeResponse) => setMe(data))
      .finally(() => setLoading(false))
  }, [])

  async function logout() {
    await fetch('/api/gids/login', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  async function removeListing() {
    if (!confirm('Zaak definitief uit Vysiongids verwijderen?')) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/gids/me', { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Verwijderen mislukt.')
        return
      }
      router.push('/')
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="text-gray-600">Laden…</p>
  if (!me?.authenticated) {
    return (
      <p className="text-gray-600">
        Niet ingelogd.{' '}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Naar login
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-lg text-gray-800">
        Ingelogd als <strong>{me.name}</strong>
      </p>
      {me.slug ? (
        <Link href={`/zaak/${me.slug}`} className="inline-block font-semibold text-accent hover:underline">
          Publieke pagina bekijken →
        </Link>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-4">
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-800 hover:bg-gray-50"
        >
          Uitloggen
        </button>
        <button
          type="button"
          onClick={() => void removeListing()}
          disabled={deleting}
          className="rounded-lg border border-red-300 bg-red-50 px-5 py-2.5 font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
        >
          {deleting ? 'Bezig…' : 'Zaak verwijderen'}
        </button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <p className="text-sm text-gray-500">Foto&apos;s en gegevens bewerken volgen in een volgende update.</p>
    </div>
  )
}
