'use client'

import { useEffect, useRef, useState } from 'react'

export function useLazyInView(enabled: boolean, rootMargin = '320px 0px'): {
  ref: React.RefObject<HTMLDivElement | null>
  inView: boolean
} {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(!enabled)

  useEffect(() => {
    if (!enabled) {
      setInView(true)
      return
    }
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin, threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [enabled, rootMargin])

  return { ref, inView }
}
