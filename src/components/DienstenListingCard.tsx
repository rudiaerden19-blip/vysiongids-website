'use client'

import Link from 'next/link'
import ListingPhotoSlider from '@/components/ListingPhotoSlider'
import ListingStarRating from '@/components/ListingStarRating'
import type { Listing } from '@/lib/listing-types'
import { formatListingAddressLines } from '@/lib/listing-display'
import { listingPhotoUrls } from '@/lib/listing-display'
import { belgiumPhoneTelHref, formatBelgiumPhoneDisplay } from '@/lib/belgium-phone'
import { serviceCategoryLabel } from '@/lib/gids-service-categories'
import { dienstenListingVisitorsDisplay, formatStatNumber } from '@/lib/gids-public-stats'

import { normalizeHttpsUrl } from '@/lib/normalize-url'

function dienstenWebsiteAction(website: string | undefined): { href: string; label: string } | null {
  const raw = website?.trim()
  if (!raw) return null
  const norm = normalizeHttpsUrl(raw)
  if (!norm.ok) return null
  try {
    const u = new URL(norm.url)
    const path = u.pathname !== '/' ? u.pathname.replace(/\/$/, '') : ''
    const label = `${u.hostname}${path}`
    return { href: norm.url, label }
  } catch {
    return null
  }
}

function contactMail(email: string | undefined): string | null {
  const e = email?.trim()
  if (!e || !e.includes('@')) return null
  return `mailto:${e}`
}

export default function DienstenListingCard({ listing }: { listing: Listing }) {
  const { street, cityLine } = formatListingAddressLines(listing)
  const profileHref = `/diensten/${listing.slug}`
  const telHref = belgiumPhoneTelHref(listing.phone)
  const phoneDisplay = formatBelgiumPhoneDisplay(listing.phone)
  const mailHref = contactMail(listing.email)
  const websiteAction = dienstenWebsiteAction(listing.website)
  const visitors = dienstenListingVisitorsDisplay(listing.slug)

  return (
    <article className="vysiongids-listing-panel vysiongids-diensten-listing-panel">
      <div className="vysiongids-listing-panel-row">
        <Link href={profileHref} className="vysiongids-listing-panel-photo vysiongids-diensten-panel-photo">
          <ListingPhotoSlider
            urls={listingPhotoUrls(listing)}
            alt={listing.name}
            sizes="(max-width: 639px) 100vw, 30rem"
            showControls
          />
        </Link>
        <div className="vysiongids-listing-panel-body vysiongids-diensten-card-body">
          <Link href={profileHref} className="vysiongids-diensten-card-title-link">
            <h2 className="vysiongids-diensten-card-title">{listing.name}</h2>
          </Link>
          {listing.serviceCategories?.length ? (
            <ul className="vysiongids-diensten-card-cats" aria-label="Categorieën">
              {listing.serviceCategories.map((id) => (
                <li key={id}>{serviceCategoryLabel(id)}</li>
              ))}
            </ul>
          ) : null}
          <p className="vysiongids-diensten-card-address">
            {street}
            <br />
            {cityLine}
          </p>
          {phoneDisplay ? (
            <p className="vysiongids-diensten-card-phone">{phoneDisplay}</p>
          ) : null}
          {listing.serviceDescription ? (
            <p className="vysiongids-diensten-card-desc">{listing.serviceDescription}</p>
          ) : null}
          <div className="vysiongids-diensten-card-actions">
            <Link href={profileHref} className="vysiongids-diensten-action-btn vysiongids-diensten-action-btn--secondary">
              Info
            </Link>
            <Link
              href={`/zaak/${listing.slug}/reviews#schrijven`}
              className="vysiongids-diensten-action-btn"
            >
              Geef review
            </Link>
            {telHref ? (
              <a href={telHref} className="vysiongids-diensten-action-btn">
                Contacteer verkoper
              </a>
            ) : mailHref ? (
              <a href={mailHref} className="vysiongids-diensten-action-btn">
                Contacteer verkoper
              </a>
            ) : (
              <Link href={profileHref} className="vysiongids-diensten-action-btn">
                Contacteer verkoper
              </Link>
            )}
            {websiteAction ? (
              <a
                href={websiteAction.href}
                target="_blank"
                rel="noopener noreferrer"
                className="vysiongids-diensten-action-btn vysiongids-diensten-action-btn--website"
                title={websiteAction.label}
              >
                Website
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="vysiongids-listing-panel-hiring vysiongids-listing-panel-hiring--empty vysiongids-diensten-verified-bar">
        <div className="vysiongids-listing-panel-hiring-inner">
          <div className="vysiongids-diensten-verified-bar-rating">
            <ListingStarRating
              slug={listing.slug}
              avg={listing.ratingAvg}
              count={listing.ratingCount}
              size="sm"
            />
          </div>
          <div className="vysiongids-listing-panel-hiring-copy">
            <span className="vysiongids-listing-panel-hiring-text">Dit bedrijf is geverifieerd</span>
          </div>
          <span className="vysiongids-diensten-verified-bar-visitors">
            {formatStatNumber(visitors)} bezoekers
          </span>
        </div>
      </div>
    </article>
  )
}
