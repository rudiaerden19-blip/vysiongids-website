import { BELGIUM_CITIES, BELGIUM_PROVINCES, provinceLabel } from '@/lib/belgium-locations'
import type { Listing } from '@/lib/listing-types'
import { normalizeSearchText } from '@/lib/gids-text'

/** NL/FR/EN varianten voor locatie in zoekquery. */
const CITY_ALIASES: Record<string, string[]> = {
  antwerpen: ['anvers', 'antwerp'],
  mechelen: ['malines', 'mechlin'],
  gent: ['gand', 'ghent'],
  brussel: ['bruxelles', 'brussels'],
  luik: ['liege', 'liege'],
  leuven: ['louvain'],
  brugge: ['bruges', 'brugge'],
  kortrijk: ['courtrai'],
  hasselt: ['haselt'],
  genk: ['genck'],
  pelt: ['overpelt', 'neerpelt'],
}

export type SearchLocationKey = string

type LocationPhrase = { phrase: string; key: SearchLocationKey }

function provinceSearchKeys(slug: string, label: string): SearchLocationKey[] {
  const keys = new Set<string>()
  keys.add(normalizeSearchText(slug))
  keys.add(normalizeSearchText(slug.replace(/-/g, ' ')))
  keys.add(normalizeSearchText(label))
  return [...keys]
}

function buildLocationPhrases(): LocationPhrase[] {
  const out: LocationPhrase[] = []
  const seen = new Set<string>()

  const add = (phrase: string, key: SearchLocationKey) => {
    const p = normalizeSearchText(phrase)
    if (p.length < 3 || seen.has(p)) return
    seen.add(p)
    out.push({ phrase: p, key: normalizeSearchText(key) })
  }

  for (const city of BELGIUM_CITIES) {
    const key = normalizeSearchText(city.label)
    add(city.label, key)
    add(city.q, key)
    for (const alias of CITY_ALIASES[key] ?? []) add(alias, key)
  }

  for (const prov of BELGIUM_PROVINCES) {
    for (const key of provinceSearchKeys(prov.slug, prov.label)) {
      add(key, key)
    }
  }

  return out.sort((a, b) => b.phrase.length - a.phrase.length)
}

const LOCATION_PHRASES = buildLocationPhrases()

/** Woordgrenzen — voorkomt «pelt» in «neerpelt» bij korte stadsnamen. */
export function locationPhraseInQuery(qNorm: string, phrase: string): boolean {
  const p = normalizeSearchText(phrase)
  if (!p || p.length < 3) return false
  if (qNorm === p) return true
  if (qNorm.includes(` ${p} `)) return true
  if (qNorm.startsWith(`${p} `)) return true
  if (qNorm.endsWith(` ${p}`)) return true
  if (p.length >= 5 && qNorm.split(/\s+/).some((w) => w === p || w.startsWith(`${p}-`))) return true
  return false
}

/** Herken stad/provincie in query; resttekst voor vrije zoekterm. */
export function extractSearchLocationsFromQuery(qNorm: string): {
  locationKeys: SearchLocationKey[]
  rest: string
} {
  if (!qNorm) return { locationKeys: [], rest: '' }

  let rest = qNorm
  const locationKeys: SearchLocationKey[] = []

  for (const { phrase, key } of LOCATION_PHRASES) {
    if (!locationPhraseInQuery(rest, phrase)) continue
    if (!locationKeys.includes(key)) locationKeys.push(key)
    rest = rest
      .split(phrase)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return { locationKeys, rest }
}

export function listingMatchesSearchLocation(listing: Listing, locationKeys: SearchLocationKey[]): boolean {
  if (locationKeys.length === 0) return true

  const city = normalizeSearchText(listing.city)
  const postcode = listing.postcode?.trim().slice(0, 4) ?? ''
  const provSlug = normalizeSearchText(listing.province ?? '')
  const provLabel = listing.province ? normalizeSearchText(provinceLabel(listing.province)) : ''
  const provSlugSpaced = provSlug.replace(/-/g, ' ')

  return locationKeys.some((key) => {
    if (!key) return false
    if (provSlug === key || provSlugSpaced === key || provLabel === key) return true
    if (city === key) return true
    if ((CITY_ALIASES[city] ?? []).some((a) => normalizeSearchText(a) === key)) return true
    if (key === 'pelt' && (city === 'pelt' || city === 'overpelt' || city === 'neerpelt')) return true
    if (postcode && /^\d{4}$/.test(key) && postcode === key) return true
    return false
  })
}
