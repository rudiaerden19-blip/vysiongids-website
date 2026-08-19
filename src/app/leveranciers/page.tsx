import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export const metadata = { title: 'Leveranciers' }

export default function LeveranciersPage() {
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
          Leveranciers
        </h1>
        <p style={{ margin: '0 0 1.25rem', maxWidth: '40rem', color: '#4b5563', lineHeight: 1.6 }}>
          Ben je leverancier voor horeca (frituur, keuken, drank, verpakking, …)? Vysiongids breidt dit
          overzicht uit. Neem contact op — we plaatsen je gegevens zodra het portaal live staat.
        </p>
        <p style={{ margin: 0 }}>
          <Link
            href="mailto:contact@webvysion.tech?subject=Leverancier%20Vysiongids"
            className="vysiongids-header-nav-cta"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Leverancier melden
          </Link>
        </p>
      </main>
    </>
  )
}
