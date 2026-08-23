import type { Locale } from './config'
import { defaultLocale } from './config'
import nlMessages from '../../messages/nl.json'

export type Messages = Record<string, unknown>

const cache: Partial<Record<Locale, Messages>> = {
  [defaultLocale]: nlMessages as Messages,
}

const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  nl: () => Promise.resolve({ default: nlMessages as Messages }),
  en: () => import('../../messages/en.json'),
  fr: () => import('../../messages/fr.json'),
}

export function getCachedLocaleMessages(locale: Locale): Messages | undefined {
  return cache[locale]
}

export function getDefaultLocaleMessages(): Messages {
  return cache[defaultLocale]!
}

export async function loadLocaleMessages(locale: Locale): Promise<Messages> {
  const hit = cache[locale]
  if (hit) return hit
  const mod = await loaders[locale]()
  cache[locale] = mod.default
  return mod.default
}

function resolveKey(catalog: Messages, keys: string[]): unknown {
  let value: unknown = catalog
  for (const k of keys) {
    if (value && typeof value === 'object' && k in (value as object)) {
      value = (value as Record<string, unknown>)[k]
    } else {
      return undefined
    }
  }
  return value
}

function resolveStringKey(
  key: string,
  locale: Locale,
  catalog: Partial<Record<Locale, Messages>>,
): string | undefined {
  const keys = key.split('.')
  const primary =
    catalog[locale] ?? getCachedLocaleMessages(locale) ?? catalog[defaultLocale] ?? getDefaultLocaleMessages()

  const hit = resolveKey(primary, keys)
  if (typeof hit === 'string') return hit

  const fallback = catalog[defaultLocale] ?? getDefaultLocaleMessages()
  const fb = resolveKey(fallback, keys)
  if (typeof fb === 'string') return fb

  return undefined
}

export function translateKey(
  key: string,
  locale: Locale,
  catalog: Partial<Record<Locale, Messages>>,
): string {
  return resolveStringKey(key, locale, catalog) ?? key
}

export function translateKeyStringArray(
  key: string,
  locale: Locale,
  catalog: Partial<Record<Locale, Messages>>,
): string[] {
  const keys = key.split('.')
  const tryCatalog = (msgs: Messages): string[] | undefined => {
    const hit = resolveKey(msgs, keys)
    if (Array.isArray(hit) && hit.every((x) => typeof x === 'string')) return hit as string[]
    return undefined
  }

  const primary =
    catalog[locale] ?? getCachedLocaleMessages(locale) ?? catalog[defaultLocale] ?? getDefaultLocaleMessages()
  const fromPrimary = tryCatalog(primary)
  if (fromPrimary) return fromPrimary

  const fallback = catalog[defaultLocale] ?? getDefaultLocaleMessages()
  return tryCatalog(fallback) ?? []
}

export function formatMessage(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
  )
}
