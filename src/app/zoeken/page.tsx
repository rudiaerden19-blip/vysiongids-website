import Link from 'next/link'
import { Suspense } from 'react'
import NearbySearchHintBanner from '@/components/NearbySearchHintBanner'
import NearbySearchLocationSync from '@/components/NearbySearchLocationSync'
import SearchForm from '@/components/SearchForm'
import SearchResultsNavContextSync from '@/components/SearchResultsNavContextSync'
import SearchResultsVoiceAnnouncement from '@/components/SearchResultsVoiceAnnouncement'
import ZoekenResultsList from '@/components/ZoekenResultsList'
import SiteHeader from '@/components/SiteHeader'
import { parseListingSearchQuery } from '@/lib/gids-listing-search'
import { parseNearPointFromSearchParams } from '@/lib/gids-search-url'
import { searchListings } from '@/lib/listings'
import { fetchPublishedHorecaListingCountFromDb } from '@/lib/gids-listings-db'
import { publicHorecaZakenDisplayCount } from '@/lib/gids-public-stats'
import { provinceLabel } from '@/lib/belgium-locations'

type Props = {
  searchParams: Promise<{ q?: string; type?: string; prov?: string; nearLat?: string; nearLng?: string }>
}

export const revalidate = 60

export default async function ZoekenPage({ searchParams }: Props) {
  const sp = await searchParams
  const near = parseNearPointFromSearchParams(sp)
  const search = await searchListings({
    q: sp.q,
    type: sp.type,
    prov: sp.prov,
    nearLat: near?.lat,
    nearLng: near?.lng,
  })
  const results = search.listings

  const parsedQ = parseListingSearchQuery(sp.q ?? '')
  const qLabel = sp.q?.trim()
  const provLabel = sp.prov?.trim() ? provinceLabel(sp.prov) : null
  const title = qLabel
    ? parsedQ.nearby && near
      ? `Dichtbij${parsedQ.freeText ? ` · ${parsedQ.freeText}` : ''}`
      : `Zaken in «${qLabel}»`
    : provLabel
      ? `Zaken in ${provLabel}`
      : 'Alle zaken'

  const isAllHorecaZaken =
    !qLabel &&
    !provLabel &&
    !(near && (parsedQ.nearby || parsedQ.openNow)) &&
    (sp.type ?? 'all') === 'all'

  let displayTotal = search.total
  if (isAllHorecaZaken) {
    const dbHoreca = await fetchPublishedHorecaListingCountFromDb()
    const actual = dbHoreca > 0 ? dbHoreca : search.total
    displayTotal = publicHorecaZakenDisplayCount(actual)
  }

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap">
        <h1
          style={{
            margin: '0 0 0.5rem',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          {title}
        </h1>
        <p style={{ margin: '0 0 1.5rem', color: '#4b5563', fontSize: '1rem' }}>
          {!sp.prov?.trim() ? (
            <>
              {displayTotal} {displayTotal === 1 ? 'zaak' : 'zaken'}
              {search.capped ? ` (eerste ${results.length} getoond — verfijn je zoekopdracht)` : ''}
              {' · '}
            </>
          ) : null}
          Bestel rechtstreeks bij de zaak
        </p>

        <Suspense fallback={null}>
          <NearbySearchLocationSync />
          <NearbySearchHintBanner />
          <SearchResultsVoiceAnnouncement />
          <SearchResultsNavContextSync
            listings={results.map((l) => ({ slug: l.slug, name: l.name }))}
            query={sp.q}
          />
        </Suspense>

        <Suspense fallback={null}>
          <div className="vysiongids-zoeken-search" style={{ marginBottom: '2rem', width: '100%' }}>
            <SearchForm compact />
          </div>
        </Suspense>

        {results.length === 0 ? (
          <div
            style={{
              borderRadius: '0.75rem',
              border: '1px dashed #d1d5db',
              background: '#f9fafb',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, color: '#374151' }}>
              Geen zaken gevonden. Probeer een andere stad, keukentype (bv. Belgische keuken) of voorziening (bv.
              glutenvrij, parking).
            </p>
            <Link
              href={sp.prov?.trim() ? `/zoeken?prov=${encodeURIComponent(sp.prov.trim())}` : '/zoeken'}
              style={{ marginTop: '0.75rem', display: 'inline-block', fontWeight: 600, color: '#0e5d82' }}
            >
              {sp.prov?.trim() ? `Toon alle zaken in ${provLabel ?? sp.prov}` : 'Toon alle zaken'}
            </Link>
          </div>
        ) : (
          <ZoekenResultsList
            listings={results}
            initialNear={near}
            sortByDistance={Boolean(near && (parsedQ.nearby || parsedQ.openNow))}
          />
        )}
      </main>
    </>
  )
}
