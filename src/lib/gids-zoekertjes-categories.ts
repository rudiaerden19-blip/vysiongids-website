export const ZOEKERTJES_CATEGORIES = [
  { id: 'keukenapparatuur', label: 'Keukenapparatuur' },
  { id: 'meubilair', label: 'Meubilair & Inrichting' },
  { id: 'servies-glas', label: 'Servies & Glaswerk' },
  { id: 'kleding-uniform', label: 'Kleding & Uniform' },
  { id: 'overige-horeca', label: 'Overige Horeca' },
] as const

export type ZoekertjeCategoryId = (typeof ZOEKERTJES_CATEGORIES)[number]['id']

export const ZOEKERTJES_CONDITIONS = ['Nieuw', 'Zo Goed Als Nieuw', 'Gebruikt', 'Zichtbare Gebruikssporen'] as const

export const ZOEKERTJES_KINDS = ['Te koop', 'Te ruil', 'Gezocht'] as const

export const ZOEKERTJES_PRICE_CLASSES = [
  'Bieden',
  'Gratis',
  '€1 – €25',
  '€25 – €50',
  '€50 – €100',
  '€100 – €250',
  '€250 – €500',
  '€500 Of Meer',
] as const

const TITLE_HINTS: { pattern: RegExp; category: ZoekertjeCategoryId }[] = [
  { pattern: /oven|friteuse|koel|vriezer|afwasmachine|grill|mixer|fornuis|keuken/i, category: 'keukenapparatuur' },
  { pattern: /stoel|tafel|bar|inricht|meubel|bank/i, category: 'meubilair' },
  { pattern: /bord|glas|servies|bestek|kop/i, category: 'servies-glas' },
  { pattern: /schort|uniform|kleding|jas/i, category: 'kleding-uniform' },
]

export function guessZoekertjeCategoryFromTitle(title: string): ZoekertjeCategoryId | '' {
  const t = title.trim()
  if (!t) return ''
  for (const { pattern, category } of TITLE_HINTS) {
    if (pattern.test(t)) return category
  }
  return ''
}

export function zoekertjeCategoryLabel(id: string): string {
  return ZOEKERTJES_CATEGORIES.find((c) => c.id === id)?.label ?? id
}
