import ListingAmenityIcon from '@/components/ListingAmenityIcon'
import type { Listing } from '@/lib/listing-types'
import { resolveListingAmenityList } from '@/lib/listing-amenity-list'
import { AMENITY_LABELS } from '@/lib/listing-info'

type Props = {
  listing: Listing
  className?: string
}

/** Amenity-regels (zelfde stijl als zaak INFO) voor onderaan zoekkaart. */
export default function ListingPanelAmenityFooter({ listing, className }: Props) {
  const amenityList = resolveListingAmenityList(listing)
  if (amenityList.length === 0) return null

  return (
    <div className={`vysiongids-listing-panel-amenities${className ? ` ${className}` : ''}`}>
      <ul className="vysiongids-listing-panel-amenities-list">
        {amenityList.map((id) => (
          <li key={id} className="vysiongids-listing-panel-amenity-item">
            <span className="vysiongids-listing-panel-amenity-icon" aria-hidden>
              <ListingAmenityIcon id={id} />
            </span>
            <span className="vysiongids-listing-panel-amenity-label">{AMENITY_LABELS[id]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
