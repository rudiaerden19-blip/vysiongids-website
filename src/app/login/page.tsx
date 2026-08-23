import { Suspense } from 'react'
import SiteHeader from '@/components/SiteHeader'
import GidsLoginForm from '@/components/GidsLoginForm'
import GidsLoginFormFallback from '@/components/GidsLoginFormFallback'
import { tServer } from '@/i18n/server-translate'

export async function generateMetadata() {
  return {
    title: await tServer('meta.pages.login'),
    robots: { index: false, follow: false },
  }
}

export default async function LoginPage() {
  const [pageTitle, pageLead, pageHint] = await Promise.all([
    tServer('login.pageTitle'),
    tServer('login.pageLead'),
    tServer('login.pageHint'),
  ])

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <p className="mt-4 text-gray-600">{pageLead}</p>
        <p className="mt-2 text-sm text-gray-500">{pageHint}</p>
        <Suspense fallback={<GidsLoginFormFallback />}>
          <GidsLoginForm />
        </Suspense>
      </main>
    </>
  )
}
