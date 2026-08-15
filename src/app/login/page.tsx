import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export const metadata = { title: 'Login' }

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Login</h1>
        <p className="mt-4 text-gray-600">
          Inloggen voor zaakhouders (profiel beheren) komt later. Bestellen kan altijd via de knop{' '}
          <strong>Bestel</strong> op elke zaak — rechtstreeks bij de zaak.
        </p>
        <Link href="/zoeken" className="mt-6 inline-block font-semibold text-accent hover:underline">
          Naar zoeken →
        </Link>
      </main>
    </>
  )
}
