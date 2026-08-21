import Link from 'next/link'
import type { Listing } from '@/lib/listing-types'

export default function BeheerDienstenPanel({ listing, slug }: { listing: Listing; slug: string }) {
  return (
    <div className="vysiongids-surface-card space-y-4 rounded-xl border border-sky-200 bg-sky-50/60 p-5">
      <h2 className="text-lg font-bold text-gray-900">Dienstenprofiel</h2>
      <p className="text-sm text-gray-700 leading-relaxed">
        Je profiel staat onder <strong>Publiciteit en diensten</strong>, niet in het horeca-zoeken. Lidmaatschap:{' '}
        <strong>€99/jaar</strong>.
        {!listing.dienstenActive ? (
          <>
            {' '}
            <span className="font-semibold text-amber-800">
              Je lidmaatschap is niet actief — neem contact op als je net betaald hebt en dit blijft staan.
            </span>
          </>
        ) : null}
      </p>
      <Link href={`/diensten/${slug}`} className="inline-block font-semibold text-accent hover:underline">
        Publiek dienstenprofiel bekijken →
      </Link>
      <p className="text-sm text-gray-600">
        Gegevens wijzigen (foto&apos;s, categorieën, tekst) kan binnenkort in beheer. Mail ons via je profieltelefoon
        voor dringende aanpassingen.
      </p>
    </div>
  )
}
