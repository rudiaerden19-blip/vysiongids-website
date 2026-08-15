'use client'

import { useEffect, useState } from 'react'

const LOCALES = [
  { code: 'nl', label: 'NL' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
] as const

const COOKIE = 'vysiongids_locale'

function readLocale(): string {
  if (typeof document === 'undefined') return 'nl'
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`))
  return m?.[1] || 'nl'
}

export default function HeaderLanguagePicker({ compact }: { compact?: boolean }) {
  const [locale, setLocale] = useState('nl')

  useEffect(() => setLocale(readLocale()), [])

  return (
    <div className="vysiongids-lang-picker">
      {!compact ? (
        <span className="vysiongids-lang-picker-label">Taal</span>
      ) : null}
      <select
        value={locale}
        onChange={(e) => {
          const next = e.target.value
          setLocale(next)
          document.cookie = `${COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
        }}
        aria-label="Taal kiezen"
        className="vysiongids-lang-picker-select"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
