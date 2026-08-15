import SiteHeader from '@/components/SiteHeader'
import GidsLoginForm from '@/components/GidsLoginForm'

export const metadata = { title: 'Login' }

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Login zaakhouder</h1>
        <p className="mt-4 text-gray-600">Log in met je volledige zaaknaam en je 6-cijferige PIN.</p>
        <p className="mt-2 text-sm text-gray-500">
          Na login kun je in beheer je zaak volledig wissen met <strong>Verwijder je zaak</strong> (foto&apos;s, reviews,
          listing).
        </p>
        <GidsLoginForm />
      </main>
    </>
  )
}
