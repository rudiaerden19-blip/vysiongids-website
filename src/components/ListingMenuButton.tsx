'use client'

import Link from 'next/link'
import { useLanguage } from '@/i18n/LanguageProvider'
import type { Listing } from '@/lib/listing-types'
import { resolveListingMenuTarget } from '@/lib/listing-menu'

type Props = {
  listing: Listing
  className: string
}

/** Menu-knop — altijd zichtbaar; link of PDF-viewer op de gids. */
export default function ListingMenuButton({ listing, className }: Props) {
  const { t } = useLanguage()
  const target = resolveListingMenuTarget(listing)

  if (target.kind === 'external') {
    return (
      <a href={target.href} target="_blank" rel="noopener noreferrer" className={className}>
        {t('common.menu')}
      </a>
    )
  }

  return (
    <Link href={target.href} className={className}>
      {t('common.menu')}
    </Link>
  )
}
