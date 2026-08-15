/** Browser text-to-speech (nl-BE), o.a. na spraakzoeken. */
export function speakDutch(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const trimmed = text.trim()
  if (!trimmed) return

  window.speechSynthesis.cancel()

  const utter = new SpeechSynthesisUtterance(trimmed)
  utter.lang = 'nl-BE'
  utter.rate = 0.92
  utter.pitch = 1

  const pickVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices()
    return (
      voices.find((v) => v.lang === 'nl-BE') ??
      voices.find((v) => v.lang.startsWith('nl')) ??
      null
    )
  }

  const voice = pickVoice()
  if (voice) utter.voice = voice

  const speak = () => {
    const v = pickVoice()
    if (v) utter.voice = v
    window.speechSynthesis.speak(utter)
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    speak()
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', speak, { once: true })
  }
}
