import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export const metadata = { title: 'Diensten' }

export default function DienstenPage() {
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
          Diensten
        </h1>
        <p style={{ margin: '0 0 1.25rem', maxWidth: '40rem', color: '#4b5563', lineHeight: 1.6 }}>
          Voor horeca-ondernemers: website, bestelplatform, kassa, menu online, reviews en vindbaarheid via
          Vysiongids. Meer diensten van WebVysion volgen hier.
        </p>
        <p style={{ margin: 0 }}>
          <Link
            href="mailto:contact@webvysion.tech?subject=Diensten%20Vysiongids"
            className="vysiongids-header-nav-cta"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Vraag informatie
          </Link>
        </p>
      </main>
    </>
  )
}
