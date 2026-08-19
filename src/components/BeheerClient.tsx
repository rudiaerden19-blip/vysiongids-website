'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import VerwijderZaakButton from '@/components/VerwijderZaakButton'
import ListingOwnerDailyViews from '@/components/ListingOwnerDailyViews'
import {
  clearGidsBeheerLoginHint,
  readGidsBeheerLoginHint,
} from '@/lib/gids-beheer-login-hint'
import type { Listing } from '@/lib/listing-types'

const BeheerEditForm = dynamic(() => import('@/components/BeheerEditForm'), {
  loading: () => <p className="text-sm text-gray-600">Formulier laden…</p>,
})

type MeResponse = {
  authenticated: boolean
  name?: string
  slug?: string
  listing?: Listing
}

function BeheerQuickNav() {
  return (
    <div className="vysiongids-beheer-quick-nav">
      <Link href="#vacature-beheer" className="vysiongids-beheer-quick-nav-btn">
        Vacature plaatsen
      </Link>
      <Link href="/zoekertjes" className="vysiongids-beheer-quick-nav-btn">
        Zoekertje plaatsen
      </Link>
    </div>
  )
}

export default function BeheerClient() {
  const router = useRouter()
  const loginHint = readGidsBeheerLoginHint()
  const [me, setMe] = useState<MeResponse | null>(
    loginHint
      ? { authenticated: true, name: loginHint.name, slug: loginHint.slug }
      : null,
  )
  const [listing, setListing] = useState<Listing | null>(null)
  const [sessionReady, setSessionReady] = useState(Boolean(loginHint))
  const [listingLoading, setListingLoading] = useState(true)
  const [publicSlug, setPublicSlug] = useState<string | undefined>(loginHint?.slug)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    void (async () => {
      try {
        const briefRes = await fetch('/api/gids/me?brief=1', { signal, credentials: 'same-origin' })
        const brief = (await briefRes.json()) as MeResponse
        setMe((prev) => ({ ...prev, ...brief }))
        if (brief.slug) setPublicSlug(brief.slug)
        if (brief.authenticated) clearGidsBeheerLoginHint()
        setSessionReady(true)

        if (!brief.authenticated) {
          setListingLoading(false)
          return
        }

        const fullRes = await fetch('/api/gids/me', { signal, credentials: 'same-origin' })
        const full = (await fullRes.json()) as MeResponse
        if (full.authenticated && full.listing) {
          setListing(full.listing)
          setMe(full)
          if (full.slug) setPublicSlug(full.slug)
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setMe({ authenticated: false })
        setSessionReady(true)
      } finally {
        setListingLoading(false)
      }
    })()

    return () => controller.abort()
  }, [])

  async function logout() {
    clearGidsBeheerLoginHint()
    await fetch('/api/gids/login', { method: 'DELETE' })
    router.push('/login')
  }

  if (!sessionReady && !loginHint) {
    return (
      <div className="space-y-8">
        <BeheerQuickNav />
        <p className="text-gray-600">Bezig met laden…</p>
      </div>
    )
  }

  if (!me?.authenticated) {
    return (
      <div className="space-y-8">
        <BeheerQuickNav />
        <p className="text-gray-600">
          Niet ingelogd.{' '}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Naar login
          </Link>
        </p>
      </div>
    )
  }

  const slug = publicSlug ?? me.slug

  return (
    <div className="space-y-8">
      <BeheerQuickNav />

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

      {listing ? (
        <BeheerEditForm
          key={listing.slug + (listing.name ?? '')}
          listing={listing}
          onSaved={async (newSlug) => {
            setPublicSlug(newSlug)
            const r = await fetch('/api/gids/me')
            const data = (await r.json()) as MeResponse
            if (data.authenticated && data.listing) {
              setMe(data)
              setListing(data.listing)
            }
          }}
        />
      ) : listingLoading ? (
        <p className="text-gray-600">Je gegevens laden…</p>
      ) : (
        <p className="text-red-700">Gegevens laden mislukt. Vernieuw de pagina.</p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-800 hover:bg-gray-50"
        >
          Uitloggen
        </button>
      </div>

      {listing && slug ? (
        <section className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <h2 className="text-lg font-bold text-gray-900">Verwijder je zaak</h2>
          <p className="mt-2 text-sm text-gray-600">
            Je listing, alle foto&apos;s, reviews en instellingen worden permanent verwijderd. Je zaak is daarna niet meer
            vindbaar in Vysiongids.
          </p>
          <VerwijderZaakButton expectedSlug={slug} className="mt-4" />
        </section>
      ) : null}
    </div>
  )
}
