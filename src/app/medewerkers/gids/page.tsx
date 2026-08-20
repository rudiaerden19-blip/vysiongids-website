import type { Metadata } from 'next'
import GidsStaffListingsClient from '@/components/GidsStaffListingsClient'

export const metadata: Metadata = {
  title: 'Gids — medewerkers',
  robots: { index: false, follow: false },
}

export default function MedewerkersGidsPage() {
  return (
    <main className="vysiongids-page-wrap vysiongids-staff-page">
      <h1 className="vysiongids-staff-page-title">Gids — alle zaken</h1>
      <p className="vysiongids-staff-page-lead">
        Intern overzicht: premium betalingen, pauzeren en verwijderen. Niet linken vanuit de publieke site.
      </p>
      <GidsStaffListingsClient />
    </main>
  )
}
