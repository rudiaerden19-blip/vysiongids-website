'use client'

import { useState } from 'react'
import { useLanguage } from '@/i18n/LanguageProvider'
import ListingClaimModal from '@/components/ListingClaimModal'
import { useGidsOwnerSlug } from '@/lib/use-gids-owner-slug'
import { listingShowsClaimUi } from '@/lib/listing-claimable'
import type { Listing } from '@/lib/listing-types'

type Props = {
  listing: Listing
  variant?: 'sidebar' | 'banner' | 'panelTitle'
}

export default function ZaakClaimBlock({ listing, variant = 'sidebar' }: Props) {
  const { t } = useLanguage()
  const { ownerSlug, authChecked } = useGidsOwnerSlug()
  const [open, setOpen] = useState(false)

  if (!listingShowsClaimUi(listing.claimedAt)) return null
  if (authChecked && ownerSlug === listing.slug) return null

  if (variant === 'panelTitle') {
    return (
      <>
        <button type="button" className="vysiongids-listing-panel-claim-btn" onClick={() => setOpen(true)}>
          {t('claim.openButton')}
        </button>
        <ListingClaimModal listing={listing} open={open} onClose={() => setOpen(false)} />
      </>
    )
  }

  const isBanner = variant === 'banner'

  return (
    <>
      <div className={isBanner ? 'vysiongids-zaak-claim-banner' : 'vysiongids-zaak-claim-sidebar'}>
        <p className={isBanner ? 'vysiongids-zaak-claim-banner-text' : 'vysiongids-zaak-claim-sidebar-text'}>
          {t('claim.sidebarTeaser')}
        </p>
        <button
          type="button"
          className={isBanner ? 'vysiongids-zaak-claim-banner-btn' : 'vysiongids-zaak-claim-sidebar-btn'}
          onClick={() => setOpen(true)}
        >
          {t('claim.openButton')}
        </button>
      </div>
      <ListingClaimModal listing={listing} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
