import Image from 'next/image'
import { Suspense } from 'react'
import SearchForm from '@/components/SearchForm'
import HomeStatsBar from '@/components/HomeStatsBar'
import HomeFeaturedListingsSection from '@/components/HomeFeaturedListingsSection'
import HomeRegionsSection from '@/components/HomeRegionsSection'
import SiteHeader from '@/components/SiteHeader'
import { getHomePublicStats } from '@/lib/gids-home-stats'

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
            <h1
              className="vysiongids-hero-title-bar"
              style={{
                display: 'inline-block',
                maxWidth: '100%',
                padding: 0,
                background: 'transparent',
                color: '#0e5d82',
                fontSize: 'clamp(2.75rem, 8vw, 4.75rem)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                margin: 0,
                textShadow: '0 1px 8px rgba(255,255,255,0.85), 0 0 2px rgba(255,255,255,0.9)',
              }}
            >
              Vysiongids
            </h1>
            <p
              style={{
                marginTop: '1.25rem',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginBottom: 0,
                maxWidth: '56rem',
                fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
                fontWeight: 500,
                color: '#ffffff',
                textShadow: '0 1px 10px rgba(0,0,0,0.85)',
              }}
            >
              Alle horeca zaken in jou bereik
            </p>
          </div>
          <div className="vysiongids-hero-search-wrap">
            <Suspense fallback={null}>
              <SearchForm />
            </Suspense>
          </div>
        </section>
      </div>
      <HomeStatsBar activeZaken={stats.activeZaken} zoekactiesPerDag={stats.zoekactiesPerDag} />
      <HomeFeaturedListingsSection />
      <HomeRegionsSection />
    </>
  )
}
