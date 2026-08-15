import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export const metadata = { title: 'Zaak toevoegen' }

export default function ZaakToevoegenPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Zaak toevoegen</h1>
        <p className="mt-4 text-gray-600">
          Wil je jouw frituur, pizzeria of restaurant in Vysiongids? Neem contact op via{' '}
          <a href="https://www.vysionorder.com" className="font-semibold text-accent hover:underline">
            Vysion Order
          </a>{' '}
          — wij plaatsen je zaak met foto, adres en link naar je bestelplatform.
        </p>
        <Link
          href="https://www.vysionorder.com"
          className="mt-6 inline-flex rounded-lg bg-accent px-6 py-2.5 text-base font-semibold text-white hover:bg-accent/90"
        >
          Meer info
        </Link>
      </main>
    </>
  )
}
