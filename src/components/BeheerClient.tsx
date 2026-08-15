'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import VerwijderZaakButton from '@/components/VerwijderZaakButton'
import BeheerEditForm from '@/components/BeheerEditForm'
import ListingOwnerDailyViews from '@/components/ListingOwnerDailyViews'
import type { Listing } from '@/lib/listing-types'

type MeResponse = {
  authenticated: boolean
  name?: string
  slug?: string
  listing?: Listing
}

export default function BeheerClient() {
  const router = useRouter()
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [publicSlug, setPublicSlug] = useState<string | undefined>()

  useEffect(() => {
    fetch('/api/gids/me')
      .then((r) => r.json())
      .then((data: MeResponse) => {
        setMe(data)
        setPublicSlug(data.slug)
      })
      .finally(() => setLoading(false))
  }, [])

  async function logout() {
    await fetch('/api/gids/login', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  if (loading) return <p className="text-gray-600">Laden…</p>
  if (!me?.authenticated || !me.listing) {
    return (
      <p className="text-gray-600">
        Niet ingelogd.{' '}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Naar login
        </Link>
      </p>
    )
  }

  const slug = publicSlug ?? me.slug

  return (
    <div className="space-y-8">
      {slug ? <ListingOwnerDailyViews slug={slug} variant="beheer" /> : null}

      <p className="text-lg text-gray-800">
        Ingelogd als <strong>{me.name}</strong>
      </p>
      {slug ? (
        <Link href={`/zaak/${slug}`} className="inline-block font-semibold text-accent hover:underline">
          Publieke pagina bekijken →
        </Link>
      ) : null}

      <div className="rounded-xl border border-accent/30 bg-sky-50/80 p-5">
        <h2 className="text-lg font-bold text-gray-900">Menukaart</h2>
        <p className="mt-2 text-sm text-gray-600">
          Voeg categorieën, producten en foto&apos;s toe — zoals in je kassa. Bezoekers openen het via de knop{' '}
          <strong>Menu</strong>.
        </p>
        <Link
          href="/beheer/menu"
          className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:opacity-95"
        >
          Menu beheren →
        </Link>
      </div>

      <BeheerEditForm
        key={me.listing.slug + (me.listing.name ?? '')}
        listing={me.listing}
        onSaved={async (newSlug) => {
          setPublicSlug(newSlug)
          const r = await fetch('/api/gids/me')
          const data = (await r.json()) as MeResponse
          if (data.authenticated && data.listing) setMe(data)
        }}
      />

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
        <VerwijderZaakButton expectedSlug={slug} className="mt-4" />
      </section>
    </div>
  )
}
