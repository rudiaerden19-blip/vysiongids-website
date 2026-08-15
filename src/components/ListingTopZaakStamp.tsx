import Image from 'next/image'
import { isTopZaakListing } from '@/lib/listing-topzaak'
import type { Listing } from '@/lib/listing-types'

type Props = {
  listing: Pick<Listing, 'ratingAvg' | 'ratingCount'>
  /** overlay on listing photo */
  variant?: 'photo' | 'inline'
  className?: string
}

export default function ListingTopZaakStamp({ listing, variant = 'photo', className }: Props) {
  if (!isTopZaakListing(listing)) return null

  const variantClass =
    variant === 'photo' ? 'vysiongids-topzaak-stamp--photo' : 'vysiongids-topzaak-stamp--inline'

  return (
    <div
      className={`vysiongids-topzaak-stamp ${variantClass}${className ? ` ${className}` : ''}`}
      title="Topzaak — 4 sterren of meer"
    >
      <Image
        src="/images/topzaak-stamp.svg"
        alt="Topzaak stempel"
        width={120}
        height={120}
        className="vysiongids-topzaak-stamp-img"
        priority={false}
      />
    </div>
  )
}
