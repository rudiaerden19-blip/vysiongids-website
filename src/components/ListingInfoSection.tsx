'use client'

import ListingAmenityIcon from '@/components/ListingAmenityIcon'
import ListingInfoExtrasSections from '@/components/ListingInfoExtrasSections'
import ListingZaakQr from '@/components/ListingZaakQr'
import { resolveListingAmenityList } from '@/lib/listing-amenity-list'
import {
  AMENITY_LABELS,
  isListingOpenNow,
  listingWebsiteDisplay,
  resolveHoursByDay,
} from '@/lib/listing-info'
import { useEffect, useState } from 'react'
import type { Listing } from '@/lib/listing-types'

function ContactIcon({ kind }: { kind: 'web' | 'phone' | 'email' }) {
  const common = { width: 18, height: 18, fill: 'none', stroke: 'var(--accent)', strokeWidth: 1.8 }
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
      <text x="12" y="16" textAnchor="middle" fontSize="11" fill="var(--accent)" stroke="none">
        @
      </text>
    </svg>
  )
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
  const schedule = listing.infoExtras?.schedule
  const website = listing.website?.trim()
  const phone = listing.phone?.trim()
  const email = listing.email?.trim()
  const amenityList = resolveListingAmenityList(listing)

  return (
    <section id="info" className="vysiongids-zaak-info">
      <div className="vysiongids-zaak-info-grid">
        <div className="vysiongids-zaak-info-col">
          <h2 className="vysiongids-zaak-info-heading">OPENINGSUREN</h2>
          <OpenStatus listing={listing} />
          <table className="vysiongids-zaak-hours-table">
            <colgroup>
              <col className="vysiongids-zaak-hours-col-day" />
              <col className="vysiongids-zaak-hours-col-qr" />
              <col className="vysiongids-zaak-hours-col-time" />
            </colgroup>
            <tbody>
              {hoursRows.map((row) =>
                row.day === 'zondag' ? (
                  <tr key={row.day} className="vysiongids-zaak-hours-row--with-qr">
                    <th scope="row">{row.day}</th>
                    <td className="vysiongids-zaak-hours-qr-slot">
                      <ListingZaakQr slug={listing.slug} listingName={listing.name} size={76} />
                    </td>
                    <td className="vysiongids-zaak-hours-time">{row.hours}</td>
                  </tr>
                ) : (
                  <tr key={row.day}>
                    <th scope="row">{row.day}</th>
                    <td className="vysiongids-zaak-hours-time" colSpan={2}>
                      {row.hours}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          {schedule?.annualLeave?.length ? (
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Gesloten wegens verlof: </span>
              {schedule.annualLeave.map((r) => `${r.from} t/m ${r.to}`).join(' · ')}
            </p>
          ) : null}
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
                <span className="vysiongids-zaak-info-icon vysiongids-zaak-info-icon--blue">
                  <ListingAmenityIcon id={id} />
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
      <ListingInfoExtrasSections listing={listing} />
    </section>
  )
}
