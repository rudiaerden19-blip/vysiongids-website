import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export const metadata = { title: 'Publiciteit en diensten' }

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
          Publiciteit en diensten
        </h1>
        <p style={{ margin: '0 0 1.25rem', maxWidth: '42rem', color: '#4b5563', lineHeight: 1.65 }}>
          Heb je een onderneming die diensten verkoopt, bijv. kassasystemen, horecameubilair, inrichting horeca, of ben
          je een groothandel of leverancier? Dan zit je hier op de juiste plek. Druk op de knop{' '}
          <strong>Jouw zaak toevoegen</strong> en kies voor diensten. Met een zaakprofiel val je als verkoper 20× meer
          op.
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/zaak-toevoegen" className="vysiongids-header-nav-cta" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Jouw zaak toevoegen
          </Link>
        </p>
      </main>
    </>
  )
}
