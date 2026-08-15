'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionInstance = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null
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

export function useVoiceSearch(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recRef = useRef<SpeechRecognitionInstance | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

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
    rec.maxAlternatives = 1
    rec.continuous = false

    const release = () => {
      busyRef.current = false
      setListening(false)
    }

    rec.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.trim() ?? ''
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
  }, [])

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
