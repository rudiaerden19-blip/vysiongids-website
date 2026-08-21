import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import DienstenDetailGallery from '@/components/DienstenDetailGallery'
import { getDienstenListingBySlug } from '@/lib/listings-diensten'
import { formatListingAddressLines, listingPhotoUrls } from '@/lib/listing-display'
import { serviceCategoryLabel } from '@/lib/gids-service-categories'
import { provinceLabel } from '@/lib/belgium-locations'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const listing = await getDienstenListingBySlug(slug)
  if (!listing) return { title: 'Leverancier' }
  return { title: `${listing.name} — diensten` }
}

export default async function DienstenProfielPage({ params }: Props) {
  const { slug } = await params
  const listing = await getDienstenListingBySlug(slug)
  if (!listing) notFound()

  const { street, cityLine } = formatListingAddressLines(listing)
  const tel = listing.phone?.trim()
  const mail = listing.email?.trim()
  const telHref = tel ? `tel:${tel.replace(/[^\d+]/g, '')}` : null
  const mailHref = mail && mail.includes('@') ? `mailto:${mail}` : null

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap mx-auto max-w-4xl">
        <p className="mb-4 text-sm">
          <Link href="/diensten" className="font-semibold text-accent hover:underline">
            ← Publiciteit en diensten
          </Link>
        </p>

        <div className="vysiongids-diensten-detail-grid">
          <DienstenDetailGallery urls={listingPhotoUrls(listing)} alt={listing.name} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{listing.name}</h1>
            {listing.serviceCategories?.length ? (
              <ul className="vysiongids-diensten-card-cats mt-2">
                {listing.serviceCategories.map((id) => (
                  <li key={id}>{serviceCategoryLabel(id)}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-4 text-gray-700">
              {street}
              <br />
              {cityLine}
              {listing.province ? (
                <>
                  <br />
                  <span className="text-gray-500">{provinceLabel(listing.province)}</span>
                </>
              ) : null}
            </p>
            {tel ? <p className="mt-2 font-medium text-gray-900">{tel}</p> : null}
            {listing.website ? (
              <p className="mt-2">
                <a href={listing.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">
                  Website
                </a>
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {telHref ? (
                <a href={telHref} className="vysiongids-diensten-action-btn">
                  Contacteer verkoper
                </a>
              ) : mailHref ? (
                <a href={mailHref} className="vysiongids-diensten-action-btn">
                  Contacteer verkoper
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {listing.serviceDescription ? (
          <section className="vysiongids-diensten-detail-desc mt-10">
            <h2 className="text-lg font-bold text-gray-900">Over dit bedrijf</h2>
            <p className="mt-2 whitespace-pre-wrap text-gray-700 leading-relaxed">{listing.serviceDescription}</p>
          </section>
        ) : null}
      </main>
    </>
  )
}
