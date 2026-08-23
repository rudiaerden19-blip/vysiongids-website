'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GidsButtonLoadingContent } from '@/components/GidsLoadingSpinner'
import { useLanguage } from '@/i18n/LanguageProvider'

type Props = {
  businessName?: string
  /** Eerste login na claim met standaard-PIN */
  variant?: 'beheer' | 'firstLogin'
}

function pinInputProps(id: string, value: string, onChange: (v: string) => void) {
  return {
    id,
    required: true as const,
    inputMode: 'numeric' as const,
    pattern: '\\d{6}',
    maxLength: 6,
    autoComplete: 'off' as const,
    className:
      'mt-1 w-full max-w-sm rounded-lg border-2 border-gray-300 px-3 py-2.5 text-lg tracking-[0.35em] font-semibold focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30',
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(e.target.value.replace(/\D/g, '').slice(0, 6)),
  }
}

export default function BeheerChangePinPanel({ businessName, variant = 'beheer' }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const firstLogin = variant === 'firstLogin'
  const ready =
    currentPin.length === 6 && newPin.length === 6 && confirmPin.length === 6 && !loading

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      const res = await fetch('/api/gids/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ currentPin, newPin, confirmPin }),
      })
      const data = (await res.json()) as { error?: string; ok?: boolean }
      if (!res.ok) {
        setError(data.error ?? t('pinChange.submitFailed'))
        return
      }
      setSuccess(true)
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      router.refresh()
    } catch {
      setError(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      className="vysiongids-change-pin-panel rounded-xl border-2 border-accent bg-white p-6 shadow-md"
      aria-labelledby="change-pin-title"
    >
      <h2 id="change-pin-title" className="text-xl font-bold text-accent">
        {firstLogin ? t('pinChange.title') : t('pinChangePanel.title')}
      </h2>
      <p className="mt-2 text-sm text-gray-700">
        {firstLogin && businessName
          ? t('pinChange.lead', { name: businessName })
          : t('pinChangePanel.lead')}
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            {t('pinChangePanel.success')}
          </p>
        ) : null}

        <div>
          <label className="block text-sm font-bold text-gray-900" htmlFor="change-pin-current">
            {t('pinChangePanel.currentPinLabel')}
          </label>
          <input
            {...pinInputProps('change-pin-current', currentPin, setCurrentPin)}
            name="currentPin"
            placeholder="••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900" htmlFor="change-pin-new">
            {t('pinChangePanel.newPinLabel')}
          </label>
          <input {...pinInputProps('change-pin-new', newPin, setNewPin)} name="newPin" placeholder="••••••" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900" htmlFor="change-pin-confirm">
            {t('pinChangePanel.confirmPinLabel')}
          </label>
          <input
            {...pinInputProps('change-pin-confirm', confirmPin, setConfirmPin)}
            name="confirmPin"
            placeholder="••••••"
          />
        </div>
        <button
          type="submit"
          disabled={!ready}
          className="w-full max-w-sm rounded-xl bg-accent px-8 py-3.5 text-lg font-bold text-white hover:bg-accent/90 disabled:opacity-60 sm:w-auto"
        >
          {loading ? <GidsButtonLoadingContent label={t('pinChange.submitBusy')} /> : t('pinChange.submit')}
        </button>
      </form>
    </section>
  )
}
