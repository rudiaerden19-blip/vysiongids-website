'use client'

import Link from 'next/link'
import { scrollGidsPageToTop } from '@/lib/scroll-page-top'

type Props = {
  href: string
  className?: string
}

/** Zaak «Info»: altijd bovenaan (geen #info-anker). */
export default function ZaakInfoTopLink({ href, className }: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        scrollGidsPageToTop()
      }}
    >
      Info
    </Link>
  )
}
