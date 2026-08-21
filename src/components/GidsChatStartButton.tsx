'use client'

import { useCallback, useEffect, useState } from 'react'
import GidsChatModal from '@/components/GidsChatModal'
import type { GidsChatContextType } from '@/lib/gids-chat-types'

type Props = {
  contextType: GidsChatContextType
  contextId?: string
  contextSlug?: string
  /** Slug van de verkoper/leverancier — chat verborgen als je als die zaak bent ingelogd */
  sellerSlug?: string
  className?: string
  label?: string
  /** voorkom navigatie (binnen Link) */
  stopPropagation?: boolean
}

function loginUrlWithReturn(): string {
  if (typeof window === 'undefined') return '/login'
  const returnTo = `${window.location.pathname}${window.location.search}`
  return `/login?returnTo=${encodeURIComponent(returnTo)}`
}

function normalizeSlug(s: string | undefined): string {
  return (s ?? '').trim().toLowerCase()
}

export default function GidsChatStartButton({
  contextType,
  contextId,
  contextSlug,
  sellerSlug,
  className,
  label = 'Chat',
  stopPropagation = true,
}: Props) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hideAsOwner, setHideAsOwner] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const r = await fetch('/api/gids/me?brief=1', { credentials: 'same-origin' })
        const data = (await r.json()) as { authenticated?: boolean; slug?: string }
        if (cancelled) return
        if (data.authenticated && data.slug) {
          const mine = normalizeSlug(data.slug)
          const seller = normalizeSlug(sellerSlug ?? contextSlug)
          if (mine && seller && mine === seller) {
            setHideAsOwner(true)
          }
        }
      } catch {
        /* anoniem of netwerk — knop tonen */
      } finally {
        if (!cancelled) setSessionChecked(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contextSlug, sellerSlug])

  const startChat = useCallback(async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/gids/chat/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          contextType,
          contextId,
          contextSlug,
        }),
      })
      const data = (await r.json()) as {
        threadId?: string
        error?: string
        code?: string
      }
      if (r.status === 401 || data.code === 'auth') {
        window.location.href = loginUrlWithReturn()
        return
      }
      if (!r.ok) {
        if (data.code === 'membership') {
          const go = window.confirm(
            `${data.error ?? 'Lidmaatschap vereist.'}\n\nNaar beheer gaan om in te loggen of premium te nemen?`,
          )
          if (go) window.location.href = '/beheer'
          return
        }
        if (r.status === 400 && data.error?.includes('jezelf')) {
          return
        }
        alert(data.error ?? 'Chat starten mislukt.')
        return
      }
      if (!data.threadId) {
        alert('Chat kon niet gestart worden.')
        return
      }
      setThreadId(data.threadId)
      setOpen(true)
    } finally {
      setBusy(false)
    }
  }, [contextId, contextSlug, contextType])

  if (!sessionChecked || hideAsOwner) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className={className ?? 'vysiongids-diensten-action-btn'}
        disabled={busy}
        onClick={(e) => {
          if (stopPropagation) {
            e.preventDefault()
            e.stopPropagation()
          }
          void startChat()
        }}
      >
        {busy ? 'Even geduld…' : label}
      </button>
      <GidsChatModal threadId={threadId} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
