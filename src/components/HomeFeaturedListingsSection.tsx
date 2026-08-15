import Link from 'next/link'
import HomeFeaturedCarousel from '@/components/HomeFeaturedCarousel'
import { getFeaturedListings } from '@/lib/listings'

export default async function HomeFeaturedListingsSection() {
  const listings = await getFeaturedListings(4)
  if (listings.length === 0) return null

  return (
    <section className="vysiongids-home-featured" aria-labelledby="home-featured-title">
      <div className="vysiongids-home-featured-inner">
        <h2 id="home-featured-title" className="vysiongids-home-featured-title">
          Horecazaken in de kijker
        </h2>
        <p className="vysiongids-home-featured-lead">
          Ontdek de populairste zaken die deze week de meeste ratings gekregen hebben van klanten
        </p>

        <HomeFeaturedCarousel listings={listings} />

        <p className="vysiongids-home-featured-more">
          <Link href="/zoeken" className="vysiongids-home-featured-more-link">
            Alle horecazaken bekijken →
          </Link>
        </p>
      </div>
    </section>
  )
}
