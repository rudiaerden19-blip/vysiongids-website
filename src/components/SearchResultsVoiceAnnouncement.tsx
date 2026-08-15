'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { buildSearchResultsSpeechMessage } from '@/lib/search-results-speech'
import { speakDutch } from '@/lib/speak-dutch'

type Props = {
  count: number
  q?: string
  type?: string
  prov?: string
}

/** Spreekt resultaat uit na inspreken (URL bevat kort `voice=1`). */
export default function SearchResultsVoiceAnnouncement({ count, q, type, prov }: Props) {
  const searchParams = useSearchParams()
  const spokenRef = useRef(false)

  useEffect(() => {
    if (spokenRef.current) return
    if (searchParams.get('voice') !== '1') return
    spokenRef.current = true

    const message = buildSearchResultsSpeechMessage({ count, q, type, prov })
    speakDutch(message)

    const url = new URL(window.location.href)
    url.searchParams.delete('voice')
    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '')
    window.history.replaceState(null, '', next)
  }, [count, prov, q, searchParams, type])

  return null
}
