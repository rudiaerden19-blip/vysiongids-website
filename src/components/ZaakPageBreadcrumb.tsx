'use client'

import Link from 'next/link'
import { useLanguage } from '@/i18n/LanguageProvider'

export default function ZaakPageBreadcrumb({ city }: { city: string }) {
  const { t } = useLanguage()

  return (
    <nav className="mb-4 text-sm text-gray-500">
      <Link href="/" className="hover:text-accent">
        {t('common.home')}
      </Link>
      <span className="mx-2">{t('common.breadcrumbSeparator')}</span>
      <Link href="/zoeken" className="hover:text-accent">
        {t('listing.breadcrumbZoeken')}
      </Link>
      <span className="mx-2">{t('common.breadcrumbSeparator')}</span>
      <span className="text-gray-800">{city}</span>
    </nav>
  )
}
