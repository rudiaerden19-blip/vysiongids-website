'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { getBrowserGeolocation } from '@/lib/browser-geolocation'
import { buildGidsSearchPath, parseNearPointFromSearchParams, searchQueryWantsGeolocation } from '@/lib/gids-search-url'

/** Vraag locatie en vul nearLat/nearLng in de URL bij «dichtbij» of «nu open». */
export default function NearbySearchLocationSync() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const triedRef = useRef(false)

  useEffect(() => {
    if (triedRef.current) return
    const q = searchParams.get('q') ?? ''
    if (!searchQueryWantsGeolocation(q)) return
    if (parseNearPointFromSearchParams({
      nearLat: searchParams.get('nearLat') ?? undefined,
      nearLng: searchParams.get('nearLng') ?? undefined,
    })) {
      return
    }
    triedRef.current = true
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
        /* Geen locatie: resultaten zonder afstandssortering */
      })
  }, [router, searchParams])

  return null
}
