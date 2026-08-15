'use client'

import { useEffect, useState } from 'react'

export function useGidsOwnerSlug(): { ownerSlug: string | null; authChecked: boolean } {
  const [ownerSlug, setOwnerSlug] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    fetch('/api/gids/me')
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; slug?: string }) => {
        if (data.authenticated && data.slug) setOwnerSlug(data.slug)
      })
      .finally(() => setAuthChecked(true))
  }, [])

  return { ownerSlug, authChecked }
}
