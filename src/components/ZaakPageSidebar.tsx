'use client'

import Link from 'next/link'
import { useLanguage } from '@/i18n/LanguageProvider'
import ZaakClaimBlock from '@/components/ZaakClaimBlock'
import ListingMenuButton from '@/components/ListingMenuButton'
import ListingNavigationButtons from '@/components/ListingNavigationButtons'
import ZaakInfoTopLink from '@/components/ZaakInfoTopLink'
import type { Listing } from '@/lib/listing-types'

type Props = {
  listing: Listing
  slug: string
  reviewsHref: string
  mapPin?: { lat: number; lng: number } | null
}

export default function ZaakPageSidebar({ listing, slug, reviewsHref, mapPin }: Props) {
  const { t } = useLanguage()

  return (
    <aside className="vysiongids-zaak-sidebar lg:sticky lg:top-6 lg:self-start">
      <div className="vysiongids-zaak-panel rounded-2xl bg-gray-50 p-5 shadow-sm">
        <p className="text-sm text-gray-600">
          {t('listing.orderDirectLead')}
          <br />
          {t('listing.orderNoCommission')}
        </p>
        <div className="vysiongids-zaak-sidebar-cta mt-4">
          <ZaakInfoTopLink href={`/zaak/${slug}`} className="vysiongids-zaak-action-btn" />
          <a
            href={listing.orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="vysiongids-zaak-action-btn"
          >
            {t('common.order')}
          </a>
          <Link href={`${reviewsHref}#schrijven`} className="vysiongids-zaak-action-btn">
            {t('listing.giveReview')}
          </Link>
          <ListingMenuButton listing={listing} className="vysiongids-zaak-action-btn" />
        </div>
        <ZaakClaimBlock listing={listing} variant="sidebar" />
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('listing.routeHeading')}</p>
          <ListingNavigationButtons listing={listing} compact mapPin={mapPin} />
        </div>
      </div>
    </aside>
  )
}
