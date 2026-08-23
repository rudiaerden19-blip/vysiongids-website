import Link from 'next/link'
import type { Listing } from '@/lib/listing-types'
import { isDienstenListing } from '@/lib/listing-segment'

/** Server — meteen zichtbaar vóór client-formulier hydrateert. */
export function BeheerLoggedInHeader({ listing }: { listing: Listing }) {
  const dienstenAccount = isDienstenListing(listing)
  return (
    <div className="space-y-2">
      <p className="text-lg text-gray-800">
        Ingelogd als <strong>{listing.name}</strong>
      </p>
      {dienstenAccount ? (
        <Link href={`/diensten/${listing.slug}`} className="inline-block font-semibold text-accent hover:underline">
          Dienstenprofiel bekijken →
        </Link>
      ) : (
        <Link href={`/zaak/${listing.slug}`} className="inline-block font-semibold text-accent hover:underline">
          Publieke pagina bekijken →
        </Link>
      )}
    </div>
  )
}

export function BeheerMenuCardLink() {
  return (
    <div className="vysiongids-surface-card rounded-xl bg-sky-50/80 p-5">
      <h2 className="text-lg font-bold text-gray-900">Menukaart</h2>
      <p className="mt-2 text-sm text-gray-600">
        Voeg categorieën, producten en foto&apos;s toe — zoals in je kassa. Bezoekers openen het via de knop{' '}
        <strong>Menu</strong>.
      </p>
      <Link
        href="/beheer/menu"
        className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:opacity-95"
      >
        Menu beheren →
      </Link>
    </div>
  )
}
