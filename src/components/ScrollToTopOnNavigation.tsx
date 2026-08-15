'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect } from 'react'

function scrollWindowToTop() {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

/** Altijd bovenaan starten bij refresh, terug/vooruit en route-wissel — geen midden van de pagina. */
export default function ScrollToTopOnNavigation() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    scrollWindowToTop()
  }, [pathname])

  useLayoutEffect(() => {
    const onPageShow = () => {
      scrollWindowToTop()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  return null
}
