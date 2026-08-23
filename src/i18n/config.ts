export const locales = ['nl', 'fr', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'nl'

export const LOCALE_COOKIE = 'vysiongids_locale'

export const localeLabels: Record<Locale, string> = {
  nl: 'NL',
  fr: 'FR',
  en: 'EN',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value !== undefined && value !== null && (locales as readonly string[]).includes(value)
}
