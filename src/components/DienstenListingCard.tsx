'use client'

import Link from 'next/link'
import ListingPhotoSlider from '@/components/ListingPhotoSlider'
import type { Listing } from '@/lib/listing-types'
import { formatListingAddressLines } from '@/lib/listing-display'
import { listingPhotoUrls } from '@/lib/listing-display'
import { serviceCategoryLabel } from '@/lib/gids-service-categories'

function contactTel(phone: string | undefined): string | null {
  const p = phone?.trim()
  if (!p) return null
  const digits = p.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : null
}

function contactMail(email: string | undefined): string | null {
  const e = email?.trim()
  if (!e || !e.includes('@')) return null
  return `mailto:${e}`
}

export default function DienstenListingCard({ listing }: { listing: Listing }) {
  const { street, cityLine } = formatListingAddressLines(listing)
  const profileHref = `/diensten/${listing.slug}`
  const telHref = contactTel(listing.phone)
  const mailHref = contactMail(listing.email)

  return (
    <article className="vysiongids-diensten-card">
      <div className="vysiongids-diensten-card-row">
        <Link href={profileHref} className="vysiongids-diensten-card-photo">
          <ListingPhotoSlider
            urls={listingPhotoUrls(listing)}
            alt={listing.name}
            sizes="(max-width: 640px) 100vw, 22rem"
            showControls
          />
        </Link>
        <div className="vysiongids-diensten-card-body">
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
          {listing.phone ? (
            <p className="vysiongids-diensten-card-phone">{listing.phone}</p>
          ) : null}
          {listing.serviceDescription ? (
            <p className="vysiongids-diensten-card-desc">{listing.serviceDescription}</p>
          ) : null}
          <div className="vysiongids-diensten-card-actions">
            <Link href={profileHref} className="vysiongids-diensten-action-btn vysiongids-diensten-action-btn--secondary">
              Info
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
          </div>
        </div>
      </div>
    </article>
  )
}
