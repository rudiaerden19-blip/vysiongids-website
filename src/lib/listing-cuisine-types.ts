export const LISTING_CUISINE_TYPES = [
  { id: 'frans', emoji: '🇫🇷', label: 'Franse keuken' },
  { id: 'italiaans', emoji: '🇮🇹', label: 'Italiaanse keuken' },
  { id: 'belgisch', emoji: '🇧🇪', label: 'Belgische keuken' },
  { id: 'turks', emoji: '🇹🇷', label: 'Turkse keuken' },
  { id: 'grieks', emoji: '🇬🇷', label: 'Griekse keuken' },
  { id: 'japans', emoji: '🇯🇵', label: 'Japanse keuken' },
  { id: 'chinees', emoji: '🇨🇳', label: 'Chinese keuken' },
  { id: 'indisch', emoji: '🇮🇳', label: 'Indische keuken' },
  { id: 'mexicaans', emoji: '🇲🇽', label: 'Mexicaanse keuken' },
  { id: 'amerikaans', emoji: '🍔', label: 'Amerikaanse keuken' },
  { id: 'grill', emoji: '🥩', label: 'Grill' },
  { id: 'sushi', emoji: '🍣', label: 'Sushi' },
  { id: 'pizzeria', emoji: '🍕', label: 'Pizzeria' },
  { id: 'frituur', emoji: '🍟', label: 'Frituur' },
  { id: 'vegetarisch', emoji: '🥗', label: 'Vegetarisch' },
] as const

export type ListingCuisineId = (typeof LISTING_CUISINE_TYPES)[number]['id']

export const VALID_CUISINE_IDS: ListingCuisineId[] = LISTING_CUISINE_TYPES.map((c) => c.id)

export function getListingCuisineLabel(id: string | null | undefined): string | null {
  if (!id?.trim()) return null
  return LISTING_CUISINE_TYPES.find((c) => c.id === id)?.label ?? null
}

export function getListingCuisineDisplay(id: string | null | undefined): string | null {
  if (!id?.trim()) return null
  const item = LISTING_CUISINE_TYPES.find((c) => c.id === id)
  if (!item) return null
  return `${item.emoji} ${item.label}`
}
