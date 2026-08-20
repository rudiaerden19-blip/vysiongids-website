import type { Listing } from '@/lib/listing-types'
import { formatListingAddressLines } from '@/lib/listing-display'
import { listingGoogleSatelliteEmbedUrl } from '@/lib/gids-listing-navigation'
import ListingNavigationButtons from '@/components/ListingNavigationButtons'

export type ListingMapProps = {
  listing: Listing
  /** Geocode-pin voor Waze (satelliet = Google op basis van adres). */
  mapPin?: { lat: number; lng: number }
}

export default function ListingMap({ listing, mapPin }: ListingMapProps) {
  const { street, cityLine } = formatListingAddressLines(listing)
  const embedSrc = listingGoogleSatelliteEmbedUrl(listing)

  return (
    <section className="mt-8" aria-label="Locatie op de kaart">
      <h2 className="text-lg font-bold text-gray-900">Adres</h2>
      <div className="vysiongids-listing-map relative mt-3 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <iframe
          title={`Satellietkaart: ${street}, ${cityLine}`}
          src={embedSrc}
          className="vysiongids-listing-map-iframe block h-[min(420px,55vh)] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          tabIndex={-1}
        />
        <div
          className="vysiongids-listing-map-shield"
          aria-hidden
          title=""
        />
      </div>
      <p className="mt-2 text-sm text-gray-600">
        {street}, {cityLine}
      </p>
      <div className="mt-3">
        <ListingNavigationButtons listing={listing} mapPin={mapPin} />
      </div>
    </section>
  )
}
