'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import VerwijderZaakButton from '@/components/VerwijderZaakButton'
import ListingOwnerDailyViews from '@/components/ListingOwnerDailyViews'
import {
  clearGidsBeheerLoginHint,
  readGidsBeheerLoginHint,
} from '@/lib/gids-beheer-login-hint'
import BeheerPremiumQuickNav from '@/components/BeheerPremiumQuickNav'
import BeheerZoekertjesSection from '@/components/BeheerZoekertjesSection'
import GidsOwnerSessionKeepAlive from '@/components/GidsOwnerSessionKeepAlive'
import type { Listing } from '@/lib/listing-types'
import type { BeheerServerSession } from '@/lib/gids-beheer-server'
import { isDienstenListing } from '@/lib/listing-segment'
import BeheerDienstenPanel from '@/components/BeheerDienstenPanel'

const BeheerGidsChatSection = dynamic(() => import('@/components/BeheerGidsChatSection'), {
  loading: () => (
    <section className="vysiongids-surface-card rounded-xl bg-white p-5">
      <p className="text-sm text-gray-500">Berichten laden…</p>
    </section>
  ),
  ssr: false,
})

const BeheerEditForm = dynamic(() => import('@/components/BeheerEditForm'), {
  loading: () => <p className="text-sm text-gray-600">Formulier laden…</p>,
})

const BeheerDienstenEditForm = dynamic(() => import('@/components/BeheerDienstenEditForm'), {
  loading: () => <p className="text-sm text-gray-600">Dienstenformulier laden…</p>,
})

type MeResponse = {
  authenticated: boolean
  name?: string
  slug?: string
  premiumMember?: boolean
  listing?: Listing
}

type Props = {
  serverSession: BeheerServerSession
}

