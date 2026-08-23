'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import VerwijderZaakButton from '@/components/VerwijderZaakButton'
import BeheerPremiumQuickNav from '@/components/BeheerPremiumQuickNav'
import GidsOwnerSessionKeepAlive from '@/components/GidsOwnerSessionKeepAlive'
import type { Listing } from '@/lib/listing-types'
import { isDienstenListing } from '@/lib/listing-segment'
import BeheerDienstenPanel from '@/components/BeheerDienstenPanel'

const ListingOwnerDailyViews = dynamic(() => import('@/components/ListingOwnerDailyViews'), {
  ssr: false,
  loading: () => null,
})

function ZoekertjesSectionLoading() {
  const { t } = useLanguage()
  return (
    <section className="vysiongids-surface-card rounded-xl bg-sky-50/80 p-5">
      <p className="text-sm text-gray-500">{t('beheer.zoekertjesLoading')}</p>
    </section>
  )
}

function ChatSectionLoading() {
  const { t } = useLanguage()
  return (
    <section className="vysiongids-surface-card rounded-xl bg-white p-5">
      <p className="text-sm text-gray-500">{t('beheer.chatLoading')}</p>
    </section>
  )
}

const BeheerZoekertjesSection = dynamic(() => import('@/components/BeheerZoekertjesSection'), {
  ssr: false,
  loading: () => <ZoekertjesSectionLoading />,
})

const BeheerGidsChatSection = dynamic(() => import('@/components/BeheerGidsChatSection'), {
  ssr: false,
  loading: () => <ChatSectionLoading />,
})

type Props = {
  listing: Listing
}

export default function BeheerClientExtras({ listing }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const premiumFlash = searchParams.get('premium')
  const chatThreadId = searchParams.get('chat')
  const [zoekertjeModalOpen, setZoekertjeModalOpen] = useState(false)
  const [zoekertjePlaceRequest, setZoekertjePlaceRequest] = useState(0)
  const [publicSlug, setPublicSlug] = useState(listing.slug)

  useEffect(() => {
    setPublicSlug(listing.slug)
  }, [listing.slug])

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
          const full = (await fullRes.json()) as { premiumMember?: boolean; listing?: Listing }
          if (cancelled) return
          if (full.premiumMember === true || full.listing?.premiumMember === true) {
            router.replace('/beheer', { scroll: false })
            router.refresh()
            return
          }
        } catch {
          /* retry */
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

  const premiumMember = listing.premiumMember
  const dienstenAccount = isDienstenListing(listing)
  const slug = publicSlug

  async function logout() {
    await fetch('/api/gids/login', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <div className="space-y-8">
      {premiumFlash === 'success' ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Bedankt! Je betaling is ontvangen. Premium (zoekertjes &amp; vacatures) wordt actief zodra de webhook binnen is
          (meestal binnen enkele seconden).
        </p>
      ) : null}
      {premiumFlash === 'cancel' ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
          Betaling geannuleerd. Je kunt later opnieuw «Premium nemen».
        </p>
      ) : null}
      <GidsOwnerSessionKeepAlive />
      {!dienstenAccount ? (
        <>
          <BeheerPremiumQuickNav
            premiumMember={premiumMember}
            listingName={listing.name}
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
      <BeheerGidsChatSection initialThreadId={chatThreadId} />

      {listing && dienstenAccount && slug ? <BeheerDienstenPanel listing={listing} slug={slug} /> : null}

      <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-800 hover:bg-gray-50"
        >
          Uitloggen
        </button>
      </div>

      {slug ? (
        <section className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <h2 className="text-lg font-bold text-gray-900">{t('beheer.deleteSectionTitle')}</h2>
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

type AuthProps = Record<string, never>

/** Niet ingelogd — geen listing op server. */
export function BeheerAuthFallback(_props: AuthProps) {
  return (
    <div className="space-y-8">
      <BeheerPremiumQuickNav listingName={undefined} />
      <p className="text-gray-600">
        Niet ingelogd.{' '}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Naar login
        </Link>
      </p>
    </div>
  )
}

