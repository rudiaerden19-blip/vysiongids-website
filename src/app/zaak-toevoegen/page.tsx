import SiteHeader from '@/components/SiteHeader'
import ZaakToevoegenForm from '@/components/ZaakToevoegenForm'

export const metadata = { title: 'Zaak toevoegen' }

export default function ZaakToevoegenPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Zaak toevoegen</h1>
        <p className="mt-4 text-gray-600">
          Unieke zaaknaam + 6-cijferige PIN. Na registratie staat je zaak meteen online (max. 3 foto&apos;s).
        </p>
        <ZaakToevoegenForm />
      </main>
    </>
  )
}
