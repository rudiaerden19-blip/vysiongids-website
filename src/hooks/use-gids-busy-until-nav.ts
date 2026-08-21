'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

/** Blijft `true` tot de route verandert (na router.push) of je handmatig stopt. */
export function useGidsBusyUntilNav() {
  const pathname = usePathname()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setBusy(false)
  }, [pathname])

  const startBusy = useCallback(() => setBusy(true), [])
  const stopBusy = useCallback(() => setBusy(false), [])

  return { busy, startBusy, stopBusy, setBusy }
}
