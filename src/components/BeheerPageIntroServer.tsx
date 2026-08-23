import Link from 'next/link'
import type { Listing } from '@/lib/listing-types'
import { isDienstenListing } from '@/lib/listing-segment'
import { tServer } from '@/i18n/server-translate'

export type BeheerLoggedInHeaderProps = {
  name: string
  slug: string
  listingSegment?: Listing['listingSegment']
}

/** Server — meteen zichtbaar vóór client-formulier hydrateert. */
export async function BeheerLoggedInHeader({ name, slug, listingSegment }: BeheerLoggedInHeaderProps) {
  const dienstenAccount = isDienstenListing({ listingSegment })
  const loggedInLine = await tServer('beheer.loggedInAs', { name })
  const dienstenLink = await tServer('beheer.viewDienstenProfile')
  const publicLink = await tServer('beheer.viewPublicPage')
  return (
    <div className="space-y-2">
      <p className="text-lg text-gray-800">{loggedInLine}</p>
      {dienstenAccount ? (
        <Link href={`/diensten/${slug}`} className="inline-block font-semibold text-accent hover:underline">
          {dienstenLink}
        </Link>
      ) : (
        <Link href={`/zaak/${slug}`} className="inline-block font-semibold text-accent hover:underline">
          {publicLink}
        </Link>
      )}
    </div>
  )
}

export async function BeheerMenuCardLink() {
  const [menuCardTitle, menuCardLead, menuCardCta] = await Promise.all([
    tServer('beheer.menuCardTitle'),
    tServer('beheer.menuCardLead'),
    tServer('beheer.menuCardCta'),
  ])
  return (
    <div className="vysiongids-surface-card rounded-xl bg-sky-50/80 p-5">
      <h2 className="text-lg font-bold text-gray-900">{menuCardTitle}</h2>
      <p className="mt-2 text-sm text-gray-600">{menuCardLead}</p>
      <Link
        href="/beheer/menu"
        className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 font-semibold text-white hover:opacity-95"
      >
        {menuCardCta}
      </Link>
    </div>
  )
}
