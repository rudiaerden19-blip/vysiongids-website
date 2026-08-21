import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'

export const metadata = { title: 'Bedankt — dienstenprofiel' }

export default async function DienstenAanmeldenBedanktPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>
}) {
  const { slug } = await searchParams
  const profileHref = slug ? `/diensten/${slug}` : '/diensten'

  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900">Bedankt voor je betaling</h1>
        <p className="mt-3 text-gray-700 leading-relaxed">
          Je dienstenprofiel wordt zichtbaar zodra de betaling is verwerkt (meestal binnen enkele seconden).
        </p>
        <p className="mt-6">
          <Link href={profileHref} className="vysiongids-header-nav-cta inline-block no-underline">
            Bekijk je profiel
          </Link>
        </p>
        <p className="mt-4 text-sm text-gray-600">
          Beheer via{' '}
          <Link href="/beheer" className="font-semibold text-accent hover:underline">
            Login / beheer
          </Link>{' '}
          met je zaaknaam en PIN.
        </p>
      </main>
    </>
  )
}
