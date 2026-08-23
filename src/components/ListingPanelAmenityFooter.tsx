'use client'

import ListingAmenityIcon from '@/components/ListingAmenityIcon'
import type { Listing } from '@/lib/listing-types'
import { useLanguage } from '@/i18n/LanguageProvider'
import { resolveListingAmenityList } from '@/lib/listing-amenity-list'
import { localizedListingAmenityLabel } from '@/lib/listing-i18n'

type Props = {
  listing: Listing
  /** In actiebalk links van Info/Bestel-knoppen (niet full-width onder foto). */
  variant?: 'inline' | 'footer'
  className?: string
}

export default function ListingPanelAmenityFooter({ listing, variant = 'inline', className }: Props) {
  const { t } = useLanguage()
  const amenityList = resolveListingAmenityList(listing)
  if (amenityList.length === 0) return null

  const variantClass =
    variant === 'footer' ? 'vysiongids-listing-panel-amenities--footer' : 'vysiongids-listing-panel-amenities--inline'

  return (
    <div className={`vysiongids-listing-panel-amenities ${variantClass}${className ? ` ${className}` : ''}`}>
      <ul className="vysiongids-listing-panel-amenities-list">
        {amenityList.map((id) => (
          <li key={id} className="vysiongids-listing-panel-amenity-item">
            <span className="vysiongids-listing-panel-amenity-icon" aria-hidden>
              <ListingAmenityIcon id={id} />
            </span>
            <span className="vysiongids-listing-panel-amenity-label">{localizedListingAmenityLabel(t, id)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
