import nl from '../../messages/nl.json'
import en from '../../messages/en.json'
import fr from '../../messages/fr.json'
import { defaultLocale, type Locale } from './config'
import { formatMessage, translateKey, translateKeyStringArray } from './locale-messages'
import { getServerLocale } from './get-server-locale'

const serverCatalog: Partial<Record<Locale, Record<string, unknown>>> = {
  nl: nl as Record<string, unknown>,
  fr: fr as Record<string, unknown>,
  en: en as Record<string, unknown>,
}

export async function tServer(key: string, vars?: Record<string, string | number>): Promise<string> {
  const locale = await getServerLocale()
  const text = translateKey(key, locale, serverCatalog)
  if (locale === defaultLocale || text !== key) return formatMessage(text, vars)
  return formatMessage(translateKey(key, defaultLocale, serverCatalog), vars)
}

export async function tServerList(key: string): Promise<string[]> {
  const locale = await getServerLocale()
  const list = translateKeyStringArray(key, locale, serverCatalog)
  if (list.length > 0 || locale === defaultLocale) return list
  return translateKeyStringArray(key, defaultLocale, serverCatalog)
}
