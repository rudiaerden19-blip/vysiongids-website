'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  pickBestVoiceTranscript,
  type VoiceNameHint,
} from '@/lib/voice-search-transcript-fix'

type SpeechRecognitionAlternative = { transcript: string }
type SpeechRecognitionResultLike = {
  isFinal?: boolean
  length: number
  [index: number]: SpeechRecognitionAlternative | undefined
}

type SpeechRecognitionInstance = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult:
    | ((event: { resultIndex: number; results: { length: number } & Record<number, SpeechRecognitionResultLike> }) => void)
    | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function collectTranscriptCandidates(
  event: { resultIndex: number; results: { length: number } & Record<number, SpeechRecognitionResultLike> },
): string[] {
  const out: string[] = []
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const chunk = event.results[i]
    if (!chunk) continue
    for (let j = 0; j < chunk.length; j++) {
      const t = chunk[j]?.transcript?.trim()
      if (t) out.push(t)
    }
  }
  return out
}

type Options = {
  nameHintsRef?: RefObject<VoiceNameHint[] | null>
}

export function useVoiceSearch(onResult: (text: string) => void, options?: Options) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recRef = useRef<SpeechRecognitionInstance | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult
  const hintsRef = options?.nameHintsRef

  useEffect(() => {
    setSupported(!!getSpeechRecognitionCtor())
  }, [])

  const busyRef = useRef(false)

  const startListen = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor || busyRef.current) return

    try {
      recRef.current?.abort()
    } catch {
      /* ignore */
    }

    const rec = new Ctor()
    rec.lang = 'nl-BE'
    rec.interimResults = false
    rec.maxAlternatives = 5
    rec.continuous = false

    const release = () => {
      busyRef.current = false
      setListening(false)
    }

    rec.onresult = (event) => {
      const candidates = collectTranscriptCandidates(event)
      const hints = hintsRef?.current ?? []
      const text = pickBestVoiceTranscript(candidates, hints)
      if (text) onResultRef.current(text)
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    }
    rec.onend = release
    rec.onerror = release

    recRef.current = rec
    busyRef.current = true
    setListening(true)
    rec.start()
  }, [hintsRef])

  useEffect(() => {
    return () => {
      busyRef.current = false
      try {
        recRef.current?.abort()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return { listening, supported, startListen }
}
