'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useCallback, useEffect, useRef, useState } from 'react'
import GidsChatModal from '@/components/GidsChatModal'
import type { GidsChatThreadSummary } from '@/lib/gids-chat-types'

type Props = {
  initialThreadId?: string | null
}

export default function BeheerGidsChatSection({ initialThreadId }: Props) {
  const { t } = useLanguage()
  const [threads, setThreads] = useState<GidsChatThreadSummary[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId ?? null)
  const [modalOpen, setModalOpen] = useState(Boolean(initialThreadId))
  const sectionRef = useRef<HTMLElement>(null)
  const pollRef = useRef<number | null>(null)
  const [unreadPollCount, setUnreadPollCount] = useState(0)

  const inboxContextKicker = useCallback(
    (thread: GidsChatThreadSummary) =>
      thread.contextType === 'zoekertje' ? t('beheer.chatContextZoekertje') : t('beheer.chatContextSupplier'),
    [t],
  )

  const refreshUnreadOnly = useCallback(async () => {
    const r = await fetch('/api/gids/chat/unread', { credentials: 'same-origin' })
    if (!r.ok) return
    const data = (await r.json()) as { unread?: number }
    setUnreadPollCount(typeof data.unread === 'number' ? data.unread : 0)
  }, [])

  const unreadConversationCount = threads.filter((th) => th.unread).length

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
      setLoadError(data.error ?? t('beheer.chatThreadsLoadFailed'))
      return
    }
    setThreads(data.threads ?? [])
  }, [t])

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

  const badgeCount = threads.length > 0 ? unreadConversationCount : unreadPollCount

  const deleteThread = useCallback(
    async (id: string) => {
      const ok = window.confirm(t('beheer.chatDeleteConfirm'))
      if (!ok) return
      const r = await fetch(`/api/gids/chat/threads/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const data = (await r.json()) as { error?: string }
      if (!r.ok) {
        alert(data.error ?? t('errors.deleteFailed'))
        return
      }
      if (activeThreadId === id) {
        setModalOpen(false)
        setActiveThreadId(null)
      }
      await refresh()
      await refreshUnreadOnly()
    },
    [activeThreadId, refresh, refreshUnreadOnly, t],
  )

  return (
    <section ref={sectionRef} className="vysiongids-surface-card rounded-xl bg-white p-5">
      <div className="vysiongids-gids-chat-section-head">
        <h2 className="text-lg font-bold text-gray-900">{t('beheer.chatTitle')}</h2>
        {badgeCount > 0 ? (
          <span
            className="vysiongids-gids-chat-unread-badge"
            aria-label={t('beheer.chatUnreadAria', { count: badgeCount })}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : null}
      </div>
      {badgeCount > 0 ? (
        <p className="mt-1 text-sm font-medium text-[#0e5d82]">
          {badgeCount === 1
            ? t('beheer.chatUnreadSummaryOne')
            : t('beheer.chatUnreadSummaryMany', { count: badgeCount })}
        </p>
      ) : null}
      <p className={`text-sm text-gray-600${badgeCount > 0 ? ' mt-2' : ' mt-1'}`}>{t('beheer.chatSectionLead')}</p>
      {loadError ? <p className="mt-3 text-sm text-amber-800">{loadError}</p> : null}
      <ul className="vysiongids-gids-chat-inbox mt-4">
        {threads.map((thread) => (
          <li key={thread.id} className="vysiongids-gids-chat-inbox-row">
            <button
              type="button"
              className={`vysiongids-gids-chat-inbox-item${thread.unread ? ' vysiongids-gids-chat-inbox-item--unread' : ''}`}
              onClick={() => {
                setActiveThreadId(thread.id)
                setModalOpen(true)
              }}
            >
              <span className="vysiongids-gids-chat-inbox-kicker">{inboxContextKicker(thread)}</span>
              <span className="vysiongids-gids-chat-inbox-title">
                {thread.contextTitle}
                {thread.unread ? <span className="vysiongids-gids-chat-unread-dot" aria-label={t('beheer.chatUnreadDot')} /> : null}
              </span>
              {thread.contextMeta ? (
                <span className="vysiongids-gids-chat-inbox-meta">{thread.contextMeta}</span>
              ) : null}
              <span className="vysiongids-gids-chat-inbox-peer">
                {t('beheer.chatInboxFrom', { name: thread.peerName, city: thread.peerCity })}
              </span>
              {thread.lastMessagePreview ? (
                <span className="vysiongids-gids-chat-inbox-preview">{thread.lastMessagePreview}</span>
              ) : null}
            </button>
            <button
              type="button"
              className="vysiongids-gids-chat-inbox-delete"
              aria-label={t('beheer.chatDeleteAria', { title: thread.contextTitle })}
              onClick={() => void deleteThread(thread.id)}
            >
              {t('beheer.chatInboxDelete')}
            </button>
          </li>
        ))}
      </ul>
      {threads.length === 0 && !loadError ? (
        <p className="mt-4 text-sm text-gray-500">{t('beheer.chatEmpty')}</p>
      ) : null}
      <GidsChatModal
        threadId={activeThreadId}
        open={modalOpen}
        onDeleted={async () => {
          setActiveThreadId(null)
          await refresh()
          await refreshUnreadOnly()
        }}
        onClose={() => {
          setModalOpen(false)
          void refresh()
          void refreshUnreadOnly()
        }}
      />
    </section>
  )
}
