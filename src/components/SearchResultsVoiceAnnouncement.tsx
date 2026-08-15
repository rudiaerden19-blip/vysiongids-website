'use client'

import { useEffect, useState } from 'react'
import {
  clearVoiceSearchAnnouncement,
  readVoiceSearchAnnouncement,
  speakDutch,
} from '@/lib/speak-dutch'

/** Tekst + knop om resultaat te beluisteren (als TTS geblokkeerd was). */
export default function SearchResultsVoiceAnnouncement() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const stored = readVoiceSearchAnnouncement()
    if (stored?.trim()) setMessage(stored)
  }, [])

  if (!message) return null

  return (
    <div className="vysiongids-voice-result-banner" role="status">
      <p className="vysiongids-voice-result-banner-text">{message}</p>
      <button
        type="button"
        className="vysiongids-voice-result-banner-btn"
        onClick={() => {
          speakDutch(message)
          clearVoiceSearchAnnouncement()
          setMessage(null)
        }}
      >
        Beluister resultaat
      </button>
    </div>
  )
}
