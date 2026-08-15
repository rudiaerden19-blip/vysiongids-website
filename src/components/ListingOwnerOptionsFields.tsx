import { OWNER_PROFILE_AMENITIES, ownerAmenitiesFromListing } from '@/lib/gids-owner-amenities'
import type { ListingAmenityId } from '@/lib/listing-types'

type Props = {
  /** Beheer: vooraf aangevinkte opties uit listing */
  initialAmenities?: ListingAmenityId[]
}

export default function ListingOwnerOptionsFields({ initialAmenities }: Props) {
  const checked = initialAmenities ? ownerAmenitiesFromListing(initialAmenities) : null

  return (
    <fieldset className="vysiongids-owner-options">
      <legend className="vysiongids-form-label">Extra info voor je online profiel</legend>
      <p className="mt-0.5 text-xs text-gray-500">Optioneel — wat je aanvinkt, tonen we op je zaakpagina bij INFO.</p>
      <ul className="vysiongids-owner-options-list">
        {OWNER_PROFILE_AMENITIES.map(({ id, label }) => (
          <li key={id}>
            <label className="vysiongids-owner-options-item">
              <input
                type="checkbox"
                name={`amenity_${id}`}
                defaultChecked={checked?.has(id) ?? false}
                className="vysiongids-owner-options-checkbox"
              />
              <span>{label}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
