'use client'

import { useEffect, useState } from 'react'
import GidsPremiumPaywallModal from '@/components/GidsPremiumPaywallModal'
import { listingHasGidsPremium } from '@/lib/gids-premium'

type Props = {
  /** Premium + ingelogd: open zoekertje-popup i.p.v. mailto */
  onPremiumReady?: () => void
}

export default function ZoekertjesPlaceButton({ onPremiumReady }: Props) {
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [listingName, setListingName] = useState<string | undefined>()
  const [isPremium, setIsPremium] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    fetch('/api/gids/me?brief=1', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; name?: string; premiumMember?: boolean }) => {
        if (data.authenticated) {
          setListingName(data.name)
          setAuthenticated(true)
          setIsPremium(listingHasGidsPremium(data.premiumMember))
        }
      })
      .finally(() => setAuthChecked(true))
  }, [])

  function onClick() {
    if (!authChecked) return
    if (!authenticated) {
      setPaywallOpen(true)
      return
    }
    if (isPremium) {
      onPremiumReady?.()
      return
    }
    setPaywallOpen(true)
  }

  return (
    <>
      <button
        type="button"
        className="vysiongids-header-nav-cta"
        style={{ display: 'inline-block' }}
        onClick={onClick}
      >
        Zoekertje plaatsen
      </button>
      <GidsPremiumPaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        listingName={listingName}
      />
    </>
  )
}
