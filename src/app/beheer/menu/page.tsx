import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import GidsMenuEditor from '@/components/GidsMenuEditor'

export const metadata = { title: 'Menu beheren' }

export default function BeheerMenuPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/beheer" className="text-sm font-semibold text-accent hover:underline">
          ← Terug naar beheer
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Menu beheren</h1>
        <div className="mt-6">
          <GidsMenuEditor />
        </div>
      </main>
    </>
  )
}
