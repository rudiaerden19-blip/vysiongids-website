'use client'

import Link from 'next/link'
import { useLanguage } from '@/i18n/LanguageProvider'
import { scrollGidsPageToTop } from '@/lib/scroll-page-top'

type Props = {
  href: string
  className?: string
}

/** Zaak «Info»: altijd bovenaan (geen #info-anker). */
export default function ZaakInfoTopLink({ href, className }: Props) {
  const { t } = useLanguage()
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        scrollGidsPageToTop()
      }}
    >
      {t('common.info')}
    </Link>
  )
}
