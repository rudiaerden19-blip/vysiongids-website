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
  const promotion = listingPanelPromotionActive(listing.infoExtras)
  const [open, setOpen] = useState(false)

  if (!promotion) return null

  return (
    <>
      <button
        type="button"
        className={`${className} vysiongids-listing-action-btn--promo-blink`}
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
