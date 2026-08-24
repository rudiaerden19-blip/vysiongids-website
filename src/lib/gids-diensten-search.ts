import type { Listing } from '@/lib/listing-types'
import { GIDS_SERVICE_CATEGORIES, type GidsServiceCategoryId } from '@/lib/gids-service-categories'
import { normalizeSearchText } from '@/lib/gids-text'

/** Woorden die elke diensten-listing moeten kunnen vinden (niet alleen één categorie). */
export const DIENSTEN_SEGMENT_TERMS = [
  'diensten',
  'dienst',
  'leverancier',
  'leveranciers',
  'publiciteit',
  'verkoper',
  'verkopers',
  'toeleverancier',
  'services',
  'fournisseur',
  'fournisseurs',
] as const

const QUERY_STOPWORDS = new Set([
  'met',
  'in',
  'te',
  'bij',
  'de',
  'het',
  'een',
  'van',
  'voor',
  'op',
  'aan',
  'die',
  'dat',
  'en',
  'of',
])

/** Extra zoektermen per categorie (typisch Vlaams/Nederlands + spraak). */
export const DIENSTEN_CATEGORY_SEARCH_TERMS: Record<GidsServiceCategoryId, string[]> = {
  kassa: [
    'kassa',
    'kassasysteem',
    'kassasystemen',
    'kassa systeem',
    'kassasoftware',
    'pos',
    'horecakassa',
    'horeca kassa',
    'horecasoftware',
    'horeca software',
    'bestelplatform',
    'bestelsysteem',
    'betaalsysteem',
    'pinautomaat',
    'caisse',
  ],
  meubilair: [
    'meubilair',
    'horecameubilair',
    'horeca meubilair',
    'stoelen',
    'tafels',
    'zitbanken',
    'terrasmeubilair',
  ],
  inrichting: ['inrichting', 'interieur', 'aankleding', 'horeca inrichting'],
  keukenapparatuur: [
    'keukenapparatuur',
    'keukenmateriaal',
    'friteuse',
    'friteuses',
    'koelcel',
    'oven',
    'horeca apparatuur',
  ],
  groothandel: ['groothandel', 'foodservice', 'horecagroothandel', 'toelevering'],
  schoonmaak: ['schoonmaak', 'onderhoud', 'hygiene', 'hygiëne'],
  it: ['netwerk', 'wifi installatie', 'internet horeca', 'it diensten'],
  marketing: ['marketing', 'reclame', 'social media', 'publiciteit horeca'],
  verlichting: ['verlichting', 'horeca verlichting', 'lampen'],
  textiel: ['textiel', 'uniformen', 'schorten', 'keukenkleding', 'horecakleding'],
  verpakking: ['verpakking', 'verpakkingen', 'disposables', 'bakjes', 'takeaway verpakking'],
  overig: ['overige diensten'],
}

function websiteHaystack(listing: Listing): string {
  const parts: string[] = []
  for (const raw of [listing.website, listing.orderUrl]) {
    const value = raw?.trim()
    if (!value) continue
    parts.push(value)
    try {
      const host = new URL(value.includes('://') ? value : `https://${value}`).hostname
        .toLowerCase()
        .replace(/^www\./, '')
      parts.push(host)
      parts.push(host.replace(/\./g, ' '))
    } catch {
      /* ignore */
    }
  }
  return parts.join(' ')
}

export function dienstenListingHaystack(listing: Listing): string {
  const catTerms = (listing.serviceCategories ?? []).flatMap((id) => {
    const label = GIDS_SERVICE_CATEGORIES.find((c) => c.id === id)?.label ?? ''
    const extras = DIENSTEN_CATEGORY_SEARCH_TERMS[id as GidsServiceCategoryId] ?? []
    return [id, label, ...extras]
  })

  return normalizeSearchText(
    [
      listing.name,
      listing.slug.replace(/-/g, ' '),
      listing.city,
      listing.postcode,
      listing.address,
      listing.serviceDescription ?? '',
      websiteHaystack(listing),
      ...DIENSTEN_SEGMENT_TERMS,
      ...catTerms,
    ].join(' '),
  )
}

export function dienstenQueryTokens(raw: string): string[] {
  return normalizeSearchText(raw)
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !QUERY_STOPWORDS.has(t))
}

export function listingMatchesDienstenQuery(listing: Listing, rawQuery: string): boolean {
  const tokens = dienstenQueryTokens(rawQuery)
  if (tokens.length === 0) return true
  const hay = dienstenListingHaystack(listing)
  return tokens.every((t) => hay.includes(t))
}
