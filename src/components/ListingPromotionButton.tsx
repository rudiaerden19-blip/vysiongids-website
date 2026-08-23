'use client'

import { useState } from 'react'
import type { Listing } from '@/lib/listing-types'
import { listingPanelPromotionActive } from '@/lib/listing-panel-promotion'
import ListingPromotionModal from '@/components/ListingPromotionModal'

type Props = {
  listing: Listing
  className: string
}

export default function ListingPromotionButton({ listing, className }: Props) {
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
        Promoties
      </button>
      <ListingPromotionModal listing={listing} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
