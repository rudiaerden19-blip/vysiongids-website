'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useCallback, useEffect, useRef, type CSSProperties } from 'react'
import { LISTING_TYPES } from '@/lib/listing-types'
import { buildSearchResultsSpeechMessage } from '@/lib/search-results-speech'
import { useVoiceSearch } from '@/lib/use-voice-search'
import { primeSpeechSynthesis, speakDutchAsync, stashVoiceSearchAnnouncement } from '@/lib/speak-dutch'
import SearchVoiceMicButton from '@/components/SearchVoiceMicButton'
import type { VoiceNameHint } from '@/lib/voice-search-transcript-fix'
import { fixVoiceSearchTranscript } from '@/lib/voice-search-transcript-fix'
import { getBrowserGeolocation } from '@/lib/browser-geolocation'
import { appendGidsSearchParams, buildGidsSearchPath, searchQueryWantsGeolocation } from '@/lib/gids-search-url'
import {
  fetchListingActionIntent,
  listingActionSpeechMessage,
  tryNavigateListingActionIntent,
} from '@/lib/gids-listing-action-intent-client'
import { normalizeVoiceActionQuery, voiceQueryNeedsGeolocation } from '@/lib/gids-listing-action-intent'
import { saveGidsNavTarget } from '@/lib/gids-nav-session'

const fieldLabel: CSSProperties = {
  display: 'block',
  marginBottom: '0.25rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#374151',
}

const fieldInput: CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.45rem 0.6rem',
  fontSize: '16px',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
}

const heroFieldInput: CSSProperties = {
  ...fieldInput,
  padding: '0.65rem 0.85rem',
  borderRadius: '0.625rem',
}

const heroFieldLabel: CSSProperties = {
  ...fieldLabel,
  fontSize: '0.875rem',
  marginBottom: '0.35rem',
}

const heroFormStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'flex-end',
  gap: '0.75rem 1rem',
  width: '100%',
  maxWidth: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  padding: '1.1rem 1.35rem',
  border: '1px solid #e5e7eb',
  borderRadius: '0.875rem',
  background: '#fff',
  boxShadow: '0 2px 10px rgb(0 0 0 / 0.08)',
}

const heroGrowStyle: CSSProperties = {
  flex: '1 1 14rem',
  minWidth: 'min(100%, 11rem)',
}

const heroTypeStyle: CSSProperties = {
  flex: '0 1 11rem',
  minWidth: '9.5rem',
}

const heroSubmitStyle: CSSProperties = {
  flex: '0 0 auto',
  border: 'none',
  borderRadius: '0.625rem',
  background: 'var(--accent, #0e5d82)',
  color: '#fff',
  padding: '0.68rem 1.45rem',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  width: '100%',
}

function buildSearchPath(
  nextQ: string,
  nextType: string,
  prov: string,
  near?: { lat: number; lng: number } | null,
) {
  return buildGidsSearchPath({ q: nextQ, type: nextType, prov, near })
}

async function nearPointForQuery(q: string): Promise<{ lat: number; lng: number } | undefined> {
  const normalized = normalizeVoiceActionQuery(q.trim())
  if (!searchQueryWantsGeolocation(normalized) && !voiceQueryNeedsGeolocation(normalized)) {
    return undefined
  }
  try {
    return await getBrowserGeolocation()
  } catch {
    return undefined
  }
}

async function fetchSearchSummary(
  q: string,
  type: string,
  prov: string,
  near?: { lat: number; lng: number },
): Promise<{ count: number; top: { slug: string; name: string } | null }> {
  const params = new URLSearchParams()
  appendGidsSearchParams(params, { q, type, prov, near: near ?? null })
  const res = await fetch(`/api/gids/search?${params.toString()}`)
  if (!res.ok) return { count: 0, top: null }
  const data = (await res.json()) as { count?: number; top?: { slug: string; name: string } | null }
  return {
    count: typeof data.count === 'number' ? data.count : 0,
    top: data.top ?? null,
  }
}

type SearchActionsProps = {
  submitStyle: CSSProperties
  formRef: React.RefObject<HTMLFormElement | null>
  qInputRef: React.RefObject<HTMLInputElement | null>
  prov: string
  compact?: boolean
}

