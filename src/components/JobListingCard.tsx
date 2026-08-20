import Link from 'next/link'
import type { Listing } from '@/lib/listing-types'
import { hiringJobTypeLabels, listingHiringDisplayTitle } from '@/lib/listing-hiring'

type Props = {
  listing: Listing
}

function resolveJobEmail(listing: Listing): string | null {
  const hiringEmail = listing.infoExtras?.hiring?.email?.trim()
  if (hiringEmail) return hiringEmail
  const general = listing.email?.trim()
  return general || null
}

function resolveJobPhone(listing: Listing): string | null {
  const hiringPhone = listing.infoExtras?.hiring?.phone?.trim()
  if (hiringPhone) return hiringPhone
  const general = listing.phone?.trim()
  return general || null
}

export default function JobListingCard({ listing }: Props) {
  const hiring = listing.infoExtras?.hiring
  if (!hiring) return null

  const title = listingHiringDisplayTitle(hiring)
  const typeLabels = hiringJobTypeLabels(hiring.jobTypes)
  const description = hiring.text?.trim()
  const email = resolveJobEmail(listing)
  const phone = resolveJobPhone(listing)
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null
  const mailHref = email ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Sollicitatie — ${listing.name}`)}` : null

  return (
    <article className="vysiongids-job-card">
      <header className="vysiongids-job-card-header">
        <h2 className="vysiongids-job-card-title">{title}</h2>
        <p className="vysiongids-job-card-zaak">
          <Link href={`/zaak/${listing.slug}#vacature`} className="vysiongids-job-card-zaak-link">
            {listing.name}
          </Link>
          <span className="vysiongids-job-card-meta"> · {listing.city}</span>
        </p>
        {typeLabels.length ? <p className="vysiongids-job-card-types">{typeLabels.join(' · ')}</p> : null}
      </header>
      {description ? <p className="vysiongids-job-card-text">{description}</p> : null}
      {mailHref || telHref ? (
        <div className="vysiongids-job-card-actions">
          {mailHref ? (
            <a href={mailHref} className="vysiongids-job-card-btn vysiongids-job-card-btn--email">
              E-mail
            </a>
          ) : null}
          {telHref ? (
            <a href={telHref} className="vysiongids-job-card-btn vysiongids-job-card-btn--phone">
              Telefoon
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
