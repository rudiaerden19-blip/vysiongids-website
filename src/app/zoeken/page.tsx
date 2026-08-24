import Link from 'next/link'
import { Suspense } from 'react'
import NearbySearchHintBanner from '@/components/NearbySearchHintBanner'
import NearbySearchLocationSync from '@/components/NearbySearchLocationSync'
import SearchForm from '@/components/SearchForm'
import SearchResultsNavContextSync from '@/components/SearchResultsNavContextSync'
import SearchResultsVoiceAnnouncement from '@/components/SearchResultsVoiceAnnouncement'
import ZoekenResultsList from '@/components/ZoekenResultsList'
import DienstenListingCard from '@/components/DienstenListingCard'
import SiteHeader from '@/components/SiteHeader'
import { tServer } from '@/i18n/server-translate'
import { getServerLocale } from '@/i18n/get-server-locale'
import { localizedProvinceLabelForLocale } from '@/lib/geo-i18n'
import { parseListingSearchQuery } from '@/lib/gids-listing-search'
import { parseNearPointFromSearchParams } from '@/lib/gids-search-url'
import { searchListings } from '@/lib/listings'

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
  const dienstenResults = search.dienstenListings
  const hasAnyResults = results.length > 0 || dienstenResults.length > 0

  const locale = await getServerLocale()
  const parsedQ = parseListingSearchQuery(sp.q ?? '')
  const qLabel = sp.q?.trim()
  const provLabel = sp.prov?.trim() ? localizedProvinceLabelForLocale(sp.prov, locale) : null

  let title: string
  if (qLabel) {
    if (parsedQ.nearby && near) {
      const suffix = parsedQ.freeText
        ? await tServer('zoeken.titleNearbySuffixFreeText', { freeText: parsedQ.freeText })
        : ''
      title = await tServer('zoeken.titleNearby', { suffix })
    } else {
      title = await tServer('zoeken.titleInQuery', { query: qLabel })
    }
  } else if (provLabel) {
    title = await tServer('zoeken.titleInProvince', { provinceLabel: provLabel })
  } else {
    title = await tServer('zoeken.titleAll')
  }

  const lead = await tServer('zoeken.lead')
  const leadCapped = search.capped ? await tServer('zoeken.leadCapped') : ''
  const emptyResults = await tServer('zoeken.emptyResults')
  const dienstenHeading = await tServer('zoeken.dienstenHeading')
  const dienstenAllLink = await tServer('zoeken.dienstenAllLink')
  const showAllLabel = sp.prov?.trim()
    ? await tServer('zoeken.showAllInProvince', { provinceLabel: provLabel ?? sp.prov!.trim() })
    : await tServer('zoeken.showAll')

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
          {lead}
          {leadCapped}
        </p>

        <Suspense fallback={null}>
          <NearbySearchLocationSync />
          <NearbySearchHintBanner />
          <SearchResultsVoiceAnnouncement />
          <SearchResultsNavContextSync
            listings={[
              ...dienstenResults.map((l) => ({ slug: l.slug, name: l.name })),
              ...results.map((l) => ({ slug: l.slug, name: l.name })),
            ]}
            query={sp.q}
          />
        </Suspense>

        <Suspense fallback={null}>
          <div className="vysiongids-zoeken-search" style={{ marginBottom: '2rem', width: '100%' }}>
            <SearchForm compact />
          </div>
        </Suspense>

        {!hasAnyResults ? (
          <div
            style={{
              borderRadius: '0.75rem',
              border: '1px dashed #d1d5db',
              background: '#f9fafb',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, color: '#374151' }}>{emptyResults}</p>
            <Link
              href={sp.prov?.trim() ? `/zoeken?prov=${encodeURIComponent(sp.prov.trim())}` : '/zoeken'}
              style={{ marginTop: '0.75rem', display: 'inline-block', fontWeight: 600, color: '#0e5d82' }}
            >
              {showAllLabel}
            </Link>
          </div>
        ) : (
          <>
            {dienstenResults.length > 0 ? (
              <section className="vysiongids-zoeken-diensten" aria-label={dienstenHeading}>
                <div className="vysiongids-zoeken-diensten-head">
                  <h2 className="vysiongids-zoeken-diensten-title">{dienstenHeading}</h2>
                  <Link href="/diensten" className="vysiongids-zoeken-diensten-all">
                    {dienstenAllLink}
                  </Link>
                </div>
                <ul className="vysiongids-diensten-results">
                  {dienstenResults.map((listing) => (
                    <li key={listing.slug}>
                      <DienstenListingCard listing={listing} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {results.length > 0 ? (
              <ZoekenResultsList
                listings={results}
                initialNear={near}
                sortByDistance={Boolean(near && (parsedQ.nearby || parsedQ.openNow))}
              />
            ) : null}
          </>
        )}
      </main>
    </>
  )
}
