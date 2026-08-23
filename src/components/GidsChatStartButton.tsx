'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchGidsMeBriefCached } from '@/lib/gids-me-brief-client'
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
  const [hideAsOwner, setHideAsOwner] = useState(false)
  const [pendingTitle, setPendingTitle] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const r = await fetchGidsMeBriefCached()
        const data = r
        if (cancelled) return
        if (data.authenticated && data.slug) {
          const mine = normalizeSlug(data.slug)
          const seller = normalizeSlug(sellerSlug ?? contextSlug)
          if (mine && seller && mine === seller) {
            setHideAsOwner(true)
          }
        }
      } catch {
        /* anoniem */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contextSlug, sellerSlug])

  const startChat = useCallback(async () => {
    setBusy(true)
    setOpen(true)
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
        contextTitle?: string
        error?: string
        code?: string
      }
      if (r.status === 401 || data.code === 'auth') {
        setOpen(false)
        window.location.href = loginUrlWithReturn()
        return
      }
      if (!r.ok) {
        setOpen(false)
        if (data.code === 'membership') {
          alert(data.error ?? 'Chat is voor dit profiel niet beschikbaar.')
          return
        }
        if (r.status === 400 && data.error?.includes('jezelf')) {
          return
        }
        alert(data.error ?? 'Chat starten mislukt.')
        return
      }
      if (!data.threadId) {
        setOpen(false)
        alert('Chat kon niet gestart worden.')
        return
      }
      setPendingTitle(data.contextTitle)
      setThreadId(data.threadId)
      setOpen(true)
    } finally {
      setBusy(false)
    }
  }, [contextId, contextSlug, contextType])

  if (hideAsOwner) {
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
      <GidsChatModal
        threadId={threadId}
        open={open}
        initialContextTitle={pendingTitle}
        onClose={() => {
          setOpen(false)
          setThreadId(null)
        }}
      />
    </>
  )
}
