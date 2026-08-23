import { provinceLabel } from '@/lib/belgium-locations'
import type { Locale } from '@/i18n/config'
import { defaultLocale } from '@/i18n/config'
import { translateKey } from '@/i18n/locale-messages'
import nl from '../../messages/nl.json'
import fr from '../../messages/fr.json'
import en from '../../messages/en.json'

const catalogs: Partial<Record<Locale, Record<string, unknown>>> = {
  nl: nl as Record<string, unknown>,
  fr: fr as Record<string, unknown>,
  en: en as Record<string, unknown>,
}

/** Stable key for city `q` values (Antwerpen, Sint-Niklaas, …). */
export function cityGeoKey(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function localizedProvinceLabel(slug: string, t: (key: string) => string): string {
  const key = `geo.provinces.${slug}`
  const label = t(key)
  return label === key ? provinceLabel(slug) : label
}

export function localizedCityLabel(q: string, t: (key: string) => string): string {
  const geoKey = cityGeoKey(q)
  const key = `geo.cities.${geoKey}`
  const label = t(key)
  return label === key ? q : label
}

export function localizedProvinceLabelForLocale(slug: string, locale: Locale = defaultLocale): string {
  const key = `geo.provinces.${slug}`
  const label = translateKey(key, locale, catalogs)
  return label === key ? provinceLabel(slug) : label
}

export function localizedCityLabelForLocale(q: string, locale: Locale = defaultLocale): string {
  const geoKey = cityGeoKey(q)
  const key = `geo.cities.${geoKey}`
  const label = translateKey(key, locale, catalogs)
  return label === key ? q : label
}

/** Footer / chips: «Horeca in {city}» with localized city name. */
export function localizedHorecaInCity(q: string, t: (key: string, vars?: Record<string, string | number>) => string): string {
  return t('footer.horecaInCity', { city: localizedCityLabel(q, t) })
}
