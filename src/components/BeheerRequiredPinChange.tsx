'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GidsButtonLoadingContent } from '@/components/GidsLoadingSpinner'
import { useLanguage } from '@/i18n/LanguageProvider'

type Props = {
  businessName: string
}

export default function BeheerRequiredPinChange({ businessName }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/gids/required-pin-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ newPin, confirmPin }),
      })
      const data = (await res.json()) as { error?: string; ok?: boolean }
      if (!res.ok) {
        setError(data.error ?? t('pinChange.submitFailed'))
        return
      }
      router.refresh()
    } catch {
      setError(t('errors.network'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="vysiongids-surface-card rounded-xl border border-sky-200 bg-sky-50/90 p-6">
      <h2 className="text-lg font-bold text-gray-900">{t('pinChange.title')}</h2>
      <p className="mt-2 text-sm text-gray-700">{t('pinChange.lead', { name: businessName })}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}
        <div>
          <label className="block text-sm font-semibold text-gray-700" htmlFor="new-pin-required">
            {t('pinChange.newPinLabel')}
          </label>
          <input
            id="new-pin-required"
            name="newPin"
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="off"
            className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 tracking-widest"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700" htmlFor="confirm-pin-required">
            {t('pinChange.confirmPinLabel')}
          </label>
          <input
            id="confirm-pin-required"
            name="confirmPin"
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="off"
            className="mt-1 w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 tracking-widest"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </div>
        <button
          type="submit"
          disabled={loading || newPin.length !== 6 || confirmPin.length !== 6}
          className="rounded-xl bg-accent px-8 py-3 font-bold text-white hover:bg-accent/90 disabled:opacity-60"
        >
          {loading ? <GidsButtonLoadingContent label={t('pinChange.submitBusy')} /> : t('pinChange.submit')}
        </button>
      </form>
    </div>
  )
}
