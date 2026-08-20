'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect } from 'react'
import { scrollGidsPageToTop } from '@/lib/scroll-page-top'

/** Altijd bovenaan starten bij refresh, terug/vooruit en route-wissel — geen midden van de pagina. */
export default function ScrollToTopOnNavigation() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    scrollGidsPageToTop()
    const raf = requestAnimationFrame(() => {
      scrollGidsPageToTop()
      requestAnimationFrame(scrollGidsPageToTop)
    })
    const t = window.setTimeout(scrollGidsPageToTop, 120)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [pathname])

  useLayoutEffect(() => {
    const onPageShow = () => {
      scrollGidsPageToTop()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  return null
}
