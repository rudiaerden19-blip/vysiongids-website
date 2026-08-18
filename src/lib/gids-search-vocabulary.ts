/** Zoek-/spraaktermen die nooit naar een zaaknaam mogen worden gecorrigeerd. */
export const PROTECTED_SEARCH_VOCABULARY = new Set([
  'frituur',
  'friet',
  'frites',
  'frieten',
  'friture',
  'frituurzaak',
  'kebab',
  'kebap',
  'pizza',
  'pizzeria',
  'snack',
  'snackbar',
  'restaurant',
  'resto',
  'traiteur',
  'broodjeszaak',
  'broodjes',
  'sushi',
  'chinees',
  'bistro',
  'café',
  'cafe',
  'dichtbij',
  'antwerpen',
  'mechelen',
  'gent',
  'hasselt',
  'pelt',
  'genk',
  'leuven',
  'brussel',
  'brugge',
])

/** STT/typo → canonieke zoekterm (type zaak). */
export function canonicalizeSearchToken(token: string): string {
  const t = token.toLowerCase()
  if (t === 'frites' || t === 'frite') return 'frituur'
  return token
}
