import Image from 'next/image'
import Link from 'next/link'
import { BELGIUM_CITIES, BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { provinceImageUrl } from '@/lib/province-images'

/** Geen kaart op homepage (wel nog in zoeken/registratie). */
const HOME_PROVINCE_SLUGS_HIDDEN = new Set(['henegouwen', 'luik', 'luxemburg', 'namen'])

export default function HomeRegionsSection() {
  return (
    <section className="vysiongids-home-regions" aria-labelledby="home-regions-title">
      <div className="vysiongids-home-regions-inner">
        <header className="vysiongids-home-section-intro">
          <h2 id="home-regions-title" className="vysiongids-home-regions-title">
            Alle horeca zaken per stad en provincie
          </h2>
          <p className="vysiongids-home-regions-lead">
            Kies een provincie of stad — je ziet meteen welke zaken in de gids staan.
          </p>
        </header>

        <ul className="vysiongids-home-regions-grid">
          {BELGIUM_PROVINCES.filter((prov) => !HOME_PROVINCE_SLUGS_HIDDEN.has(prov.slug)).map((prov) => {
            const img = provinceImageUrl(prov.slug)
            return (
              <li key={prov.slug}>
                <Link href={`/zoeken?prov=${encodeURIComponent(prov.slug)}`} className="vysiongids-home-region-card">
                  <span className="vysiongids-home-region-card-media">
                    {img ? (
                      <Image src={img} alt="" fill sizes="(max-width:640px) 45vw, 180px" className="object-cover" />
                    ) : (
                      <span className="vysiongids-home-region-card-fallback" aria-hidden />
                    )}
                    <span className="vysiongids-home-region-card-overlay" aria-hidden />
                  </span>
                  <span className="vysiongids-home-region-card-label">{prov.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="vysiongids-home-cities">
          <h3 className="vysiongids-home-cities-title">Populaire steden</h3>
          <ul className="vysiongids-home-cities-list">
            {BELGIUM_CITIES.map((city) => (
              <li key={city.q}>
                <Link href={`/zoeken?q=${encodeURIComponent(city.q)}`} className="vysiongids-home-city-chip">
                  Horeca in {city.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
