'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useCallback, type CSSProperties } from 'react'
import { LISTING_TYPES } from '@/lib/listing-types'

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
}

export default function SearchForm({ compact }: { compact?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? 'all'
  const prov = searchParams.get('prov') ?? ''

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const nextQ = String(fd.get('q') ?? '').trim()
      const nextType = String(fd.get('type') ?? 'all')
      const params = new URLSearchParams()
      if (nextQ) params.set('q', nextQ)
      if (nextType && nextType !== 'all') params.set('type', nextType)
      if (prov.trim()) params.set('prov', prov.trim())
      const qs = params.toString()
      router.push(qs ? `/zoeken?${qs}` : '/zoeken')
    },
    [router, prov],
  )

  if (!compact) {
    return (
      <form onSubmit={onSubmit} className="vysiongids-hero-search" style={heroFormStyle}>
        <div className="vysiongids-hero-search-grow" style={heroGrowStyle}>
          <label htmlFor="search-q" style={heroFieldLabel}>
            Stad, postcode of naam
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Bv. Pelt, Belgische keuken, glutenvrij, parking"
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
        <button type="submit" className="vysiongids-hero-search-submit" style={heroSubmitStyle}>
          Zoeken
        </button>
      </form>
    )
  }

  return (
    <form
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
          id="search-q-compact"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Bv. Pelt, Belgische keuken, glutenvrij, parking"
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
      <button type="submit" style={{ ...heroSubmitStyle, alignSelf: 'stretch', width: '100%' }}>
        Zoeken
      </button>
    </form>
  )
}
