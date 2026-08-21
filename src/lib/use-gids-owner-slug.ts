'use client'

import { useEffect, useState } from 'react'

import { fetchGidsMeBriefCached } from '@/lib/gids-me-brief-client'

export function useGidsOwnerSlug(): { ownerSlug: string | null; authChecked: boolean } {
  const [ownerSlug, setOwnerSlug] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    void fetchGidsMeBriefCached()
      .then((data) => {
        if (data.authenticated && data.slug) setOwnerSlug(data.slug)
      })
      .finally(() => setAuthChecked(true))
  }, [])

  return { ownerSlug, authChecked }
}
