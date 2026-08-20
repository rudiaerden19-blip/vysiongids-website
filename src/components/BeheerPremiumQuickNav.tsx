'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import GidsPremiumPaywallModal from '@/components/GidsPremiumPaywallModal'
import { listingHasGidsPremium } from '@/lib/gids-premium'

type Props = {
  premiumMember?: boolean
  listingName?: string
}

export default function BeheerPremiumQuickNav({ premiumMember, listingName }: Props) {
  const router = useRouter()
  const [paywallOpen, setPaywallOpen] = useState(false)
  const isPremium = listingHasGidsPremium(premiumMember)

  function onVacatureClick() {
    if (!isPremium) {
      setPaywallOpen(true)
      return
    }
    document.getElementById('vacature-beheer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function onZoekertjeClick() {
    if (!isPremium) {
      setPaywallOpen(true)
      return
    }
    router.push('/zoekertjes?nieuw=1')
  }

  function openPremiumPaywall() {
    setPaywallOpen(true)
  }

  return (
    <>
      <div className="vysiongids-beheer-quick-nav-wrap">
        <div className="vysiongids-beheer-quick-nav">
          <button type="button" className="vysiongids-beheer-quick-nav-btn" onClick={onVacatureClick}>
            Vacature plaatsen
          </button>
          <button type="button" className="vysiongids-beheer-quick-nav-btn" onClick={onZoekertjeClick}>
            Zoekertje plaatsen
          </button>
        </div>
        {!isPremium ? (
          <button
            type="button"
            className="vysiongids-beheer-quick-nav-btn vysiongids-beheer-quick-nav-btn--claim"
            onClick={openPremiumPaywall}
          >
            Claim uw zaak hier 1 jaar
          </button>
        ) : null}
      </div>
      <GidsPremiumPaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        listingName={listingName}
      />
    </>
  )
}
