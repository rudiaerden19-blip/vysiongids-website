'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import VerwijderZaakButton from '@/components/VerwijderZaakButton'

type MeResponse = {
  authenticated: boolean
  name?: string
  slug?: string
}

export default function BeheerClient() {
  const router = useRouter()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

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
    <div className="space-y-8">
      <p className="text-lg text-gray-800">
        Ingelogd als <strong>{me.name}</strong>
      </p>
      {me.slug ? (
        <Link href={`/zaak/${me.slug}`} className="inline-block font-semibold text-accent hover:underline">
          Publieke pagina bekijken →
        </Link>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-800 hover:bg-gray-50"
        >
          Uitloggen
        </button>
      </div>

      <section className="rounded-xl border border-red-200 bg-red-50/50 p-5">
        <h2 className="text-lg font-bold text-gray-900">Verwijder je zaak</h2>
        <p className="mt-2 text-sm text-gray-600">
          Je listing, alle foto&apos;s, reviews en instellingen worden permanent verwijderd. Je zaak is daarna niet meer
          vindbaar in Vysiongids.
        </p>
        <VerwijderZaakButton expectedSlug={me.slug} className="mt-4" />
      </section>

      <p className="text-sm text-gray-500">Gegevens bewerken volgt in een volgende update.</p>
    </div>
  )
}
