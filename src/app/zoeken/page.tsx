import Link from 'next/link'
import { Suspense } from 'react'
import ListingPanel from '@/components/ListingPanel'
import SearchForm from '@/components/SearchForm'
import SiteHeader from '@/components/SiteHeader'
import { searchListings } from '@/lib/listings'

type Props = {
  searchParams: Promise<{ q?: string; type?: string }>
}

export default async function ZoekenPage({ searchParams }: Props) {
  const sp = await searchParams
  const results = searchListings({ q: sp.q, type: sp.type })

  const qLabel = sp.q?.trim()
  const title = qLabel ? `Zaken in «${qLabel}»` : 'Alle zaken'

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
        <p className="mb-6 text-gray-600">
          {results.length} {results.length === 1 ? 'zaak' : 'zaken'} · Bestel rechtstreeks bij de zaak
        </p>

        <Suspense fallback={null}>
          <div className="mb-8">
            <SearchForm compact />
          </div>
        </Suspense>

        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-gray-700">Geen zaken gevonden. Probeer een andere stad of type.</p>
            <Link href="/zoeken" className="mt-3 inline-block font-semibold text-accent hover:underline">
              Toon alle zaken
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
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
