import Link from 'next/link'
import { Suspense } from 'react'
import ListingPanel from '@/components/ListingPanel'
import SearchForm from '@/components/SearchForm'
import SiteHeader from '@/components/SiteHeader'
import { searchListings } from '@/lib/listings'
import { provinceLabel } from '@/lib/belgium-locations'

type Props = {
  searchParams: Promise<{ q?: string; type?: string; prov?: string }>
}

export default async function ZoekenPage({ searchParams }: Props) {
  const sp = await searchParams
  const results = await searchListings({ q: sp.q, type: sp.type, prov: sp.prov })

  const qLabel = sp.q?.trim()
  const provLabel = sp.prov?.trim() ? provinceLabel(sp.prov) : null
  const title = qLabel
    ? `Zaken in «${qLabel}»`
    : provLabel
      ? `Zaken in ${provLabel}`
      : 'Alle zaken'

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
          {results.length} {results.length === 1 ? 'zaak' : 'zaken'} · Bestel rechtstreeks bij de zaak
        </p>

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
            <p style={{ margin: 0, color: '#374151' }}>Geen zaken gevonden. Probeer een andere stad of type.</p>
            <Link href="/zoeken" style={{ marginTop: '0.75rem', display: 'inline-block', fontWeight: 600, color: '#0e5d82' }}>
              Toon alle zaken
            </Link>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {results.map((listing) => (
              <li key={listing.slug}>
                <ListingPanel listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
