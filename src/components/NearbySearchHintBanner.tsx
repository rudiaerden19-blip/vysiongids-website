'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { getBrowserGeolocation } from '@/lib/browser-geolocation'
import {
  buildGidsSearchPath,
  parseNearPointFromSearchParams,
  searchQueryWantsNearby,
} from '@/lib/gids-search-url'

export default function NearbySearchHintBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') ?? ''
  const wantsNearby = searchQueryWantsNearby(q)
  const hasNear = Boolean(
    parseNearPointFromSearchParams({
      nearLat: searchParams.get('nearLat') ?? undefined,
      nearLng: searchParams.get('nearLng') ?? undefined,
    }),
  )

  if (!wantsNearby || hasNear) return null

  return (
    <p
      className="vysiongids-nearby-hint"
      role="status"
      style={{
        margin: '0 0 1rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        background: '#eff6ff',
        color: '#1e3a5f',
        fontSize: '0.9375rem',
      }}
    >
      Voor «dichtbij» hebben we je locatie nodig.{' '}
      <button
        type="button"
        style={{
          fontWeight: 600,
          color: '#0e5d82',
          textDecoration: 'underline',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          font: 'inherit',
        }}
        onClick={() => {
          void getBrowserGeolocation()
            .then((near) => {
              router.replace(
                buildGidsSearchPath({
                  q,
                  type: searchParams.get('type') ?? undefined,
                  prov: searchParams.get('prov') ?? undefined,
                  near,
                }),
              )
            })
            .catch(() => {
              window.alert('Locatie niet beschikbaar. Sta locatie toe in je browser of zoek op stad of postcode.')
            })
        }}
      >
        Sta locatie toe
      </button>
    </p>
  )
}
