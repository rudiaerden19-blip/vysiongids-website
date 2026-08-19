import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import { listingHiringIsActive } from '@/lib/listing-hiring'
import { getAllListings } from '@/lib/listings'

export const metadata = { title: 'Jobs' }

export const revalidate = 60

export default async function JobsPage() {
  const listings = (await getAllListings()).filter((l) => listingHiringIsActive(l.infoExtras?.hiring))

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap">
        <h1
          style={{
            margin: '0 0 0.75rem',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          Jobs
        </h1>
        <p style={{ margin: '0 0 1.25rem', maxWidth: '40rem', color: '#4b5563', lineHeight: 1.6 }}>
          Vacatures bij horeca in België — solliciteer rechtstreeks bij de zaak.
        </p>
        {listings.length === 0 ? (
          <p style={{ margin: 0, color: '#6b7280' }}>Momenteel geen open vacatures in de gids.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {listings.map((listing) => (
              <li key={listing.slug}>
                <Link
                  href={`/zaak/${listing.slug}#vacature`}
                  style={{ fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
                >
                  {listing.name}
                </Link>
                <span style={{ color: '#6b7280' }}> · {listing.city}</span>
                {listing.infoExtras?.hiring?.text ? (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem', color: '#374151' }}>
                    {listing.infoExtras.hiring.text}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
