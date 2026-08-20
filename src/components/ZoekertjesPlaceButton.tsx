'use client'

import { useEffect, useState } from 'react'
import GidsPremiumPaywallModal from '@/components/GidsPremiumPaywallModal'
import { listingHasGidsPremium } from '@/lib/gids-premium'

export default function ZoekertjesPlaceButton() {
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [listingName, setListingName] = useState<string | undefined>()
  const [isPremium, setIsPremium] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    fetch('/api/gids/me?brief=1', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; name?: string; premiumMember?: boolean }) => {
        if (data.authenticated) {
          setListingName(data.name)
          setIsPremium(listingHasGidsPremium(data.premiumMember))
        }
      })
      .finally(() => setAuthChecked(true))
  }, [])

  function onClick() {
    if (authChecked && isPremium) {
      window.location.href = 'mailto:contact@webvysion.tech?subject=Zoekertje%20Vysiongids'
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
