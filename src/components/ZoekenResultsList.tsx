'use client'

import { useEffect, useMemo, useState } from 'react'
import ListingPanel from '@/components/ListingPanel'
import type { Listing } from '@/lib/listing-types'
import {
  getBrowserGeolocation,
  MAX_GEO_ACCURACY_M_FOR_DISTANCE,
} from '@/lib/browser-geolocation'
import { listingCoordinatesForDistance, listingDistanceKmFrom } from '@/lib/listings'

type Props = {
  listings: Listing[]
  initialNear: { lat: number; lng: number } | null
}

type TravelLeg = { km: number; minutes: number }

export default function ZoekenResultsList({ listings, initialNear }: Props) {
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(initialNear)
  const [geoDenied, setGeoDenied] = useState(false)
  const [geoTooCoarse, setGeoTooCoarse] = useState(false)
  const [roadBySlug, setRoadBySlug] = useState<Record<string, TravelLeg>>({})

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

  useEffect(() => {
    if (!near) {
      setRoadBySlug({})
      return
    }
    const withCoords = listings
      .map((listing) => ({ listing, coords: listingCoordinatesForDistance(listing) }))
      .filter((row): row is { listing: Listing; coords: { lat: number; lng: number } } => row.coords != null)
    if (withCoords.length === 0) return

    let cancelled = false
    void fetch('/api/gids/driving-distances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: near,
        destinations: withCoords.map((row) => row.coords),
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { legs?: Array<{ km: number; minutes: number } | null> } | null) => {
        if (cancelled || !data?.legs) return
        const next: Record<string, TravelLeg> = {}
        withCoords.forEach((row, i) => {
          const leg = data.legs?.[i]
          if (leg && Number.isFinite(leg.km)) {
            next[row.listing.slug] = { km: leg.km, minutes: leg.minutes }
          }
        })
        setRoadBySlug(next)
      })
      .catch(() => {
        /* hemelsbreed blijft fallback */
      })

    return () => {
      cancelled = true
    }
  }, [near, listings])

  const sorted = useMemo(() => {
    if (!near) return listings
    return [...listings].sort((a, b) => {
      const roadA = roadBySlug[a.slug]?.km
      const roadB = roadBySlug[b.slug]?.km
      const ka = roadA ?? listingDistanceKmFrom(a, near) ?? Infinity
      const kb = roadB ?? listingDistanceKmFrom(b, near) ?? Infinity
      return ka - kb
    })
  }, [listings, near, roadBySlug])

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
          const road = roadBySlug[listing.slug]
          const straight = near ? listingDistanceKmFrom(listing, near) : null
          const distanceKm = road?.km ?? straight ?? undefined
          return (
            <li key={listing.slug}>
              <ListingPanel
                listing={listing}
                distanceKm={distanceKm ?? undefined}
                driveMinutes={road?.minutes}
              />
            </li>
          )
        })}
      </ul>
    </>
  )
}
