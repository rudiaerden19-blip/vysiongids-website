'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/i18n/LanguageProvider'
import { BELGIUM_CITIES, BELGIUM_PROVINCES } from '@/lib/belgium-locations'
import { localizedCityLabel, localizedProvinceLabel } from '@/lib/geo-i18n'
import { provinceImageUrl } from '@/lib/province-images'

/** Geen kaart op homepage (wel nog in zoeken/registratie). */
const HOME_PROVINCE_SLUGS_HIDDEN = new Set(['henegouwen', 'luik', 'luxemburg', 'namen'])

/** Homepage-grid: Brussel als laatste kaart. */
const HOME_PROVINCE_SLUG_LAST = 'brussel'

function homeProvincesForGrid() {
  const visible = BELGIUM_PROVINCES.filter((prov) => !HOME_PROVINCE_SLUGS_HIDDEN.has(prov.slug))
  const rest = visible.filter((p) => p.slug !== HOME_PROVINCE_SLUG_LAST)
  const last = visible.find((p) => p.slug === HOME_PROVINCE_SLUG_LAST)
  return last ? [...rest, last] : rest
}

export default function HomeRegionsSection() {
  const { t } = useLanguage()
  const homeProvinces = homeProvincesForGrid()
  return (
    <section className="vysiongids-home-regions" aria-labelledby="home-regions-title">
      <div className="vysiongids-home-regions-inner">
        <header className="vysiongids-home-section-intro">
          <h2 id="home-regions-title" className="vysiongids-home-regions-title">
            {t('home.regionsTitle')}
          </h2>
          <p className="vysiongids-home-regions-lead">{t('home.regionsLead')}</p>
        </header>

        <ul className="vysiongids-home-regions-grid">
          {homeProvinces.map((prov) => {
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
                  <span className="vysiongids-home-region-card-label">{localizedProvinceLabel(prov.slug, t)}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="vysiongids-home-cities">
          <h3 className="vysiongids-home-cities-title">{t('home.popularCitiesTitle')}</h3>
          <ul className="vysiongids-home-cities-list">
            {BELGIUM_CITIES.map((city) => (
              <li key={city.q}>
                <Link href={`/zoeken?q=${encodeURIComponent(city.q)}`} className="vysiongids-home-city-chip">
                  {t('home.popularCityChip', { city: localizedCityLabel(city.q, t) })}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
