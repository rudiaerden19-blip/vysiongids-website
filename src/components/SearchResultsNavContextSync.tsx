'use client'

import { useEffect } from 'react'
import { saveGidsNavTarget } from '@/lib/gids-nav-session'

type Props = {
  listings: { slug: string; name: string }[]
  query?: string
}

/** Onthoud bovenste zoekresultaat voor «waze er naartoe». */
export default function SearchResultsNavContextSync({ listings, query }: Props) {
  useEffect(() => {
    const first = listings[0]
    if (!first) return
    saveGidsNavTarget(first, query)
  }, [listings, query])

  return null
}
