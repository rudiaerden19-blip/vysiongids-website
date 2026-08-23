import Image from 'next/image'
import { Suspense } from 'react'
import SearchForm from '@/components/SearchForm'
import HomeStatsBar from '@/components/HomeStatsBar'
import HomeFeaturedListingsSection from '@/components/HomeFeaturedListingsSection'
import HomeHeroHeadlines from '@/components/HomeHeroHeadlines'
import HomeRegionsSection from '@/components/HomeRegionsSection'
import SiteHeader from '@/components/SiteHeader'
import { getHomePublicStats } from '@/lib/gids-home-stats'

export const revalidate = 60

export default async function HomePage() {
  const stats = await getHomePublicStats()

  return (
    <>
      <SiteHeader />
      <div
        className="vysiongids-hero-root"
        style={{
          position: 'relative',
          minHeight: 'calc(2cm + clamp(20rem, 38vh, 26rem))',
          overflow: 'hidden',
        }}
      >
        <div className="vysiongids-hero-media" aria-hidden>
          <Image
            src="/images/hero-header.png"
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
        <div
          className="vysiongids-hero-overlay"
          aria-hidden
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.22), rgba(0,0,0,0.12), rgba(0,0,0,0.18))',
          }}
        />
        <section className="vysiongids-hero-section">
          <div className="vysiongids-hero-wrap" style={{ textAlign: 'center' }}>
            <HomeHeroHeadlines />
          </div>
          <div className="vysiongids-hero-search-wrap">
            <Suspense fallback={null}>
              <SearchForm />
            </Suspense>
          </div>
        </section>
      </div>
      <HomeStatsBar zoekactiesPerDag={stats.zoekactiesPerDag} />
      <HomeFeaturedListingsSection />
      <HomeRegionsSection />
    </>
  )
}
