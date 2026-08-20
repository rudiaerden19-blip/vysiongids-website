'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import JobListingCard from '@/components/JobListingCard'
import {
  BELGIUM_PROVINCES,
  DEFAULT_PROVINCE_SLUG,
  REGION_COOKIE,
  type ProvinceSlug,
} from '@/lib/belgium-locations'
import { listingMatchesSearchLocation } from '@/lib/gids-search-locations'
import { normalizeSearchText } from '@/lib/gids-text'
import type { Listing } from '@/lib/listing-types'

const ALL_PROVINCES = 'all'

function readRegionCookie(): ProvinceSlug | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${REGION_COOKIE}=([^;]*)`))
  const raw = match?.[1]
  if (raw && BELGIUM_PROVINCES.some((p) => p.slug === raw)) return raw as ProvinceSlug
  return null
}

function listingInProvince(listing: Listing, province: string): boolean {
  if (province === ALL_PROVINCES) return true
  return listingMatchesSearchLocation(listing, [normalizeSearchText(province)])
}

type Props = {
  listings: Listing[]
}

export default function JobsPageClient({ listings }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [province, setProvince] = useState<string>(ALL_PROVINCES)

  useEffect(() => {
    const fromUrl = searchParams.get('prov')?.trim()
    if (fromUrl === ALL_PROVINCES) {
      setProvince(ALL_PROVINCES)
      return
    }
    if (fromUrl && BELGIUM_PROVINCES.some((p) => p.slug === fromUrl)) {
      setProvince(fromUrl)
      return
    }
    if (searchParams.has('prov')) return
    const fromCookie = readRegionCookie()
    setProvince(fromCookie ?? DEFAULT_PROVINCE_SLUG)
  }, [searchParams])

  const countsByProvince = useMemo(() => {
    const bySlug: Record<string, number> = {}
    for (const prov of BELGIUM_PROVINCES) {
      bySlug[prov.slug] = listings.filter((listing) => listingInProvince(listing, prov.slug)).length
    }
    return { total: listings.length, bySlug }
  }, [listings])

  const filtered = useMemo(
    () => listings.filter((listing) => listingInProvince(listing, province)),
    [listings, province],
  )

  function onProvinceChange(next: string) {
    setProvince(next)
    router.replace(`/jobs?prov=${encodeURIComponent(next)}`, { scroll: false })
  }

  return (
    <>
      <div className="vysiongids-jobs-intro">
        <h1 className="vysiongids-jobs-page-title">Jobs</h1>
        <p className="vysiongids-jobs-page-lead">
          Vacatures bij horeca in België — solliciteer rechtstreeks bij de zaak.
        </p>

        <div className="vysiongids-jobs-province-picker vysiongids-jobs-intro-picker">
          <label className="vysiongids-jobs-province-label" htmlFor="jobs-province">
            Provincie
          </label>
          <select
            id="jobs-province"
            className="vysiongids-jobs-province-select"
            value={province}
            onChange={(e) => onProvinceChange(e.target.value)}
          >
            <option value={ALL_PROVINCES}>Heel België ({countsByProvince.total})</option>
            {BELGIUM_PROVINCES.map((prov) => (
              <option key={prov.slug} value={prov.slug}>
                {prov.label} ({countsByProvince.bySlug[prov.slug] ?? 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="vysiongids-jobs-listings">
      {filtered.length === 0 ? (
        <p className="vysiongids-jobs-empty">
          {listings.length === 0
            ? 'Momenteel geen open vacatures in de gids.'
            : 'Geen vacatures in deze provincie. Kies «Heel België» of een andere provincie.'}
        </p>
      ) : (
        <ul className="vysiongids-jobs-grid">
          {filtered.map((listing) => (
            <li key={listing.slug}>
              <JobListingCard listing={listing} />
            </li>
          ))}
        </ul>
      )}
      </div>
    </>
  )
}
