'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { GidsChatMessage, GidsChatThreadDetail } from '@/lib/gids-chat-types'
import { GIDS_CHAT_BODY_MAX, GIDS_CHAT_QUICK_MESSAGES } from '@/lib/gids-chat-types'

type Props = {
  threadId: string | null
  open: boolean
  onClose: () => void
  initialContextTitle?: string
  onDeleted?: () => void | Promise<void>
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

export default function GidsChatModal({ threadId, open, onClose, initialContextTitle, onDeleted }: Props) {
  const { t } = useLanguage()
  const [detail, setDetail] = useState<GidsChatThreadDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const refreshGenRef = useRef(0)
  const sendingRef = useRef(false)

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!threadId) return
    const gen = ++refreshGenRef.current
    const r = await fetch(`/api/gids/chat/threads/${encodeURIComponent(threadId)}`, {
      credentials: 'same-origin',
    })
    if (gen !== refreshGenRef.current) return
    const data = (await r.json()) as { thread?: GidsChatThreadDetail; error?: string }
    if (!r.ok) {
      if (!opts?.silent) setLoadError(data.error ?? t('errors.loadFailed'))
      return
    }
    setLoadError(null)
    setDetail(data.thread ?? null)
  }, [threadId])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!threadId || sendingRef.current) return
      const body = text.trim()
      if (!body) return
      sendingRef.current = true
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
          alert(data.error ?? t('beheer.gidsChatSendFailed'))
          return
        }
        if (data.message) {
          refreshGenRef.current += 1
          setDetail((prev) => {
            if (!prev) return prev
            if (prev.messages.some((m) => m.id === data.message!.id)) return prev
            return { ...prev, messages: [...prev.messages, data.message!] }
          })
        }
        setDraft('')
        await refresh({ silent: true })
      } finally {
        sendingRef.current = false
        setSending(false)
      }
    },
    [refresh, threadId],
  )

  useEffect(() => {
    if (!open || !threadId) {
      setDetail(null)
      setLoadError(null)
      setDraft('')
      return
    }
    void refresh()
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void refresh({ silent: true })
    }, 20000)
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

  async function handleDeleteThread() {
    if (!threadId || deleting) return
    const ok = window.confirm(t('beheer.chatDeleteConfirmExtended'))
    if (!ok) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/gids/chat/threads/${encodeURIComponent(threadId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = (await r.json()) as { error?: string }
      if (!r.ok) {
        alert(data.error ?? t('errors.deleteFailed'))
        return
      }
      if (onDeleted) await onDeleted()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  if (!open) return null
  if (typeof document === 'undefined') return null

  if (!threadId) {
    const loadingPanel = (
      <div className="vysiongids-gids-chat-root" role="presentation">
        <button type="button" className="vysiongids-job-modal-backdrop" aria-label={t('common.close')} onClick={onClose} />
        <div className="vysiongids-gids-chat-panel" role="dialog" aria-modal="true" aria-label="Chat">
          <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
          <h2 className="vysiongids-gids-chat-title">{t('beheer.gidsChatPreparing')}</h2>
        </div>
      </div>
    )
    return createPortal(loadingPanel, document.body)
  }

  const panel = (
    <div className="vysiongids-gids-chat-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div className="vysiongids-gids-chat-panel" role="dialog" aria-modal="true" aria-label="Chat">
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
        {detail ? (
          <>
            <p className="vysiongids-gids-chat-kicker">
              {detail.contextType === 'zoekertje' ? t('beheer.chatContextZoekertje') : t('beheer.chatContextSupplier')}
            </p>
            <h2 className="vysiongids-gids-chat-title">{detail.contextTitle}</h2>
            {detail.contextMeta ? (
              <p className="vysiongids-gids-chat-context-meta">{detail.contextMeta}</p>
            ) : null}
            <p className="vysiongids-gids-chat-peer-line">
              {t('beheer.gidsChatWithPeer', { name: detail.peerName })}
              <span className="vysiongids-gids-chat-city"> · {detail.peerCity}</span>
            </p>
          </>
        ) : (
          <h2 className="vysiongids-gids-chat-title">
            {initialContextTitle ? t('beheer.gidsChatTitlePrefix', { title: initialContextTitle }) : t('beheer.gidsChatLoading')}
          </h2>
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
            <p className="vysiongids-gids-chat-empty">{t('beheer.gidsChatEmptyThread')}</p>
          ) : null}
        </div>
        <div className="vysiongids-gids-chat-quick">
          {GIDS_CHAT_QUICK_MESSAGES.map((q) => (
            <button
              key={q}
              type="button"
              className="vysiongids-gids-chat-quick-btn"
              disabled={sending || Boolean(loadError)}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void sendMessage(q)
              }}
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
            placeholder={t('beheer.gidsChatPlaceholder')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="vysiongids-gids-chat-send"
            disabled={sending || Boolean(loadError) || !draft.trim()}
          >
            {sending ? t('common.busy') : t('beheer.gidsChatSend')}
          </button>
        </form>
        {onDeleted ? (
          <button
            type="button"
            className="vysiongids-gids-chat-delete"
            disabled={deleting || sending}
            onClick={() => void handleDeleteThread()}
          >
            {deleting ? t('common.busy') : t('beheer.gidsChatDeleteThread')}
          </button>
        ) : null}
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}
