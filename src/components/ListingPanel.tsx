import Link from 'next/link'
import ListingPanelOpenStatus from '@/components/ListingPanelOpenStatus'
import ListingPanelAmenityFooter from '@/components/ListingPanelAmenityFooter'
import ListingPhotoSlider from '@/components/ListingPhotoSlider'
import ListingTopZaakStamp from '@/components/ListingTopZaakStamp'
import ListingStarRating from '@/components/ListingStarRating'
import type { Listing } from '@/lib/listing-types'
import { DAY_LABEL } from '@/lib/gids-opening-hours'
import { resolveHoursByDay } from '@/lib/listing-info'
import { getListingCuisineDisplay } from '@/lib/listing-cuisine-types'
import { isTopZaakListing } from '@/lib/listing-topzaak'
import { formatDeliveryFee, formatDeliveryRadius, formatListingAddressLines, formatListingServiceMode, formatMinOrder, listingPhotoUrls } from '@/lib/listings'
import { formatDistanceKm } from '@/lib/listing-distance'
import { listingInfoExtrasBadges, resolveListingPanelHiringBanner } from '@/lib/listing-info-extras'
import ListingMenuButton from '@/components/ListingMenuButton'

export default function ListingPanel({
  listing,
  compact,
  distanceKm,
}: {
  listing: Listing
  compact?: boolean
  /** Afstand van zoeker (km), bij «dichtbij»-zoeken */
  distanceKm?: number
}) {
  const cuisineLine = getListingCuisineDisplay(listing.cuisineType)
  const minOrder = formatMinOrder(listing)
  const deliveryRadiusLabel = formatDeliveryRadius(listing)
  const deliveryLabel = formatDeliveryFee(listing)
  const timeLabel =
    listing.deliveryTimeMin != null && listing.deliveryTimeMax != null
      ? `${listing.deliveryTimeMin}–${listing.deliveryTimeMax} min`
      : null
  const distanceLabel = typeof distanceKm === 'number' ? formatDistanceKm(distanceKm) : null
  const { street, cityLine } = formatListingAddressLines(listing)
  const hoursRows = resolveHoursByDay(listing)
  const profileHref = `/zaak/${listing.slug}`
  const reviewsHref = `${profileHref}/reviews`

  const bodyTextSize = compact ? '0.8125rem' : '0.9375rem'
  const showTopZaakStamp = isTopZaakListing(listing)
  const infoBadges = listingInfoExtrasBadges(listing.infoExtras)
  const hiringBanner = resolveListingPanelHiringBanner(listing.infoExtras)

  return (
    <article className={`vysiongids-listing-panel${compact ? ' vysiongids-listing-panel--compact' : ''}`}>
      <div className="vysiongids-listing-panel-row">
        <Link href={profileHref} className="vysiongids-listing-panel-photo">
          <ListingPhotoSlider
            urls={listingPhotoUrls(listing)}
            alt={listing.name}
            sizes="(max-width: 640px) 100vw, 26rem"
          />
        </Link>
        <div className="vysiongids-listing-panel-body">
          <div className="vysiongids-listing-panel-head">
            <Link href={profileHref} className="vysiongids-listing-panel-title-link">
              <h2 className="vysiongids-listing-panel-title">
                {listing.name}
                {cuisineLine ? (
                  <span className="vysiongids-listing-panel-cuisine-inline"> · {cuisineLine}</span>
                ) : null}
              </h2>
            </Link>
            <div
              className={`vysiongids-listing-panel-status-col${showTopZaakStamp ? ' vysiongids-listing-panel-status-col--topzaak' : ''}`}
            >
              <ListingPanelOpenStatus listing={listing} />
              {showTopZaakStamp ? (
                <ListingTopZaakStamp listing={listing} variant="underOpen" />
              ) : null}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: bodyTextSize, color: '#4b5563', lineHeight: 1.45 }}>
            {street}
            <br />
            {cityLine}
          </p>
          <p style={{ margin: 0, fontSize: bodyTextSize, color: '#4b5563' }}>
            {formatListingServiceMode(listing)}
          </p>
          {infoBadges.length > 0 ? (
            <p className="vysiongids-listing-panel-info-badges" style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--accent)' }}>
              {infoBadges.join(' · ')}
            </p>
          ) : null}
          <div className="vysiongids-listing-panel-hours-wrap">
            <ul className="vysiongids-listing-panel-hours">
              {hoursRows.map((row) => (
                <li key={row.day}>
                  <span className="vysiongids-listing-panel-hours-day">{DAY_LABEL[row.day]}</span>
                  <span className="vysiongids-listing-panel-hours-time">{row.hours}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 0.85rem', fontSize: bodyTextSize }}>
            <ListingStarRating slug={listing.slug} avg={listing.ratingAvg} count={listing.ratingCount} />
            {distanceLabel ? <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{distanceLabel}</span> : null}
            {timeLabel ? <span style={{ color: '#6b7280' }}>{timeLabel}</span> : null}
            {deliveryLabel ? <span style={{ fontWeight: 500, color: '#374151' }}>{deliveryLabel}</span> : null}
            {minOrder ? <span style={{ color: '#6b7280' }}>{minOrder}</span> : null}
            {deliveryRadiusLabel ? (
              <span style={{ color: '#6b7280' }}>{deliveryRadiusLabel}</span>
            ) : null}
          </div>
          <div className="vysiongids-listing-panel-actions">
            <ListingPanelAmenityFooter listing={listing} variant="inline" />
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
              <ListingMenuButton listing={listing} className="vysiongids-listing-action-btn" />
            </div>
          </div>
        </div>
      </div>
      {hiringBanner ? (
        <div className="vysiongids-listing-panel-hiring">
          <span className="vysiongids-listing-panel-hiring-text">{hiringBanner.message}</span>
          {hiringBanner.phone ? (
            <a
              href={`tel:${hiringBanner.phone.replace(/\s/g, '')}`}
              className="vysiongids-listing-panel-hiring-phone"
            >
              {hiringBanner.phone}
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
