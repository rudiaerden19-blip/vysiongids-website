import StaffListingsClient from '@/components/StaffListingsClient'

export default function StaffHomePage() {
  return (
    <main className="staff-page-wrap">
      <h1 className="staff-page-title">Vysiongids — zaken & premium</h1>
      <p className="staff-page-lead">
        Intern portaal (niet de publieke gids). Premium betalingen, pauzeren en verwijderen.
      </p>
      <StaffListingsClient />
    </main>
  )
}
