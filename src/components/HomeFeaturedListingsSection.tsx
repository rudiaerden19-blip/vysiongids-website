import Link from 'next/link'
import HomeFeaturedCarousel from '@/components/HomeFeaturedCarousel'
import { tServer } from '@/i18n/server-translate'
import { getFeaturedListings } from '@/lib/listings'

export default async function HomeFeaturedListingsSection() {
  const listings = await getFeaturedListings(4)
  if (listings.length === 0) return null

  const [featuredTitle, featuredViewAll] = await Promise.all([
    tServer('home.featuredTitle'),
    tServer('home.featuredViewAll'),
  ])

  return (
    <section className="vysiongids-home-featured" aria-labelledby="home-featured-title">
      <div className="vysiongids-home-featured-inner">
        <header className="vysiongids-home-section-intro">
          <h2 id="home-featured-title" className="vysiongids-home-featured-title">
            {featuredTitle}
          </h2>
        </header>

        <HomeFeaturedCarousel listings={listings} />

        <p className="vysiongids-home-featured-more">
          <Link href="/zoeken" className="vysiongids-home-featured-more-link">
            {featuredViewAll}
          </Link>
        </p>
      </div>
    </section>
  )
}
