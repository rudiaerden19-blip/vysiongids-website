import Image from 'next/image'
import Link from 'next/link'
import type { Listing } from '@/lib/listing-types'
import { formatDeliveryFee, formatMinOrder, getListingTypeLabel } from '@/lib/listings'

function StarRating({ avg, count }: { avg: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
      <span className="text-amber-500" aria-hidden>
        ★
      </span>
      <span className="font-semibold text-gray-800">{avg.toFixed(1)}</span>
      <span className="text-gray-500">({count}+)</span>
    </span>
  )
}

export default function ListingPanel({ listing }: { listing: Listing }) {
  const typeLabel = getListingTypeLabel(listing.type)
  const minOrder = formatMinOrder(listing)
  const deliveryLabel = formatDeliveryFee(listing)
  const timeLabel = `${listing.deliveryTimeMin}–${listing.deliveryTimeMax} min`

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-accent/40 hover:shadow-md">
      <Link href={`/zaak/${listing.slug}`} className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] w-full shrink-0 bg-gray-100 sm:aspect-auto sm:h-auto sm:w-52 md:w-60">
          <Image
            src={listing.photoUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 240px"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 sm:p-5">
          <h2 className="text-lg font-bold uppercase tracking-tight text-gray-900 sm:text-xl">{listing.name}</h2>
          <p className="flex items-start gap-2 text-sm text-gray-600">
            <span className="mt-0.5 shrink-0 text-gray-400" aria-hidden>
              📍
            </span>
            <span>
              {listing.postcode} {listing.city}
              {listing.address ? ` · ${listing.address}` : ''}
            </span>
          </p>
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-400" aria-hidden>
              🍽
            </span>
            {typeLabel}
            {listing.pickupEnabled && listing.deliveryEnabled ? ' · Afhalen & levering' : listing.deliveryEnabled ? ' · Levering' : ' · Afhalen'}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <StarRating avg={listing.ratingAvg} count={listing.ratingCount} />
            <span className="text-gray-500">{timeLabel}</span>
            <span className="font-medium text-gray-700">{deliveryLabel}</span>
            {minOrder ? <span className="text-gray-500">{minOrder}</span> : null}
          </div>
          <span className="mt-1 text-sm font-semibold text-accent">Bekijk zaak →</span>
        </div>
      </Link>
    </article>
  )
}
