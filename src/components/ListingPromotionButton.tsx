'use client'

import { useState } from 'react'
import type { Listing } from '@/lib/listing-types'
import { useLanguage } from '@/i18n/LanguageProvider'
import { listingPanelPromotionActive } from '@/lib/listing-panel-promotion'
import ListingPromotionModal from '@/components/ListingPromotionModal'

type Props = {
  listing: Listing
  className: string
}

export default function ListingPromotionButton({ listing, className }: Props) {
  const { t } = useLanguage()
  const hasActivePromotion = Boolean(listingPanelPromotionActive(listing.infoExtras))
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={`${className}${hasActivePromotion ? ' vysiongids-listing-action-btn--promo-blink' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
      >
        {t('listing.infoExtras.promoModalKicker')}
      </button>
      <ListingPromotionModal listing={listing} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
