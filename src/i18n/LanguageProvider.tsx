'use client'

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  type Locale,
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
} from '@/i18n/config'
import {
  formatMessage,
  getDefaultLocaleMessages,
  loadLocaleMessages,
  translateKey,
  translateKeyStringArray,
  type Messages,
} from '@/i18n/locale-messages'

type LanguageContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  tList: (key: string) => string[]
  locales: readonly Locale[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function readCookieLocale(): Locale {
  if (typeof document === 'undefined') return defaultLocale
  const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))
  const raw = m?.[1]
  return isLocale(raw) ? raw : defaultLocale
}

function applyDocumentLocale(locale: Locale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [catalog, setCatalog] = useState<Partial<Record<Locale, Messages>>>(() => ({
    [defaultLocale]: getDefaultLocaleMessages(),
  }))

  useLayoutEffect(() => {
    const initial = readCookieLocale()
    setLocaleState(initial)
    applyDocumentLocale(initial)
    if (initial !== defaultLocale) {
      void loadLocaleMessages(initial).then((msgs) => {
        setCatalog((prev) => ({ ...prev, [initial]: msgs }))
      })
    }
  }, [])

  const setLocale = useCallback(
    (next: Locale) => {
      if (!locales.includes(next)) return
      setLocaleState(next)
      setLocaleCookie(next)
      applyDocumentLocale(next)
      void loadLocaleMessages(next).then((msgs) => {
        setCatalog((prev) => ({ ...prev, [next]: msgs }))
      })
      router.refresh()
    },
    [router],
  )

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const text = translateKey(key, locale, catalog)
      return formatMessage(text, vars)
    },
    [locale, catalog],
  )

  const tList = useCallback(
    (key: string) => translateKeyStringArray(key, locale, catalog),
    [locale, catalog],
  )

  const value = useMemo(() => ({ locale, setLocale, t, tList, locales }), [locale, setLocale, t, tList])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

/** Safe when provider missing (returns Dutch key path). */
export function useT() {
  const ctx = useContext(LanguageContext)
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      if (!ctx) {
        const text = translateKey(key, defaultLocale, { [defaultLocale]: getDefaultLocaleMessages() })
        return formatMessage(text, vars)
      }
      return ctx.t(key, vars)
    },
    [ctx],
  )
}
