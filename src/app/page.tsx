import Link from 'next/link'
import { Suspense } from 'react'
import SearchForm from '@/components/SearchForm'
import SiteHeader from '@/components/SiteHeader'
import { getAllListings } from '@/lib/listings'

export default function HomePage() {
  const total = getAllListings().length

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-gray-100 bg-gradient-to-b from-accent/10 to-white px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              Vind frituren, kebab, pizza en meer
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Bestel rechtstreeks bij de zaak — geen commissie via deze gids.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-2xl">
            <Suspense fallback={null}>
              <SearchForm />
            </Suspense>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Begin hier</h2>
              <p className="mt-1 text-gray-600">
                {total} {total === 1 ? 'zaak' : 'zaken'} in de gids (demo-data — later 400+).
              </p>
            </div>
            <Link href="/zoeken" className="font-semibold text-accent hover:underline">
              Alle zaken bekijken →
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Vysiongids ·{' '}
        <a href="https://www.vysionorder.com" className="text-accent hover:underline">
          Vysion Order
        </a>
      </footer>
    </>
  )
}
