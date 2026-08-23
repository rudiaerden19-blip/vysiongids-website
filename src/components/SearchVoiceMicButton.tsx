'use client'

import { useLanguage } from '@/i18n/LanguageProvider'

type Props = {
  listening: boolean
  supported: boolean
  onClick: () => void
  className?: string
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 11a7 7 0 0 1-14 0M12 18v3M8 21h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function SearchVoiceMicButton({ listening, supported, onClick, className }: Props) {
  const { t } = useLanguage()
  const title = supported
    ? listening
      ? t('search.voiceListening')
      : t('search.voiceSpeak')
    : t('search.voiceSpeak')

  return (
    <button
      type="button"
      className={`vysiongids-hero-search-voice${listening ? ' vysiongids-hero-search-voice--listening' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={!supported || listening}
      title={title}
      aria-label={title}
      aria-pressed={listening}
    >
      <MicIcon />
      <span className="vysiongids-hero-search-voice-label">
        {listening ? t('search.voiceListening') : t('search.voiceSpeak')}
      </span>
    </button>
  )
}
