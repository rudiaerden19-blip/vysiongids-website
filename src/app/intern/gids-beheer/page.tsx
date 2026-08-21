import type { Metadata } from 'next'
import GidsStaffListingsClient from '@/components/GidsStaffListingsClient'

export const metadata: Metadata = {
  title: 'Intern — gids zaken',
  robots: { index: false, follow: false },
}

/** Alleen medewerkers (wachtwoord). Niet in het menu — bookmark de URL. */
export default function InternGidsBeheerPage() {
  return (
    <main className="vysiongids-page-wrap vysiongids-staff-page">
      <h1 className="vysiongids-staff-page-title">Gids — beheer</h1>
      <p className="vysiongids-staff-page-lead">
        Frituren (€49/jaar) en leveranciers/bedrijven (€99/jaar): premium, pauzeren, offline zetten en verwijderen.
      </p>
      <GidsStaffListingsClient />
    </main>
  )
}
