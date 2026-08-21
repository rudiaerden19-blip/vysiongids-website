'use client'

import { useCallback, useState } from 'react'
import GidsChatModal from '@/components/GidsChatModal'
import type { GidsChatContextType } from '@/lib/gids-chat-types'

type Props = {
  contextType: GidsChatContextType
  contextId?: string
  contextSlug?: string
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

export default function GidsChatStartButton({
  contextType,
  contextId,
  contextSlug,
  className,
  label = 'Chat',
  stopPropagation = true,
}: Props) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

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
