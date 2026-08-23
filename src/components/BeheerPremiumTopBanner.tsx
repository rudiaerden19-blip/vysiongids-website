'use client'

import { useState } from 'react'
import GidsPremiumPaywallModal from '@/components/GidsPremiumPaywallModal'
import { useLanguage } from '@/i18n/LanguageProvider'
import { GIDS_HORECA_YEARLY_EUR, listingHasGidsPremium } from '@/lib/gids-premium'
import { isDienstenListing } from '@/lib/listing-segment'

type Props = {
  premiumMember?: boolean
  listingName: string
  listingSegment?: 'horeca' | 'diensten'
}

/** Opvallende premium-promo bovenaan beheer — opent bestaande Stripe-checkout flow. */
export default function BeheerPremiumTopBanner({ premiumMember, listingName, listingSegment }: Props) {
  const { t } = useLanguage()
  const [paywallOpen, setPaywallOpen] = useState(false)

  if (isDienstenListing({ listingSegment })) return null
  if (listingHasGidsPremium(premiumMember)) return null

  return (
    <>
      <section className="vysiongids-beheer-premium-top" aria-labelledby="beheer-premium-top-heading">
        <p id="beheer-premium-top-heading" className="vysiongids-beheer-premium-top-text">
          {t('beheer.premiumTopBanner.headline')}
        </p>
        <button
          type="button"
          className="vysiongids-beheer-premium-top-cta"
          onClick={() => setPaywallOpen(true)}
        >
          {t('beheer.premiumTopBanner.cta', { price: GIDS_HORECA_YEARLY_EUR })}
        </button>
      </section>
      <GidsPremiumPaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        listingName={listingName}
      />
    </>
  )
}
