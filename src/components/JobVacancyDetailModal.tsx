'use client'

import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import type { Listing } from '@/lib/listing-types'
import { formatListingAddressLines } from '@/lib/listing-display'
import { formatGidsSentenceText } from '@/lib/gids-text'
import { hiringJobTypeLabels, listingHiringBarTitle } from '@/lib/listing-hiring'
import {
  jobListingMailtoHref,
  jobListingTelHref,
  resolveJobListingEmail,
  resolveJobListingPhone,
} from '@/lib/job-listing-contact'

type Props = {
  listing: Listing
  open: boolean
  onClose: () => void
}

export default function JobVacancyDetailModal({ listing, open, onClose }: Props) {
  const titleId = useId()
  const hiring = listing.infoExtras?.hiring

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !hiring) return null

  const title = listingHiringBarTitle(hiring)
  const typeLabels = hiringJobTypeLabels(hiring.jobTypes)
  const description = hiring.text?.trim() ? formatGidsSentenceText(hiring.text.trim()) : ''
  const email = resolveJobListingEmail(listing)
  const phone = resolveJobListingPhone(listing)
  const mailHref = email ? jobListingMailtoHref(listing, email) : null
  const telHref = phone ? jobListingTelHref(phone) : null
  const { street, cityLine } = formatListingAddressLines(listing)

  const panel = (
    <div className="vysiongids-job-modal-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label="Sluiten" onClick={onClose} />
      <div className="vysiongids-job-modal-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label="Sluiten">
          ×
        </button>
        <p className="vysiongids-job-modal-kicker">Solliciteren</p>
        <h2 id={titleId} className="vysiongids-job-modal-title">
          {title}
        </h2>
        <p className="vysiongids-job-modal-zaak">
          <span className="vysiongids-job-modal-zaak-name">{listing.name}</span>
        </p>
        <address className="vysiongids-job-modal-address">
          {street ? (
            <>
              {street}
              <br />
            </>
          ) : null}
          {cityLine}
        </address>
        {typeLabels.length ? <p className="vysiongids-job-card-types">{typeLabels.join(' · ')}</p> : null}
        <div className="vysiongids-job-modal-body">
          {description ? (
            <p className="vysiongids-job-modal-text">{description}</p>
          ) : (
            <p className="vysiongids-job-modal-text vysiongids-job-modal-text--muted">
              Geen omschrijving toegevoegd. Neem contact op via e-mail of telefoon.
            </p>
          )}
        </div>
        <div className="vysiongids-job-card-actions vysiongids-job-modal-actions">
          {mailHref ? (
            <a href={mailHref} className="vysiongids-job-card-btn vysiongids-job-card-btn--email">
              E-mail
            </a>
          ) : (
            <span className="vysiongids-job-card-btn vysiongids-job-card-btn--disabled" aria-disabled="true">
              E-mail
            </span>
          )}
          {telHref ? (
            <a href={telHref} className="vysiongids-job-card-btn vysiongids-job-card-btn--phone">
              Telefoon
            </a>
          ) : (
            <span className="vysiongids-job-card-btn vysiongids-job-card-btn--disabled" aria-disabled="true">
              Telefoon
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
