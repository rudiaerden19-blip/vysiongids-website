const VOICE_MESSAGE_KEY = 'vysiongids_voice_message'
const VOICE_FROM_KEY = 'vysiongids_from_voice'

export function stashVoiceSearchAnnouncement(message: string): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(VOICE_MESSAGE_KEY, message)
  sessionStorage.setItem(VOICE_FROM_KEY, '1')
}

export function readVoiceSearchAnnouncement(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  if (sessionStorage.getItem(VOICE_FROM_KEY) !== '1') return null
  return sessionStorage.getItem(VOICE_MESSAGE_KEY)
}

export function clearVoiceSearchAnnouncement(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(VOICE_MESSAGE_KEY)
  sessionStorage.removeItem(VOICE_FROM_KEY)
}

/** Browsers blokkeren TTS zonder recente tik — kort «ontgrendelen» bij microfoon. */
export function primeSpeechSynthesis(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance('Oké')
  utter.lang = 'nl-BE'
  utter.volume = 0.04
  utter.rate = 1.8
  window.speechSynthesis.speak(utter)
}

function pickDutchVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang === 'nl-BE') ??
    voices.find((v) => v.lang.startsWith('nl')) ??
    null
  )
}

/** Browser text-to-speech (nl-BE), o.a. na spraakzoeken. */
export function speakDutch(text: string): void {
  void speakDutchAsync(text)
}

export function speakDutchAsync(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve()
      return
    }
    const trimmed = text.trim()
    if (!trimmed) {
      resolve()
      return
    }

    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(trimmed)
    utter.lang = 'nl-BE'
    utter.rate = 0.92
    utter.pitch = 1
    utter.volume = 1

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }

    utter.onend = finish
    utter.onerror = finish

    const timeout = window.setTimeout(finish, 20000)

    const speak = () => {
      const voice = pickDutchVoice()
      if (voice) utter.voice = voice
      window.speechSynthesis.speak(utter)
    }

    utter.onend = () => {
      window.clearTimeout(timeout)
      finish()
    }
    utter.onerror = () => {
      window.clearTimeout(timeout)
      finish()
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      speak()
    } else {
      window.speechSynthesis.addEventListener(
        'voiceschanged',
        () => {
          speak()
        },
        { once: true },
      )
      window.setTimeout(speak, 250)
    }
  })
}