function SearchActions({ submitStyle, formRef, qInputRef, prov, compact }: SearchActionsProps) {
  const router = useRouter()
  const voiceNameHintsRef = useRef<VoiceNameHint[]>([])
  const hintsLoadRef = useRef<Promise<void> | null>(null)

  const loadVoiceNameHints = useCallback((): Promise<void> => {
    if (voiceNameHintsRef.current.length > 0) return Promise.resolve()
    if (hintsLoadRef.current) return hintsLoadRef.current
    hintsLoadRef.current = fetch('/api/gids/voice-names')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { hints?: VoiceNameHint[] } | null) => {
        if (data?.hints?.length) voiceNameHintsRef.current = data.hints
      })
      .catch(() => {})
      .finally(() => {
        hintsLoadRef.current = null
      })
    return hintsLoadRef.current
  }, [])

  const runSearchWithQuery = useCallback(
    async (spoken: string) => {
      await loadVoiceNameHints()
      const hints = voiceNameHintsRef.current
      const trimmed = fixVoiceSearchTranscript(normalizeVoiceActionQuery(spoken.trim()), hints)
      if (!trimmed) return
      const form = formRef.current
      const type = form ? String(new FormData(form).get('type') ?? 'all') : 'all'
      if (qInputRef.current) qInputRef.current.value = trimmed

      const near = await nearPointForQuery(trimmed)

      const intent = await fetchListingActionIntent(trimmed, near)
      if (intent.kind !== 'search') {
        const message = listingActionSpeechMessage(intent)
        if (message) {
          stashVoiceSearchAnnouncement(message)
          await speakDutchAsync(message)
        }
        await tryNavigateListingActionIntent(router, trimmed, intent, near)
        return
      }
      if (intent.failedAction) {
        const message = listingActionSpeechMessage(intent)
        if (message) {
          stashVoiceSearchAnnouncement(message)
          await speakDutchAsync(message)
        }
        if (intent.failedAction === 'navigate') return
        return
      }

      let count = 0
      let top: { slug: string; name: string } | null = null
      try {
        const summary = await fetchSearchSummary(trimmed, type, prov, near)
        count = summary.count
        top = summary.top
      } catch {
        count = 0
      }

      if (top) saveGidsNavTarget(top, trimmed)

      const message = buildSearchResultsSpeechMessage({ count, topName: top?.name })
      stashVoiceSearchAnnouncement(message)
      await speakDutchAsync(message)
      router.push(buildSearchPath(trimmed, type, prov, near))
    },
    [formRef, loadVoiceNameHints, prov, qInputRef, router],
  )

  const { listening, supported, startListen } = useVoiceSearch(runSearchWithQuery, {
    nameHintsRef: voiceNameHintsRef,
  })

  const onMicClick = useCallback(async () => {
    primeSpeechSynthesis()
    try {
      await Promise.race([loadVoiceNameHints(), new Promise<void>((r) => window.setTimeout(r, 1200))])
    } catch {
      /* hints optioneel */
    }
    startListen()
  }, [loadVoiceNameHints, startListen])

  return (
    <div
      className={`vysiongids-hero-search-actions${compact ? ' vysiongids-hero-search-actions--compact' : ''}`}
    >
      <button type="submit" className="vysiongids-hero-search-submit" style={submitStyle}>
        Zoeken
      </button>
      <SearchVoiceMicButton listening={listening} supported={supported} onClick={onMicClick} />
    </div>
  )
}

export default function SearchForm({ compact }: { compact?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)
  const qInputRef = useRef<HTMLInputElement>(null)

  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? 'all'
  const prov = searchParams.get('prov') ?? ''

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const nextQ = String(fd.get('q') ?? '').trim()
      const nextType = String(fd.get('type') ?? 'all')
      const queryForIntent = normalizeVoiceActionQuery(nextQ)
      const near = await nearPointForQuery(nextQ)
      if (
        queryForIntent &&
        (await tryNavigateListingActionIntent(router, queryForIntent, undefined, near))
      ) {
        return
      }
      router.push(buildSearchPath(nextQ, nextType, prov, near))
    },
    [router, prov],
  )

  if (!compact) {
    return (
      <form ref={formRef} onSubmit={onSubmit} className="vysiongids-hero-search" style={heroFormStyle}>
        <div className="vysiongids-hero-search-grow" style={heroGrowStyle}>
          <label htmlFor="search-q" style={heroFieldLabel}>
            Stad, postcode of naam
          </label>
          <input
            ref={qInputRef}
            id="search-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Bv frituur dichtbij pizzeria gent frituur nu open"
            autoComplete="off"
            style={heroFieldInput}
          />
        </div>
        <div className="vysiongids-hero-search-type" style={heroTypeStyle}>
          <label htmlFor="search-type" style={heroFieldLabel}>
            Type zaak
          </label>
          <select id="search-type" name="type" defaultValue={type} style={heroFieldInput}>
            {LISTING_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <SearchActions submitStyle={heroSubmitStyle} formRef={formRef} qInputRef={qInputRef} prov={prov} />
      </form>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        gap: '0.75rem',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ flex: '1 1 16rem', minWidth: 'min(100%, 14rem)' }}>
        <label htmlFor="search-q-compact" style={fieldLabel}>
          Stad, postcode of naam
        </label>
        <input
          ref={qInputRef}
          id="search-q-compact"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Bv frituur dichtbij pizzeria gent frituur nu open"
          style={fieldInput}
          autoComplete="off"
        />
      </div>
      <div style={{ flex: '0 1 12rem', minWidth: 'min(100%, 10rem)' }}>
        <label htmlFor="search-type-compact" style={fieldLabel}>
          Type zaak
        </label>
        <select id="search-type-compact" name="type" defaultValue={type} style={fieldInput}>
          {LISTING_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <SearchActions
        submitStyle={{ ...heroSubmitStyle, alignSelf: 'stretch' }}
        formRef={formRef}
        qInputRef={qInputRef}
        prov={prov}
        compact
      />
    </form>
  )
}
