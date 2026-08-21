'use client'

import { useState } from 'react'
import GidsPremiumPaywallModal from '@/components/GidsPremiumPaywallModal'
import { listingHasGidsPremium } from '@/lib/gids-premium'

type Props = {
  premiumMember?: boolean
  listingName?: string
  variant?: 'horeca' | 'diensten'
  /** Horeca premium of actief diensten-lidmaatschap */
  zoekertjesAllowed?: boolean
  onZoekertjePlace?: () => void
}

export default function BeheerPremiumQuickNav({
  premiumMember,
  listingName,
  variant = 'horeca',
  zoekertjesAllowed,
  onZoekertjePlace,
}: Props) {
  const [paywallOpen, setPaywallOpen] = useState(false)
  const isPremium = listingHasGidsPremium(premiumMember)
  const canZoekertjes = zoekertjesAllowed ?? isPremium

  function onVacatureClick() {
    if (!isPremium) {
      setPaywallOpen(true)
      return
    }
    document.getElementById('vacature-beheer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function onZoekertjeClick() {
    if (!canZoekertjes) {
      setPaywallOpen(true)
      return
    }
    onZoekertjePlace?.()
    document.getElementById('zoekertje-beheer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function openPremiumPaywall() {
    setPaywallOpen(true)
  }

  return (
    <>
      <div className="vysiongids-beheer-quick-nav-wrap">
        <div className="vysiongids-beheer-quick-nav">
          {variant === 'horeca' ? (
            <button type="button" className="vysiongids-beheer-quick-nav-btn" onClick={onVacatureClick}>
              Vacature plaatsen
            </button>
          ) : null}
          <button type="button" className="vysiongids-beheer-quick-nav-btn" onClick={onZoekertjeClick}>
            {variant === 'diensten' ? 'Reclame / zoekertje plaatsen' : 'Zoekertje plaatsen'}
          </button>
        </div>
        {variant === 'horeca' && !isPremium ? (
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
