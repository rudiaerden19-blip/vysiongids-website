import Link from 'next/link'
import ListingPanel from '@/components/ListingPanel'
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
          Ontdek populaire zaken in de gids — bestel rechtstreeks bij de zaak, zonder commissie via Vysiongids.
        </p>

        <ul className="vysiongids-home-featured-list">
          {listings.map((listing) => (
            <li key={listing.slug}>
              <ListingPanel listing={listing} />
            </li>
          ))}
        </ul>

        <p className="vysiongids-home-featured-more">
          <Link href="/zoeken" className="vysiongids-home-featured-more-link">
            Alle horecazaken bekijken →
          </Link>
        </p>
      </div>
    </section>
  )
}
