'use client'

import { useEffect, useMemo, useState } from 'react'
import ListingPanel from '@/components/ListingPanel'
import type { Listing } from '@/lib/listing-types'
import { getBrowserGeolocation } from '@/lib/browser-geolocation'
import { listingDistanceKmFrom } from '@/lib/listings'

type Props = {
  listings: Listing[]
  initialNear: { lat: number; lng: number } | null
}

export default function ZoekenResultsList({ listings, initialNear }: Props) {
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(initialNear)
  const [geoDenied, setGeoDenied] = useState(false)

  useEffect(() => {
    if (initialNear) {
      setNear(initialNear)
      return
    }
    let cancelled = false
    void getBrowserGeolocation()
      .then((point) => {
        if (!cancelled) setNear(point)
      })
      .catch(() => {
        if (!cancelled) setGeoDenied(true)
      })
    return () => {
      cancelled = true
    }
  }, [initialNear])

  const sorted = useMemo(() => {
    if (!near) return listings
    return [...listings].sort(
      (a, b) => listingDistanceKmFrom(a, near) - listingDistanceKmFrom(b, near),
    )
  }, [listings, near])

  return (
    <>
      {!near && geoDenied ? (
        <p className="vysiongids-zoeken-travel-hint" role="status">
          Sta locatie toe in je browser om op elke kaart <strong>km</strong> en <strong>rijtijd</strong> te zien (rechts
          onder «Opent …» / «Nu open», met knop Waze).
        </p>
      ) : null}
      <ul
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        {sorted.map((listing) => (
          <li key={listing.slug}>
            <ListingPanel
              listing={listing}
              distanceKm={near ? listingDistanceKmFrom(listing, near) : undefined}
            />
          </li>
        ))}
      </ul>
    </>
  )
}
