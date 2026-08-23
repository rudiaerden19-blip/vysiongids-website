'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import JobListingCard from '@/components/JobListingCard'
import { useLanguage } from '@/i18n/LanguageProvider'
import {
  BELGIUM_PROVINCES,
  DEFAULT_PROVINCE_SLUG,
  REGION_COOKIE,
  type ProvinceSlug,
} from '@/lib/belgium-locations'
import { localizedProvinceLabel } from '@/lib/geo-i18n'
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
  const { t } = useLanguage()
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
        <h1 className="vysiongids-jobs-page-title">{t('jobs.title')}</h1>
        <p className="vysiongids-jobs-page-lead">{t('jobs.lead')}</p>

        <div className="vysiongids-jobs-province-picker vysiongids-jobs-intro-picker">
          <label className="vysiongids-jobs-province-label" htmlFor="jobs-province">
            {t('jobs.provinceLabel')}
          </label>
          <select
            id="jobs-province"
            className="vysiongids-jobs-province-select"
            value={province}
            onChange={(e) => onProvinceChange(e.target.value)}
          >
            <option value={ALL_PROVINCES}>{t('common.allBelgium')}</option>
            {BELGIUM_PROVINCES.map((prov) => (
              <option key={prov.slug} value={prov.slug}>
                {localizedProvinceLabel(prov.slug, t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="vysiongids-jobs-listings">
        {filtered.length === 0 ? (
          <p className="vysiongids-jobs-empty">
            {listings.length === 0 ? t('jobs.emptyNone') : t('jobs.emptyProvince')}
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
