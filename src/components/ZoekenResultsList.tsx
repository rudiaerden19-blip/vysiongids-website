'use client'

import { useEffect, useMemo, useState } from 'react'
import ListingPanel from '@/components/ListingPanel'
import type { Listing } from '@/lib/listing-types'
import {
  getBrowserGeolocation,
  MAX_GEO_ACCURACY_M_FOR_DISTANCE,
} from '@/lib/browser-geolocation'
import { listingDistanceKmFrom } from '@/lib/listings'

type Props = {
  listings: Listing[]
  initialNear: { lat: number; lng: number } | null
}

export default function ZoekenResultsList({ listings, initialNear }: Props) {
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(initialNear)
  const [geoDenied, setGeoDenied] = useState(false)
  const [geoTooCoarse, setGeoTooCoarse] = useState(false)

  useEffect(() => {
    if (initialNear) {
      setNear(initialNear)
      return
    }
    let cancelled = false
    void getBrowserGeolocation()
      .then((point) => {
        if (cancelled) return
        if (point.accuracyM > MAX_GEO_ACCURACY_M_FOR_DISTANCE) {
          setGeoTooCoarse(true)
          setNear(null)
          return
        }
        setNear({ lat: point.lat, lng: point.lng })
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
    return [...listings].sort((a, b) => {
      const ka = listingDistanceKmFrom(a, near) ?? Infinity
      const kb = listingDistanceKmFrom(b, near) ?? Infinity
      return ka - kb
    })
  }, [listings, near])

  return (
    <>
      {!near && geoDenied ? (
        <p className="vysiongids-zoeken-travel-hint" role="status">
          Sta locatie toe in je browser om op elke kaart <strong>km</strong> en <strong>rijtijd</strong> te zien (rechts
          onder «Opent …» / «Nu open», met knop Waze).
        </p>
      ) : null}
      {!near && geoTooCoarse ? (
        <p className="vysiongids-zoeken-travel-hint" role="status">
          Je locatie is te onnauwkeurig (vaak op desktop). Gebruik een telefoon met GPS, of tik op <strong>Waze</strong>{' '}
          op de kaart voor de echte route.
        </p>
      ) : null}
      <ul
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        {sorted.map((listing) => {
          const distanceKm = near ? listingDistanceKmFrom(listing, near) : undefined
          return (
            <li key={listing.slug}>
              <ListingPanel listing={listing} distanceKm={distanceKm ?? undefined} />
            </li>
          )
        })}
      </ul>
    </>
  )
}
