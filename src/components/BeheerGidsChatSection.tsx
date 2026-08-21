'use client'

import { useCallback, useEffect, useState } from 'react'
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
    void refresh()
    const id = window.setInterval(() => void refresh(), 20000)
    return () => window.clearInterval(id)
  }, [refresh])

  useEffect(() => {
    if (initialThreadId) {
      setActiveThreadId(initialThreadId)
      setModalOpen(true)
    }
  }, [initialThreadId])

  return (
    <section className="vysiongids-surface-card rounded-xl bg-white p-5">
      <h2 className="text-lg font-bold text-gray-900">Berichten</h2>
      <p className="mt-1 text-sm text-gray-600">
        Chat met andere leden over zoekertjes of leveranciersprofielen (premium vereist).
      </p>
      {loadError ? <p className="mt-3 text-sm text-amber-800">{loadError}</p> : null}
      <ul className="vysiongids-gids-chat-inbox mt-4">
        {threads.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="vysiongids-gids-chat-inbox-item"
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
        }}
      />
    </section>
  )
}
