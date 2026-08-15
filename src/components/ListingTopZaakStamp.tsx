import Image from 'next/image'
import { isTopZaakListing } from '@/lib/listing-topzaak'
import type { Listing } from '@/lib/listing-types'

type Props = {
  listing: Pick<Listing, 'ratingAvg' | 'ratingCount'>
  /** rechts onder «Nu open» op zoekkaart */
  variant?: 'underOpen' | 'inline'
  className?: string
}

export default function ListingTopZaakStamp({ listing, variant = 'underOpen', className }: Props) {
  if (!isTopZaakListing(listing)) return null

  const variantClass =
    variant === 'inline' ? 'vysiongids-topzaak-stamp--inline' : 'vysiongids-topzaak-stamp--under-open'

  return (
    <div
      className={`vysiongids-topzaak-stamp ${variantClass}${className ? ` ${className}` : ''}`}
      title="Topzaak — 4 sterren of meer"
    >
      <Image
        src="/images/topzaak-stamp.svg"
        alt="Topzaak stempel"
        width={140}
        height={140}
        className="vysiongids-topzaak-stamp-img"
        priority={false}
      />
    </div>
  )
}
