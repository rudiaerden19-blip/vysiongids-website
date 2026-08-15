/** Provincies en grote steden — links naar /zoeken (zoals Resto.be-regiokeuze). */

export const BELGIUM_CITIES = [
  { label: 'Antwerpen', q: 'Antwerpen' },
  { label: 'Gent', q: 'Gent' },
  { label: 'Hasselt', q: 'Hasselt' },
  { label: 'Brugge', q: 'Brugge' },
  { label: 'Kortrijk', q: 'Kortrijk' },
  { label: 'Brussel', q: 'Brussel' },
  { label: 'Luik', q: 'Luik' },
  { label: 'Aalst', q: 'Aalst' },
  { label: 'Mechelen', q: 'Mechelen' },
  { label: 'Leuven', q: 'Leuven' },
  { label: 'Pelt', q: 'Pelt' },
  { label: 'Genk', q: 'Genk' },
] as const

export const BELGIUM_PROVINCES = [
  { slug: 'antwerpen', label: 'Antwerpen' },
  { slug: 'brussel', label: 'Brussel' },
  { slug: 'henegouwen', label: 'Henegouwen' },
  { slug: 'limburg', label: 'Limburg' },
  { slug: 'luik', label: 'Luik' },
  { slug: 'luxemburg', label: 'Luxemburg' },
  { slug: 'namen', label: 'Namen' },
  { slug: 'oost-vlaanderen', label: 'Oost-Vlaanderen' },
  { slug: 'vlaams-brabant', label: 'Vlaams-Brabant' },
  { slug: 'waals-brabant', label: 'Waals-Brabant' },
  { slug: 'west-vlaanderen', label: 'West-Vlaanderen' },
] as const

export type ProvinceSlug = (typeof BELGIUM_PROVINCES)[number]['slug']

export const DEFAULT_PROVINCE_SLUG: ProvinceSlug = 'limburg'

export function provinceLabel(slug: string): string {
  return BELGIUM_PROVINCES.find((p) => p.slug === slug)?.label ?? 'België'
}

export const REGION_COOKIE = 'vysiongids_home_region'