export default function BeheerClient({ serverSession }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const premiumFlash = searchParams.get('premium')
  const chatThreadId = searchParams.get('chat')
  const loginHint = readGidsBeheerLoginHint()
  const [me, setMe] = useState<MeResponse>(() =>
    serverSession.authenticated
      ? {
          authenticated: true,
          name: serverSession.name,
          slug: serverSession.slug,
          premiumMember: serverSession.premiumMember,
          listing: serverSession.listing,
        }
      : loginHint
        ? { authenticated: true, name: loginHint.name, slug: loginHint.slug }
        : { authenticated: false },
  )
  const [listing, setListing] = useState<Listing | null>(serverSession.listing ?? null)
  const [sessionReady, setSessionReady] = useState(() => {
    if (serverSession.authenticated && serverSession.listing) return true
    if (!serverSession.authenticated && !loginHint) return true
    return false
  })
  const [listingLoading, setListingLoading] = useState(
    serverSession.authenticated ? !serverSession.listing : false,
  )
  const [publicSlug, setPublicSlug] = useState<string | undefined>(
    serverSession.slug ?? loginHint?.slug,
  )
  const [zoekertjeModalOpen, setZoekertjeModalOpen] = useState(false)
  const [zoekertjePlaceRequest, setZoekertjePlaceRequest] = useState(0)

  const premiumMember = listing?.premiumMember ?? me?.premiumMember
  const dienstenAccount = listing ? isDienstenListing(listing) : false

  useEffect(() => {
    if (serverSession.authenticated && serverSession.listing) {
      if (serverSession.authenticated) clearGidsBeheerLoginHint()
      setSessionReady(true)
      setListingLoading(false)
      return
    }

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
  }, [serverSession.authenticated, serverSession.listing])

  /** Na Stripe: premium via webhook — knop «Claim» verdwijnt zodra DB actief is (geen auto-verleng-UI). */
  useEffect(() => {
    if (premiumFlash !== 'success') return
    let cancelled = false
    let attempts = 0
    const maxAttempts = 20

    const poll = () => {
      if (cancelled) return
      attempts += 1
      void (async () => {
        try {
          const fullRes = await fetch('/api/gids/me', { credentials: 'same-origin' })
          const full = (await fullRes.json()) as MeResponse
          if (cancelled) return
          if (full.authenticated) {
            setMe(full)
            if (full.listing) setListing(full.listing)
            if (full.slug) setPublicSlug(full.slug)
            const active =
              full.premiumMember === true || full.listing?.premiumMember === true
            if (active) {
              router.replace('/beheer', { scroll: false })
              return
            }
          }
        } catch {
          /* volgende poging */
        }
        if (!cancelled && attempts < maxAttempts) {
          window.setTimeout(poll, 1500)
        }
      })()
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [premiumFlash, router])

  async function logout() {
    clearGidsBeheerLoginHint()
    await fetch('/api/gids/login', { method: 'DELETE' })
    router.push('/login')
  }

  if (!sessionReady && !loginHint && !serverSession.authenticated) {
    return (
      <div className="space-y-8">
        <BeheerPremiumQuickNav
          premiumMember={premiumMember}
          listingName={me?.name}
          onZoekertjePlace={() => setZoekertjePlaceRequest((n) => n + 1)}
        />
        <p className="text-gray-600">Bezig met laden…</p>
      </div>
    )
  }

  if (!me?.authenticated) {
    return (
      <div className="space-y-8">
        <BeheerPremiumQuickNav
          premiumMember={premiumMember}
          listingName={me?.name}
          onZoekertjePlace={() => setZoekertjePlaceRequest((n) => n + 1)}
        />
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
      {me?.authenticated ? <GidsOwnerSessionKeepAlive /> : null}
      {premiumFlash === 'success' ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Bedankt! Je betaling is ontvangen. De knop «Claim uw zaak» verdwijnt zodra premium actief is (meestal
          binnen enkele seconden).
        </p>
      ) : null}
      {premiumFlash === 'cancel' ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
          Betaling geannuleerd. Je kunt later opnieuw «Premium nemen».
        </p>
      ) : null}
      {!dienstenAccount ? (
        <>
          <BeheerPremiumQuickNav
            premiumMember={premiumMember}
            listingName={me?.name}
            onZoekertjePlace={() => setZoekertjePlaceRequest((n) => n + 1)}
          />

          <BeheerZoekertjesSection
            premiumMember={premiumMember}
            modalOpen={zoekertjeModalOpen}
            onModalOpenChange={setZoekertjeModalOpen}
            placeRequestId={zoekertjePlaceRequest}
          />
        </>
      ) : null}

      {slug ? <ListingOwnerDailyViews slug={slug} variant="beheer" /> : null}

      {me?.authenticated ? <BeheerGidsChatSection initialThreadId={chatThreadId} /> : null}

      <p className="text-lg text-gray-800">
        Ingelogd als <strong>{me.name}</strong>
      </p>
      {slug ? (
        dienstenAccount ? (
          <Link href={`/diensten/${slug}`} className="inline-block font-semibold text-accent hover:underline">
            Dienstenprofiel bekijken →
          </Link>
        ) : (
          <Link href={`/zaak/${slug}`} className="inline-block font-semibold text-accent hover:underline">
            Publieke pagina bekijken →
          </Link>
        )
      ) : null}

      {!dienstenAccount ? (
        <div className="vysiongids-surface-card rounded-xl bg-sky-50/80 p-5">
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
      ) : null}

      {listing && dienstenAccount && slug ? <BeheerDienstenPanel listing={listing} slug={slug} /> : null}

      {listing && dienstenAccount ? (
        <BeheerDienstenEditForm
          key={listing.slug + (listing.serviceDescription ?? '')}
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
      ) : null}

      {listing && !dienstenAccount ? (
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
      ) : !listing && listingLoading ? (
        <p className="text-gray-600">Je gegevens laden…</p>
      ) : !listing && !listingLoading ? (
        <p className="text-red-700">Gegevens laden mislukt. Vernieuw de pagina.</p>
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
