'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/i18n/LanguageProvider'

/** Zet document.lang gelijk aan gekozen locale. */
export default function DocumentLangSync() {
  const { locale } = useLanguage()
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return null
}
