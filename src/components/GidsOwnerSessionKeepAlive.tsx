'use client'

import { useEffect, useRef } from 'react'

const PING_MS = 2 * 60 * 1000

/** Verleng owner-sessie tijdens beheer (idle-timeout zie gids-session). */
export default function GidsOwnerSessionKeepAlive() {
  const lastActivity = useRef(Date.now())
  const lastPing = useRef(0)

  useEffect(() => {
    const markActive = () => {
      lastActivity.current = Date.now()
    }
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    for (const ev of events) {
      window.addEventListener(ev, markActive, { passive: true })
    }

    const ping = () => {
      const idleFor = Date.now() - lastActivity.current
      if (idleFor > 4.5 * 60 * 1000) return
      if (Date.now() - lastPing.current < PING_MS - 1000) return
      lastPing.current = Date.now()
      void fetch('/api/gids/session/touch', { method: 'POST', credentials: 'same-origin' }).catch(() => {})
    }

    const id = window.setInterval(ping, PING_MS)
    markActive()
    const firstPingDelay = window.setTimeout(ping, 12_000)

    return () => {
      window.clearTimeout(firstPingDelay)
      window.clearInterval(id)
      for (const ev of events) {
        window.removeEventListener(ev, markActive)
      }
    }
  }, [])

  return null
}
