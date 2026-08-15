import SiteHeader from '@/components/SiteHeader'
import ZaakToevoegenForm from '@/components/ZaakToevoegenForm'
import ZaakToevoegenIntroGate from '@/components/ZaakToevoegenIntroGate'

export const metadata = { title: 'Zaak toevoegen' }

export default function ZaakToevoegenPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Zaak toevoegen</h1>
        <p className="mt-4 text-gray-600">
          Unieke zaaknaam, 6-cijferige PIN en alle velden met <span className="vysiongids-form-required">*</span>.
          Na registratie staat je zaak meteen online.
        </p>
        <ZaakToevoegenIntroGate>
          <ZaakToevoegenForm />
        </ZaakToevoegenIntroGate>
        <p className="mt-10 border-t border-gray-200 pt-6 text-sm text-gray-600">
          Zaak al online en wil je alles verwijderen?{' '}
          <a href="/login" className="font-semibold text-accent hover:underline">
            Log in
          </a>{' '}
          → beheer → <strong>Verwijder je zaak</strong>.
        </p>
      </main>
    </>
  )
}
