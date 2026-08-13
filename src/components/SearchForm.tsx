'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useCallback } from 'react'
import { LISTING_TYPES } from '@/lib/listing-types'

export default function SearchForm({ compact }: { compact?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? 'all'

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const nextQ = String(fd.get('q') ?? '').trim()
      const nextType = String(fd.get('type') ?? 'all')
      const params = new URLSearchParams()
      if (nextQ) params.set('q', nextQ)
      if (nextType && nextType !== 'all') params.set('type', nextType)
      const qs = params.toString()
      router.push(qs ? `/zoeken?${qs}` : '/zoeken')
    },
    [router],
  )

  return (
    <form
      onSubmit={onSubmit}
      className={
        compact
          ? 'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end'
          : 'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5'
      }
    >
      <div className={compact ? 'min-w-0 flex-1 sm:min-w-[14rem]' : 'mb-3 sm:mb-4'}>
        <label htmlFor="search-q" className="mb-1 block text-sm font-semibold text-gray-700">
          Stad, postcode of naam
        </label>
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Bv. Pelt, 3900, frituur…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none ring-accent focus:border-accent focus:ring-2"
          autoComplete="off"
        />
      </div>
      <div className={compact ? 'w-full sm:w-44' : 'mb-4'}>
        <label htmlFor="search-type" className="mb-1 block text-sm font-semibold text-gray-700">
          Type zaak
        </label>
        <select
          id="search-type"
          name="type"
          defaultValue={type}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none ring-accent focus:border-accent focus:ring-2"
        >
          {LISTING_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-accent px-6 py-2.5 text-base font-semibold text-white transition hover:bg-accent/90 sm:shrink-0"
      >
        Zoeken
      </button>
    </form>
  )
}
