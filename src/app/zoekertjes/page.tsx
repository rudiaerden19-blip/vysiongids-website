import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export const metadata = { title: 'Zoekertjes' }

export default function ZoekertjesPage() {
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
          Zoekertjes
        </h1>
        <p style={{ margin: '0 0 1.25rem', maxWidth: '40rem', color: '#4b5563', lineHeight: 1.6 }}>
          Klein advertentiebord voor horeca: materiaal te koop, ruil, hulp gezocht, … Het portaal wordt
          uitgebreid. Wil je als eerste plaatsen?
        </p>
        <p style={{ margin: 0 }}>
          <Link
            href="mailto:contact@webvysion.tech?subject=Zoekertje%20Vysiongids"
            className="vysiongids-header-nav-cta"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Zoekertje plaatsen
          </Link>
        </p>
      </main>
    </>
  )
}
