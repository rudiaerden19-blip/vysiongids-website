import { cookies } from 'next/headers'
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from './config'

export async function getServerLocale(): Promise<Locale> {
  const jar = await cookies()
  const raw = jar.get(LOCALE_COOKIE)?.value
  return isLocale(raw) ? raw : defaultLocale
}
