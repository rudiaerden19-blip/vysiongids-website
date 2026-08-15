'use client'

import type { Listing, ListingAmenityId } from '@/lib/listing-types'
import {
  AMENITY_LABELS,
  isListingOpenNow,
  listingWebsiteDisplay,
  resolveHoursByDay,
} from '@/lib/listing-info'
import { useEffect, useState, type CSSProperties } from 'react'

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

const infoItemRow: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: '0.65rem',
  marginBottom: '0.85rem',
  fontSize: '0.9375rem',
  lineHeight: 1.45,
  color: '#374151',
}

const iconBlue: CSSProperties = {
  display: 'inline-flex',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  borderRadius: '9999px',
  border: '2px solid #0e5d82',
  background: '#fff',
}

const iconRed: CSSProperties = {
  ...iconBlue,
  border: '2px solid #9b2743',
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
  const amenityList = amenities.length ? amenities : defaultAmenities

  return (
    <section
      className="vysiongids-zaak-info"
      style={{
        marginTop: '2rem',
        width: '100%',
        padding: '2rem clamp(1.25rem, 3vw, 2.5rem)',
        background: '#ececec',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="vysiongids-zaak-info-grid"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '2.5rem 3rem',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <div className="vysiongids-zaak-info-col" style={{ flex: '1 1 50%', minWidth: 0 }}>
          <h2
            className="vysiongids-zaak-info-heading"
            style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 700, color: '#1e3a5f' }}
          >
            OPENINGSUREN
          </h2>
          <OpenStatus listing={listing} />
          <table
            className="vysiongids-zaak-hours-table"
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem', color: '#374151' }}
          >
            <tbody>
              {hoursRows.map((row) => (
                <tr key={row.day}>
                  <th scope="row" style={{ padding: '0.35rem 1.25rem 0.35rem 0', fontWeight: 400, textAlign: 'left' }}>
                    {row.day}
                  </th>
                  <td style={{ padding: '0.35rem 0', fontWeight: 500, textAlign: 'left' }}>{row.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="vysiongids-zaak-info-col" style={{ flex: '1 1 50%', minWidth: 0 }}>
          <h2
            className="vysiongids-zaak-info-heading"
            style={{ margin: '0 0 1rem', fontSize: '1.125rem', fontWeight: 700, color: '#1e3a5f' }}
          >
            INFO
          </h2>
          <ul className="vysiongids-zaak-info-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {website ? (
              <li className="vysiongids-zaak-info-item vysiongids-zaak-info-item--contact" style={infoItemRow}>
                <span className="vysiongids-zaak-info-icon vysiongids-zaak-info-icon--blue" style={iconBlue}>
                  <ContactIcon kind="web" />
                </span>
                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">
                  {listingWebsiteDisplay(website)}
                </a>
              </li>
            ) : null}
            {phone ? (
              <li className="vysiongids-zaak-info-item vysiongids-zaak-info-item--contact" style={infoItemRow}>
                <span className="vysiongids-zaak-info-icon vysiongids-zaak-info-icon--blue" style={iconBlue}>
                  <ContactIcon kind="phone" />
                </span>
                <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
              </li>
            ) : null}
            {email ? (
              <li className="vysiongids-zaak-info-item vysiongids-zaak-info-item--contact" style={infoItemRow}>
                <span className="vysiongids-zaak-info-icon vysiongids-zaak-info-icon--blue" style={iconBlue}>
                  <ContactIcon kind="email" />
                </span>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            ) : null}
            {amenityList.map((id) => (
              <li key={id} className="vysiongids-zaak-info-item vysiongids-zaak-info-item--amenity" style={infoItemRow}>
                <span className="vysiongids-zaak-info-icon vysiongids-zaak-info-icon--red" style={iconRed}>
                  <AmenityIcon id={id} />
                </span>
                <span>{AMENITY_LABELS[id]}</span>
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
