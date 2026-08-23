'use client'

import Link from 'next/link'
import { useLanguage } from '@/i18n/LanguageProvider'
import {
  localizedDeliveryFeeLabel,
  localizedDeliveryRadiusLabel,
  localizedDistanceAndDriveTime,
  localizedListingCuisineDisplay,
  localizedListingDeliveryTime,
  localizedListingHoursTime,
  localizedListingPickupTime,
  localizedListingServiceMode,
  localizedListingWeekday,
  localizedMinOrder,
} from '@/lib/listing-i18n'
import ListingPanelOpenStatus from '@/components/ListingPanelOpenStatus'
import ListingPanelAmenityFooter from '@/components/ListingPanelAmenityFooter'
import ListingPhotoSlider from '@/components/ListingPhotoSlider'
import ListingTopZaakStamp from '@/components/ListingTopZaakStamp'
import type { Listing } from '@/lib/listing-types'
import { resolveHoursByDay } from '@/lib/listing-info'
import { isTopZaakListing } from '@/lib/listing-topzaak'
import { formatListingAddressLines, listingPhotoUrls } from '@/lib/listing-display'
import { listingWazeUrl } from '@/lib/gids-listing-navigation'
import { resolveListingPanelHiring } from '@/lib/listing-info-extras'
import ListingMenuButton from '@/components/ListingMenuButton'
import ListingPromotionButton from '@/components/ListingPromotionButton'
import ZaakInfoTopLink from '@/components/ZaakInfoTopLink'
import ListingPanelHiringBar from '@/components/ListingPanelHiringBar'
import ZaakClaimBlock from '@/components/ZaakClaimBlock'

export default function ListingPanel({
  listing,
  compact,
  distanceKm,
  driveMinutes,
}: {
  listing: Listing
  compact?: boolean
  /** Afstand van zoeker (km), bij «dichtbij»-zoeken */
  distanceKm?: number
  /** Rijtijd via routing (OSRM); anders geschat uit km. */
  driveMinutes?: number
}) {
  const { t } = useLanguage()
  const cuisineLine = localizedListingCuisineDisplay(t, listing.cuisineType)
  const minOrder = localizedMinOrder(t, listing)
  const deliveryRadiusLabel = localizedDeliveryRadiusLabel(t, listing)
  const deliveryLabel = localizedDeliveryFeeLabel(t, listing)
  const pickupTimeLabel = localizedListingPickupTime(t, listing)
  const deliveryTimeLabel = localizedListingDeliveryTime(t, listing)
  const travelLabel =
    typeof distanceKm === 'number' ? localizedDistanceAndDriveTime(t, distanceKm, driveMinutes) : null
  const { street, cityLine } = formatListingAddressLines(listing)
  const hoursRows = resolveHoursByDay(listing)
  const profileHref = `/zaak/${listing.slug}`
  const reviewsHref = `${profileHref}/reviews`

  const bodyTextSize = compact ? '0.8125rem' : '0.9375rem'
  const showTopZaakStamp = isTopZaakListing(listing)
  const hiring = resolveListingPanelHiring(listing.infoExtras, listing.premiumMember)
  const hiringMessage = hiring.active ? hiring.message : t('jobs.hiringEmptyMessage')

  return (
    <article className={`vysiongids-listing-panel${compact ? ' vysiongids-listing-panel--compact' : ''}`}>
      <div className="vysiongids-listing-panel-row">
        <Link href={profileHref} className="vysiongids-listing-panel-photo">
          <ListingPhotoSlider
            urls={listingPhotoUrls(listing)}
            alt={listing.name}
            sizes="(max-width: 640px) 100vw, 30rem"
          />
        </Link>
        <div className="vysiongids-listing-panel-body">
          <div className="vysiongids-listing-panel-head">
            <div className="vysiongids-listing-panel-title-block">
              <Link href={profileHref} className="vysiongids-listing-panel-title-link">
                <h2 className="vysiongids-listing-panel-title">
                  {listing.name}
                  {cuisineLine ? (
                    <span className="vysiongids-listing-panel-cuisine-inline"> · {cuisineLine}</span>
                  ) : null}
                </h2>
              </Link>
              <ZaakClaimBlock listing={listing} variant="panelTitle" />
            </div>
            <div
              className={`vysiongids-listing-panel-status-col${showTopZaakStamp ? ' vysiongids-listing-panel-status-col--topzaak' : ''}${travelLabel ? ' vysiongids-listing-panel-status-col--has-travel' : ''}`}
            >
              <ListingPanelOpenStatus listing={listing} />
              {showTopZaakStamp ? (
                <ListingTopZaakStamp listing={listing} variant="underOpen" />
              ) : null}
              {travelLabel ? (
                <div
                  className="vysiongids-listing-panel-travel vysiongids-listing-panel-travel--under-status"
                  aria-label={t('zoeken.travelAriaDrive', { travelLabel })}
                >
                  <span>{travelLabel}</span>
                  <a
                    href={listingWazeUrl(listing)}
                    className="vysiongids-listing-panel-waze-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('common.waze')}
                  </a>
                </div>
              ) : null}
            </div>
          </div>
          <p style={{ margin: 0, fontSize: bodyTextSize, color: '#4b5563', lineHeight: 1.45 }}>
            {street}
            <br />
            {cityLine}
          </p>
          <div className="vysiongids-listing-panel-hours-wrap">
            <ul className="vysiongids-listing-panel-hours">
              {hoursRows.map((row) => (
                <li key={row.day}>
                  <span className="vysiongids-listing-panel-hours-day">{localizedListingWeekday(t, row.day)}</span>
                  <span className="vysiongids-listing-panel-hours-time">{localizedListingHoursTime(t, row.hours)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem 0.85rem', fontSize: bodyTextSize }}>
            <span className="vysiongids-listing-panel-service-mode">{localizedListingServiceMode(t, listing)}</span>
            {pickupTimeLabel ? <span style={{ color: '#6b7280' }}>{pickupTimeLabel}</span> : null}
            {deliveryTimeLabel ? <span style={{ color: '#6b7280' }}>{deliveryTimeLabel}</span> : null}
            {deliveryLabel ? <span style={{ fontWeight: 500, color: '#374151' }}>{deliveryLabel}</span> : null}
            {minOrder ? <span style={{ color: '#6b7280' }}>{minOrder}</span> : null}
            {deliveryRadiusLabel ? (
              <span style={{ color: '#6b7280' }}>{deliveryRadiusLabel}</span>
            ) : null}
          </div>
          <div className="vysiongids-listing-panel-actions">
            <ListingPanelAmenityFooter listing={listing} variant="inline" />
            <div className="vysiongids-listing-panel-cta-stack">
              <ZaakInfoTopLink href={profileHref} className="vysiongids-listing-action-btn" />
              <a
                href={listing.orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="vysiongids-listing-action-btn"
              >
                {t('common.order')}
              </a>
              <Link href={`${reviewsHref}#schrijven`} className="vysiongids-listing-action-btn">
                {t('listing.giveReview')}
              </Link>
              <ListingMenuButton listing={listing} className="vysiongids-listing-action-btn" />
              <ListingPromotionButton listing={listing} className="vysiongids-listing-action-btn" />
            </div>
          </div>
        </div>
      </div>
      <ListingPanelHiringBar listing={listing} message={hiringMessage} active={hiring.active} />
    </article>
  )
}
