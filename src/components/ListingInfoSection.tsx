'use client'

import type { Listing, ListingAmenityId } from '@/lib/listing-types'
import {
  AMENITY_LABELS,
  isListingOpenNow,
  listingWebsiteDisplay,
  resolveHoursByDay,
} from '@/lib/listing-info'
import { useEffect, useState } from 'react'

function ContactIcon({ kind }: { kind: 'web' | 'phone' | 'email' }) {
  const common = { width: 18, height: 18, fill: 'none', stroke: '#0e5d82', strokeWidth: 1.8 }
  if (kind === 'web') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
      </svg>
    )
  }
  if (kind === 'phone') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden {...common}>
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...common}>
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fill="#0e5d82" stroke="none">
        @
      </text>
    </svg>
  )
}

function AmenityIcon({ id }: { id: ListingAmenityId }) {
  const stroke = '#9b2743'
  const props = { width: 18, height: 18, fill: 'none', stroke, strokeWidth: 1.8 }
  switch (id) {
    case 'bancontact':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <rect x="4" y="7" width="16" height="10" rx="2" />
          <path d="M4 11h16" />
        </svg>
      )
    case 'wifi':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M5 12.5a11 11 0 0114 0M8.5 16a6.5 6.5 0 017 0M12 20h.01" />
        </svg>
      )
    case 'chef':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M6 11h12v2a6 6 0 01-12 0v-2zM8 11V9a4 4 0 018 0v2" />
        </svg>
      )
    case 'wheelchair':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <circle cx="9" cy="6" r="2" />
          <path d="M9 8v5h4l2 4H9v-5" />
          <circle cx="16" cy="18" r="3" />
        </svg>
      )
    case 'terrace':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M5 18h14M7 18V10h10v8M12 10V6" />
          <path d="M9 6h6" />
        </svg>
      )
    case 'halal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M8 12c0-2.5 1.8-4.5 4-4.5s4 2 4 4.5v6H8v-6z" />
          <path d="M12 7.5V4M10 5l2-2 2 2" />
        </svg>
      )
    case 'gluten_free':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M12 3c-2 3-4 6-4 9a4 4 0 008 0c0-3-2-6-4-9z" />
          <path d="M9 15h6" />
        </svg>
      )
    case 'accessible':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v4l4 2-2 6h-4l-2-6 2-1" />
        </svg>
      )
    case 'vegetarian':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M12 21c-4-4-6-8-6-12a6 6 0 1112 0c0 4-2 8-6 12z" />
        </svg>
      )
    case 'vegan':
    case 'dogs_welcome':
    case 'child_friendly':
    case 'parking':
    case 'gift_vouchers':
    case 'groups_welcome':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M8 12h8" />
        </svg>
      )
    case 'takeaway':
    case 'delivery':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <path d="M4 7h11v10H4zM15 10h3l2 3v4h-5V10z" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...props}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

function OpenStatus({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState<boolean | null>(null)

  useEffect(() => {
    setOpen(isListingOpenNow(listing))
    const id = window.setInterval(() => setOpen(isListingOpenNow(listing)), 60_000)
    return () => window.clearInterval(id)
  }, [listing])

  if (open === null) return null

  return (
    <p
      className="vysiongids-zaak-open-status"
      style={{ color: open ? '#15803d' : '#b45309', fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 0.75rem' }}
    >
      {open ? 'momenteel geopend' : 'momenteel gesloten'}
    </p>
  )
}

export default function ListingInfoSection({ listing }: { listing: Listing }) {
  const hoursRows = resolveHoursByDay(listing)
  const website = listing.website?.trim()
  const phone = listing.phone?.trim()
  const email = listing.email?.trim()
  const amenities = listing.amenities ?? []

  const defaultAmenities: ListingAmenityId[] = []
  if (listing.pickupEnabled) defaultAmenities.push('takeaway')
  if (listing.deliveryEnabled) defaultAmenities.push('delivery')
  const amenityList =
    amenities.length > 0
      ? [...amenities, ...defaultAmenities.filter((d) => !amenities.includes(d))]
      : defaultAmenities

  return (
    <section id="info" className="vysiongids-zaak-info">
      <div className="vysiongids-zaak-info-grid">
        <div className="vysiongids-zaak-info-col">
          <h2 className="vysiongids-zaak-info-heading">OPENINGSUREN</h2>
          <OpenStatus listing={listing} />
          <table className="vysiongids-zaak-hours-table">
            <tbody>
              {hoursRows.map((row) => (
                <tr key={row.day}>
                  <th scope="row">{row.day}</th>
                  <td>{row.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="vysiongids-zaak-info-col">
          <h2 className="vysiongids-zaak-info-heading">INFO</h2>
          <ul className="vysiongids-zaak-info-list">
            {website ? (
              <li className="vysiongids-zaak-info-item vysiongids-zaak-info-item--contact">
                <span className="vysiongids-zaak-info-icon vysiongids-zaak-info-icon--blue">
                  <ContactIcon kind="web" />
                </span>
                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">
                  {listingWebsiteDisplay(website)}
                </a>
              </li>
            ) : null}
            {phone ? (
              <li className="vysiongids-zaak-info-item vysiongids-zaak-info-item--contact">
                <span className="vysiongids-zaak-info-icon vysiongids-zaak-info-icon--blue">
                  <ContactIcon kind="phone" />
                </span>
                <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
              </li>
            ) : null}
            {email ? (
              <li className="vysiongids-zaak-info-item vysiongids-zaak-info-item--contact">
                <span className="vysiongids-zaak-info-icon vysiongids-zaak-info-icon--blue">
                  <ContactIcon kind="email" />
                </span>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            ) : null}
            {amenityList.map((id) => (
              <li key={id} className="vysiongids-zaak-info-item vysiongids-zaak-info-item--amenity">
                <span className="vysiongids-zaak-info-icon vysiongids-zaak-info-icon--red">
                  <AmenityIcon id={id} />
                </span>
                <span className="vysiongids-zaak-info-amenity-label">{AMENITY_LABELS[id]}</span>
              </li>
            ))}
            {!website && !phone && !email && amenityList.length === 0 ? (
              <li className="vysiongids-zaak-info-item">
                <span style={{ color: '#6b7280', fontSize: '0.9375rem' }}>Contactgegevens volgen binnenkort.</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  )
}
