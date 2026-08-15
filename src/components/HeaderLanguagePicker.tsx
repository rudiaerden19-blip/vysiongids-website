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

export default function HeaderLanguagePicker() {
  const [locale, setLocale] = useState('nl')

  useEffect(() => setLocale(readLocale()), [])

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
      }}
    >
      <span
        style={{
          fontSize: '1rem',
          fontWeight: 500,
          color: '#4b5563',
          whiteSpace: 'nowrap',
        }}
      >
        Taal
      </span>
      <select
        value={locale}
        onChange={(e) => {
          const next = e.target.value
          setLocale(next)
          document.cookie = `${COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
        }}
        aria-label="Taal kiezen"
        style={{
          cursor: 'pointer',
          borderRadius: '0.375rem',
          border: '1px solid #d1d5db',
          background: '#fff',
          padding: '0.5rem 0.75rem',
          fontSize: '1rem',
          fontWeight: 500,
          color: '#374151',
        }}
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
