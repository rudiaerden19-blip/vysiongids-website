import { Suspense } from 'react'
import ZoekertjesPageClient from '@/components/ZoekertjesPageClient'
import SiteHeader from '@/components/SiteHeader'

export const metadata = { title: 'Zoekertjes' }

export default function ZoekertjesPage() {
  return (
    <>
      <SiteHeader />
      <main className="vysiongids-page-wrap">
        <h1 className="vysiongids-jobs-page-title">Zoekertjes</h1>
        <Suspense fallback={<p className="vysiongids-jobs-empty">Laden…</p>}>
          <ZoekertjesPageClient />
        </Suspense>
      </main>
    </>
  )
}
