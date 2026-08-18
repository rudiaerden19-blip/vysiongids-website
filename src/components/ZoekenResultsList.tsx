'use client'

import { useEffect, useMemo, useState } from 'react'
import ListingPanel from '@/components/ListingPanel'
import type { Listing } from '@/lib/listing-types'
import {
  getBrowserGeolocation,
  MAX_GEO_ACCURACY_M_FOR_DISTANCE,
} from '@/lib/browser-geolocation'
import { listingStoredCoordsAreFallback } from '@/lib/listing-geo-fallback'
import { compareListingsByName } from '@/lib/listing-alphabetical-sort'
import { listingCoordinatesForDistance, listingDistanceKmFrom } from '@/lib/listings'

type Props = {
  listings: Listing[]
  initialNear: { lat: number; lng: number } | null
  /** Alleen bij «dichtbij» / «nu open» op afstand; anders alfabetisch op zaaknaam. */
  sortByDistance?: boolean
}

type TravelLeg = { km: number; minutes: number }

function listingNeedsClientGeocode(listing: Listing): boolean {
  return listingStoredCoordsAreFallback(listing)
}

export default function ZoekenResultsList({ listings, initialNear, sortByDistance = false }: Props) {
  const [rows, setRows] = useState(listings)
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(initialNear)
  const [geoDenied, setGeoDenied] = useState(false)
  const [geoTooCoarse, setGeoTooCoarse] = useState(false)
  const [roadBySlug, setRoadBySlug] = useState<Record<string, TravelLeg>>({})

  useEffect(() => {
    setRows(listings)
  }, [listings])

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
    const slugs = listings.filter(listingNeedsClientGeocode).map((l) => l.slug).slice(0, 6)
    if (slugs.length === 0) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      void fetch('/api/gids/geocode-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { updates?: Array<{ slug: string; lat: number; lng: number }> } | null) => {
          if (cancelled || !data?.updates?.length) return
          const bySlug = new Map(data.updates.map((u) => [u.slug, u]))
          setRows((prev) =>
            prev.map((l) => {
              const u = bySlug.get(l.slug)
              return u ? { ...l, lat: u.lat, lng: u.lng } : l
            }),
          )
        })
        .catch(() => {})
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [listings])

  const coordKey = useMemo(
    () =>
      rows
        .map((l) => {
          const c = listingCoordinatesForDistance(l)
          return c ? `${l.slug}:${c.lat.toFixed(4)},${c.lng.toFixed(4)}` : l.slug
        })
        .join('|'),
    [rows],
  )

  useEffect(() => {
    if (!near) {
      setRoadBySlug({})
      return
    }
    const withCoords = rows
      .map((listing) => ({ listing, coords: listingCoordinatesForDistance(listing) }))
      .filter((row): row is { listing: Listing; coords: { lat: number; lng: number } } => row.coords != null)
    if (withCoords.length === 0) return

    let cancelled = false
    const timer = window.setTimeout(() => {
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
        .catch(() => {})
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [near, coordKey, rows])

  const sorted = useMemo(() => {
    if (sortByDistance && near) {
      return [...rows].sort((a, b) => {
        const roadA = roadBySlug[a.slug]?.km
        const roadB = roadBySlug[b.slug]?.km
        const ka = roadA ?? listingDistanceKmFrom(a, near) ?? Infinity
        const kb = roadB ?? listingDistanceKmFrom(b, near) ?? Infinity
        return ka - kb
      })
    }
    return [...rows].sort(compareListingsByName)
  }, [rows, near, roadBySlug, sortByDistance])

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
