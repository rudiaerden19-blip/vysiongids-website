'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import GidsChatModal from '@/components/GidsChatModal'
import type { GidsChatThreadSummary } from '@/lib/gids-chat-types'

type Props = {
  initialThreadId?: string | null
}

export default function BeheerGidsChatSection({ initialThreadId }: Props) {
  const [threads, setThreads] = useState<GidsChatThreadSummary[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId ?? null)
  const [modalOpen, setModalOpen] = useState(Boolean(initialThreadId))
  const sectionRef = useRef<HTMLElement>(null)
  const pollRef = useRef<number | null>(null)
  const [unreadPollCount, setUnreadPollCount] = useState(0)

  const refreshUnreadOnly = useCallback(async () => {
    const r = await fetch('/api/gids/chat/unread', { credentials: 'same-origin' })
    if (!r.ok) return
    const data = (await r.json()) as { unread?: number }
    setUnreadPollCount(typeof data.unread === 'number' ? data.unread : 0)
  }, [])

  const unreadConversationCount = threads.filter((t) => t.unread).length

  useEffect(() => {
    if (initialThreadId) {
      setActiveThreadId(initialThreadId)
      setModalOpen(true)
    }
  }, [initialThreadId])

  const refresh = useCallback(async () => {
    setLoadError(null)
    const r = await fetch('/api/gids/chat/threads', { credentials: 'same-origin' })
    const data = (await r.json()) as { threads?: GidsChatThreadSummary[]; error?: string; code?: string }
    if (r.status === 403 && data.code === 'membership') {
      setThreads([])
      setLoadError(data.error ?? null)
      return
    }
    if (!r.ok) {
      setLoadError(data.error ?? 'Berichten laden mislukt.')
      return
    }
    setThreads(data.threads ?? [])
  }, [])

  useEffect(() => {
    if (initialThreadId) void refresh()
  }, [initialThreadId, refresh])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let started = false
    const start = () => {
      if (started) return
      started = true
      void refresh()
      pollRef.current = window.setInterval(() => {
        if (document.visibilityState !== 'visible') return
        void refresh()
      }, 25000)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) start()
      },
      { rootMargin: '120px' },
    )
    observer.observe(section)

    return () => {
      observer.disconnect()
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
  }, [refresh])

  useEffect(() => {
    void refreshUnreadOnly()
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void refreshUnreadOnly()
    }, 20000)
    return () => window.clearInterval(id)
  }, [refreshUnreadOnly])

  const badgeCount =
    threads.length > 0 ? unreadConversationCount : unreadPollCount

  return (
    <section ref={sectionRef} className="vysiongids-surface-card rounded-xl bg-white p-5">
      <div className="vysiongids-gids-chat-section-head">
        <h2 className="text-lg font-bold text-gray-900">Berichten</h2>
        {badgeCount > 0 ? (
          <span className="vysiongids-gids-chat-unread-badge" aria-label={`${badgeCount} ongelezen gesprekken`}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : null}
      </div>
      {badgeCount > 0 ? (
        <p className="mt-1 text-sm font-medium text-[#0e5d82]">
          {badgeCount === 1
            ? '1 nieuw gesprek met ongelezen berichten'
            : `${badgeCount} gesprekken met ongelezen berichten`}
        </p>
      ) : null}
      <p className={`text-sm text-gray-600${badgeCount > 0 ? ' mt-2' : ' mt-1'}`}>
        Chat met andere leden over zoekertjes of leveranciersprofielen (premium vereist).
      </p>
      {loadError ? <p className="mt-3 text-sm text-amber-800">{loadError}</p> : null}
      <ul className="vysiongids-gids-chat-inbox mt-4">
        {threads.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className={`vysiongids-gids-chat-inbox-item${t.unread ? ' vysiongids-gids-chat-inbox-item--unread' : ''}`}
              onClick={() => {
                setActiveThreadId(t.id)
                setModalOpen(true)
              }}
            >
              <span className="vysiongids-gids-chat-inbox-title">
                {t.contextTitle}
                {t.unread ? <span className="vysiongids-gids-chat-unread-dot" aria-label="Ongelezen" /> : null}
              </span>
              <span className="vysiongids-gids-chat-inbox-peer">
                {t.peerName} · {t.peerCity}
              </span>
              {t.lastMessagePreview ? (
                <span className="vysiongids-gids-chat-inbox-preview">{t.lastMessagePreview}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      {threads.length === 0 && !loadError ? (
        <p className="mt-4 text-sm text-gray-500">Nog geen gesprekken. Start chat via een zoekertje of leveranciersprofiel.</p>
      ) : null}
      <GidsChatModal
        threadId={activeThreadId}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          void refresh()
          void refreshUnreadOnly()
        }}
      />
    </section>
  )
}
