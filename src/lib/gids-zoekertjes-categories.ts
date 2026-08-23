export const ZOEKERTJES_CATEGORY_IDS = [
  'keukenapparatuur',
  'meubilair',
  'servies-glas',
  'kleding-uniform',
  'overige-horeca',
] as const

export type ZoekertjeCategoryId = (typeof ZOEKERTJES_CATEGORY_IDS)[number]

export const ZOEKERTJES_CATEGORIES = ZOEKERTJES_CATEGORY_IDS.map((id) => ({ id }))

/** Stored values in DB (Dutch canonical labels). */
export const ZOEKERTJES_CONDITIONS = ['Nieuw', 'Zo Goed Als Nieuw', 'Gebruikt', 'Zichtbare Gebruikssporen'] as const

export const ZOEKERTJES_KINDS = ['Te koop', 'Te ruil', 'Te huur', 'Gezocht'] as const

export const ZOEKERTJES_CONDITION_MESSAGE_KEYS: Record<(typeof ZOEKERTJES_CONDITIONS)[number], string> = {
  Nieuw: 'zoekertjes.conditions.nieuw',
  'Zo Goed Als Nieuw': 'zoekertjes.conditions.zoGoedAlsNieuw',
  Gebruikt: 'zoekertjes.conditions.gebruikt',
  'Zichtbare Gebruikssporen': 'zoekertjes.conditions.zichtbareGebruikssporen',
}

export const ZOEKERTJES_KIND_MESSAGE_KEYS: Record<(typeof ZOEKERTJES_KINDS)[number], string> = {
  'Te koop': 'zoekertjes.kinds.teKoop',
  'Te ruil': 'zoekertjes.kinds.teRuil',
  'Te huur': 'zoekertjes.kinds.teHuur',
  Gezocht: 'zoekertjes.kinds.gezocht',
}

/** Publieke browse-filters (/zoekertjes) — `value` is DB kind string. */
export const ZOEKERTJES_BROWSE_KIND_OPTIONS = [
  { value: '', labelKey: 'zoekertjes.allKinds' },
  { value: 'Te koop', labelKey: 'zoekertjes.kindBuy' },
  { value: 'Te ruil', labelKey: 'zoekertjes.kindTrade' },
  { value: 'Te huur', labelKey: 'zoekertjes.kindRent' },
  { value: 'Gezocht', labelKey: 'zoekertjes.kindWanted' },
] as const

export function zoekertjeCategoryMessageKey(id: string): string {
  return `zoekertjes.categories.${id}`
}

const CATEGORY_NL_LABEL: Record<string, string> = {
  keukenapparatuur: 'Keukenapparatuur',
  meubilair: 'Meubilair & Inrichting',
  'servies-glas': 'Servies & Glaswerk',
  'kleding-uniform': 'Kleding & Uniform',
  'overige-horeca': 'Overige Horeca',
}

/** Server-side / e-mail fallback (NL canonical). Prefer `t(zoekertjeCategoryMessageKey(id))` in UI. */
export function zoekertjeCategoryLabel(id: string): string {
  return CATEGORY_NL_LABEL[id] ?? id
}

export function zoekertjeMatchesBrowseKind(kind: string | null | undefined, filterValue: string): boolean {
  if (!filterValue) return true
  const k = (kind ?? '').trim()
  if (filterValue === 'Te huur') {
    return k === 'Te huur' || /huur/i.test(k)
  }
  return k === filterValue
}

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
