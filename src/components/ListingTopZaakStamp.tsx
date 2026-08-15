import Image from 'next/image'
import { isTopZaakListing } from '@/lib/listing-topzaak'
import type { Listing } from '@/lib/listing-types'

type Props = {
  listing: Pick<Listing, 'ratingAvg' | 'ratingCount'>
  /** tussen foto en tekst op zoekkaart */
  variant?: 'between' | 'inline'
  className?: string
}

export default function ListingTopZaakStamp({ listing, variant = 'between', className }: Props) {
  if (!isTopZaakListing(listing)) return null

  const variantClass =
    variant === 'inline' ? 'vysiongids-topzaak-stamp--inline' : 'vysiongids-topzaak-stamp--between'

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
