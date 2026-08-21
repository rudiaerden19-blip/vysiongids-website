'use client'

import { useState } from 'react'
import type { Listing } from '@/lib/listing-types'
import { formatListingAddressLines } from '@/lib/listing-display'
import { listingGoogleSatelliteEmbedUrl } from '@/lib/gids-listing-navigation'
import ListingNavigationButtons from '@/components/ListingNavigationButtons'

export type ListingMapProps = {
  listing: Listing
  mapPin?: { lat: number; lng: number }
}

export default function ListingMapLazy({ listing, mapPin }: ListingMapProps) {
  const { street, cityLine } = formatListingAddressLines(listing)
  const embedSrc = listingGoogleSatelliteEmbedUrl(listing)
  const [showEmbed, setShowEmbed] = useState(false)

  return (
    <section className="vysiongids-zaak-map-panel vysiongids-zaak-panel mt-8 bg-white p-4 sm:p-5" aria-label="Locatie op de kaart">
      <h2 className="text-lg font-bold text-gray-900">Adres</h2>
      <div className="vysiongids-listing-map relative mt-3 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        {showEmbed ? (
          <>
            <iframe
              title={`Satellietkaart: ${street}, ${cityLine}`}
              src={embedSrc}
              className="vysiongids-listing-map-iframe block h-[min(420px,55vh)] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              tabIndex={-1}
            />
            <div className="vysiongids-listing-map-shield" aria-hidden title="" />
          </>
        ) : (
          <button
            type="button"
            className="vysiongids-listing-map-placeholder"
            onClick={() => setShowEmbed(true)}
          >
            <span className="vysiongids-listing-map-placeholder-title">Satellietkaart tonen</span>
            <span className="vysiongids-listing-map-placeholder-sub">
              {street}, {cityLine}
            </span>
            <span className="vysiongids-listing-map-placeholder-hint">Tik om Google Maps te laden</span>
          </button>
        )}
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
