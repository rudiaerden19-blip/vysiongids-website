'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { localizedListingCuisineDisplay } from '@/lib/listing-i18n'
import type { Listing } from '@/lib/listing-types'

type Props = {
  listing: Listing
}

export default function ZaakPageTitle({ listing }: Props) {
  const { t } = useLanguage()
  const cuisineLine = localizedListingCuisineDisplay(t, listing.cuisineType)

  return (
    <h1 className="vysiongids-zaak-title text-3xl font-bold text-accent sm:text-4xl">
      {listing.name}
      {cuisineLine ? <span className="vysiongids-zaak-title-cuisine-inline"> · {cuisineLine}</span> : null}
    </h1>
  )
}
