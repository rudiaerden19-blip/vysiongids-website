import Image from 'next/image'
import Link from 'next/link'
import type { Listing } from '@/lib/listing-types'
import { formatDeliveryFee, formatListingAddressLines, formatMinOrder, formatOpeningHours, getListingTypeLabel } from '@/lib/listings'

function StarRating({ avg, count }: { avg: number; count: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#4b5563' }}>
      <span style={{ color: '#f59e0b' }} aria-hidden>
        ★
      </span>
      <span style={{ fontWeight: 600, color: '#1f2937' }}>{avg.toFixed(1)}</span>
      <span style={{ color: '#6b7280' }}>({count}+)</span>
    </span>
  )
}

export default function ListingPanel({ listing }: { listing: Listing }) {
  const typeLabel = getListingTypeLabel(listing.type)
  const minOrder = formatMinOrder(listing)
  const deliveryLabel = formatDeliveryFee(listing)
  const timeLabel = `${listing.deliveryTimeMin}–${listing.deliveryTimeMax} min`
  const { street, cityLine } = formatListingAddressLines(listing)
  const hoursLabel = formatOpeningHours(listing)
  const profileHref = `/zaak/${listing.slug}`

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
          <Link href={profileHref} style={{ textDecoration: 'none', width: 'fit-content' }}>
            <h2
              style={{
                margin: 0,
                fontSize: 'clamp(1.125rem, 2vw, 1.35rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: '#111827',
              }}
            >
              {listing.name}
            </h2>
          </Link>
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
            <StarRating avg={listing.ratingAvg} count={listing.ratingCount} />
            <span style={{ color: '#6b7280' }}>{timeLabel}</span>
            <span style={{ fontWeight: 500, color: '#374151' }}>{deliveryLabel}</span>
            {minOrder ? <span style={{ color: '#6b7280' }}>{minOrder}</span> : null}
          </div>
          <div className="vysiongids-listing-panel-actions">
            <Link href={profileHref} className="vysiongids-listing-panel-more">
              Bekijk zaak →
            </Link>
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
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
