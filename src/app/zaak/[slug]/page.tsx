import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import ListingInfoSection from '@/components/ListingInfoSection'
import ListingMap from '@/components/ListingMapClient'
import ListingNavigationButtons from '@/components/ListingNavigationButtons'
import {
  formatDeliveryFee,
  formatListingAddressLines,
  formatMinOrder,
  getAllListings,
  getListingBySlug,
  getListingTypeLabel,
} from '@/lib/listings'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getAllListings().map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const listing = getListingBySlug(slug)
  if (!listing) return { title: 'Zaak niet gevonden' }
  return {
    title: `${listing.name} · ${listing.city}`,
    description: `Bestel online bij ${listing.name} in ${listing.city}. ${getListingTypeLabel(listing.type)}.`,
  }
}

export default async function ZaakPage({ params }: Props) {
  const { slug } = await params
  const listing = getListingBySlug(slug)
  if (!listing) notFound()

  const typeLabel = getListingTypeLabel(listing.type)
  const minOrder = formatMinOrder(listing)
  const { street, cityLine } = formatListingAddressLines(listing)

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap">
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <span className="mx-2">|</span>
          <Link href="/zoeken" className="hover:text-accent">
            Zoeken
          </Link>
          <span className="mx-2">|</span>
          <span className="text-gray-800">{listing.city}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div>
            <h1 className="text-3xl font-bold text-accent sm:text-4xl">{listing.name}</h1>
            <p className="mt-2 flex items-start gap-2 text-gray-600">
              <span aria-hidden>📍</span>
              <span>
                {street}
                <br />
                {cityLine}
              </span>
            </p>
            <p className="mt-2 text-sm font-medium text-gray-700">{typeLabel}</p>

            <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100">
              <Image src={listing.photoUrl} alt={listing.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 720px" />
            </div>

            <ListingInfoSection listing={listing} />

            <ListingMap listing={listing} />

            <section className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-bold text-gray-900">Beoordeling</h2>
              <p className="mt-2 flex items-center gap-2 text-gray-700">
                <span className="text-2xl text-amber-500">★</span>
                <span className="text-xl font-bold">{listing.ratingAvg.toFixed(1)}</span>
                <span className="text-gray-500">({listing.ratingCount}+ beoordelingen)</span>
              </p>
            </section>

            <section className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-bold text-gray-900">Bestellen</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-gray-500">Levertijd</dt>
                  <dd>{listing.deliveryTimeMin}–{listing.deliveryTimeMax} min</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">Bezorging</dt>
                  <dd>{formatDeliveryFee(listing)}</dd>
                </div>
                {minOrder ? (
                  <div>
                    <dt className="font-semibold text-gray-500">Minimum</dt>
                    <dd>{minOrder}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <p className="text-sm text-gray-600">Bestel rechtstreeks bij deze zaak — geen commissie via Vysiongids.</p>
              <a
                href={listing.orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-accent py-3.5 text-center text-lg font-bold text-white transition hover:bg-accent/90"
              >
                Bestel
              </a>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Route</p>
                <ListingNavigationButtons listing={listing} compact />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
