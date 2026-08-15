import Link from 'next/link'
import { notFound } from 'next/navigation'
import ListingMenuPdfViewer from '@/components/ListingMenuPdfViewer'
import SiteHeader from '@/components/SiteHeader'
import { getListingBySlug } from '@/lib/listings'

type Props = { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic'

export default async function ZaakMenuPage({ params }: Props) {
  const { slug } = await params
  const listing = await getListingBySlug(slug)
  if (!listing) notFound()

  const zaakHref = `/zaak/${slug}`

  if (listing.menuPdfUrl?.trim()) {
    return (
      <ListingMenuPdfViewer
        pdfUrl={listing.menuPdfUrl.trim()}
        zaakHref={zaakHref}
        zaakName={listing.name}
      />
    )
  }

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap vysiongids-menu-empty">
        <h1 className="text-xl font-bold text-gray-900">Menu · {listing.name}</h1>
        <p className="mt-3 text-gray-600">
          Deze zaak heeft nog geen menu online gezet. De eigenaar kan een menu-link of PDF toevoegen in
          beheer.
        </p>
        <Link href={zaakHref} className="vysiongids-menu-empty-back mt-6 inline-block font-semibold text-accent">
          Terug naar {listing.name}
        </Link>
      </main>
    </>
  )
}
