'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { GidsChatMessage, GidsChatThreadDetail } from '@/lib/gids-chat-types'
import { GIDS_CHAT_BODY_MAX, GIDS_CHAT_QUICK_MESSAGES } from '@/lib/gids-chat-types'

type Props = {
  threadId: string | null
  open: boolean
  onClose: () => void
}

function formatChatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function GidsChatModal({ threadId, open, onClose }: Props) {
  const [detail, setDetail] = useState<GidsChatThreadDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    if (!threadId) return
    const r = await fetch(`/api/gids/chat/threads/${encodeURIComponent(threadId)}`, {
      credentials: 'same-origin',
    })
    const data = (await r.json()) as { thread?: GidsChatThreadDetail; error?: string }
    if (!r.ok) {
      setLoadError(data.error ?? 'Laden mislukt.')
      return
    }
    setLoadError(null)
    setDetail(data.thread ?? null)
  }, [threadId])

  useEffect(() => {
    if (!open || !threadId) {
      setDetail(null)
      setLoadError(null)
      setDraft('')
      return
    }
    void refresh()
    const id = window.setInterval(() => void refresh(), 12000)
    return () => window.clearInterval(id)
  }, [open, threadId, refresh])

  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [detail?.messages.length, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  async function sendMessage(text: string) {
    if (!threadId || sending) return
    const body = text.trim()
    if (!body) return
    setSending(true)
    try {
      const r = await fetch(`/api/gids/chat/threads/${encodeURIComponent(threadId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ body }),
      })
      const data = (await r.json()) as { message?: GidsChatMessage; error?: string }
      if (!r.ok) {
        alert(data.error ?? 'Versturen mislukt.')
        return
      }
      setDraft('')
      await refresh()
    } finally {
      setSending(false)
    }
  }

  if (!open || !threadId) return null
  if (typeof document === 'undefined') return null

  const panel = (
    <div className="vysiongids-gids-chat-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label="Sluiten" onClick={onClose} />
      <div className="vysiongids-gids-chat-panel" role="dialog" aria-modal="true" aria-label="Chat">
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label="Sluiten">
          ×
        </button>
        {detail ? (
          <>
            <p className="vysiongids-gids-chat-kicker">Chat · {detail.contextTitle}</p>
            <h2 className="vysiongids-gids-chat-title">
              {detail.peerName}
              <span className="vysiongids-gids-chat-city"> · {detail.peerCity}</span>
            </h2>
          </>
        ) : (
          <h2 className="vysiongids-gids-chat-title">Chat laden…</h2>
        )}
        {loadError ? <p className="vysiongids-gids-chat-error">{loadError}</p> : null}
        <div ref={scrollRef} className="vysiongids-gids-chat-messages">
          {detail?.messages.map((m) => (
            <div
              key={m.id}
              className={`vysiongids-gids-chat-bubble${m.mine ? ' vysiongids-gids-chat-bubble--mine' : ''}`}
            >
              <p className="vysiongids-gids-chat-bubble-text">{m.body}</p>
              <time className="vysiongids-gids-chat-bubble-time" dateTime={m.createdAt}>
                {formatChatTime(m.createdAt)}
              </time>
            </div>
          ))}
          {detail && detail.messages.length === 0 ? (
            <p className="vysiongids-gids-chat-empty">Nog geen berichten. Stel je vraag hieronder.</p>
          ) : null}
        </div>
        <div className="vysiongids-gids-chat-quick">
          {GIDS_CHAT_QUICK_MESSAGES.map((q) => (
            <button
              key={q}
              type="button"
              className="vysiongids-gids-chat-quick-btn"
              disabled={sending}
              onClick={() => void sendMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>
        <form
          className="vysiongids-gids-chat-compose"
          onSubmit={(e) => {
            e.preventDefault()
            void sendMessage(draft)
          }}
        >
          <textarea
            className="vysiongids-gids-chat-input"
            rows={3}
            maxLength={GIDS_CHAT_BODY_MAX}
            placeholder="Typ je bericht…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className="vysiongids-gids-chat-send" disabled={sending || !draft.trim()}>
            {sending ? 'Bezig…' : 'Verstuur'}
          </button>
        </form>
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}
