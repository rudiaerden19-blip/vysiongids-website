import Image from 'next/image'
import Link from 'next/link'
import ListingPanelOpenStatus from '@/components/ListingPanelOpenStatus'
import ListingStarRating from '@/components/ListingStarRating'
import type { Listing } from '@/lib/listing-types'
import { formatDeliveryFee, formatListingAddressLines, formatMinOrder, formatOpeningHours, getListingTypeLabel } from '@/lib/listings'

export default function ListingPanel({ listing }: { listing: Listing }) {
  const typeLabel = getListingTypeLabel(listing.type)
  const minOrder = formatMinOrder(listing)
  const deliveryLabel = formatDeliveryFee(listing)
  const timeLabel = `${listing.deliveryTimeMin}–${listing.deliveryTimeMax} min`
  const { street, cityLine } = formatListingAddressLines(listing)
  const hoursLabel = formatOpeningHours(listing)
  const profileHref = `/zaak/${listing.slug}`
  const reviewsHref = `${profileHref}/reviews`

  return (
    <article className="vysiongids-listing-panel">
      <div className="vysiongids-listing-panel-row">
        <Link href={profileHref} className="vysiongids-listing-panel-photo">
          <Image
            src={listing.photoUrl}
            alt=""
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 100vw, 26rem"
          />
        </Link>
        <div className="vysiongids-listing-panel-body">
          <div className="vysiongids-listing-panel-head">
            <Link href={profileHref} className="vysiongids-listing-panel-title-link">
              <h2 className="vysiongids-listing-panel-title">{listing.name}</h2>
            </Link>
            <ListingPanelOpenStatus listing={listing} />
          </div>
          <p style={{ margin: 0, display: 'flex', gap: '0.5rem', fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.45 }}>
            <span aria-hidden>📍</span>
            <span>
              {street}
              <br />
              {cityLine}
            </span>
          </p>
          <p style={{ margin: 0, display: 'flex', gap: '0.5rem', fontSize: '0.9375rem', color: '#4b5563' }}>
            <span aria-hidden>🍽</span>
            {typeLabel}
            {listing.pickupEnabled && listing.deliveryEnabled
              ? ' · Afhalen & levering'
              : listing.deliveryEnabled
                ? ' · Levering'
                : ' · Afhalen'}
          </p>
          <p style={{ margin: 0, display: 'flex', gap: '0.5rem', fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.45 }}>
            <span aria-hidden>🕐</span>
            <span>{hoursLabel}</span>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 0.85rem', fontSize: '0.9375rem' }}>
            <ListingStarRating slug={listing.slug} avg={listing.ratingAvg} count={listing.ratingCount} />
            <span style={{ color: '#6b7280' }}>{timeLabel}</span>
            <span style={{ fontWeight: 500, color: '#374151' }}>{deliveryLabel}</span>
            {minOrder ? <span style={{ color: '#6b7280' }}>{minOrder}</span> : null}
          </div>
          <div className="vysiongids-listing-panel-actions">
            <div className="vysiongids-listing-panel-cta-stack">
              <Link href={`${profileHref}#info`} className="vysiongids-listing-action-btn">
                Info
              </Link>
              <a
                href={listing.orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="vysiongids-listing-action-btn"
              >
                Bestel
              </a>
              <Link href={`${reviewsHref}#schrijven`} className="vysiongids-listing-action-btn">
                Geef review
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
