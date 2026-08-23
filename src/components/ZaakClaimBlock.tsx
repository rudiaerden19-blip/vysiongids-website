'use client'

import { useState } from 'react'
import { useLanguage } from '@/i18n/LanguageProvider'
import ListingClaimModal from '@/components/ListingClaimModal'
import { useGidsOwnerSlug } from '@/lib/use-gids-owner-slug'
import type { Listing } from '@/lib/listing-types'

type Props = {
  listing: Listing
  variant?: 'sidebar' | 'banner'
}

export default function ZaakClaimBlock({ listing, variant = 'sidebar' }: Props) {
  const { t } = useLanguage()
  const { ownerSlug, authChecked } = useGidsOwnerSlug()
  const [open, setOpen] = useState(false)

  if (listing.claimedAt) return null
  if (authChecked && ownerSlug === listing.slug) return null

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
