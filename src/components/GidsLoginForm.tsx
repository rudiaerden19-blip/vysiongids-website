'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GidsButtonLoadingContent } from '@/components/GidsLoadingSpinner'
import GidsInternalNavLink from '@/components/GidsInternalNavLink'
import GidsPageLoadingOverlay from '@/components/GidsPageLoadingOverlay'
import TitleCaseTextInput from '@/components/TitleCaseTextInput'
import { useLanguage } from '@/i18n/LanguageProvider'
import { useGidsBusyUntilNav } from '@/hooks/use-gids-busy-until-nav'
import { storeGidsBeheerLoginHint } from '@/lib/gids-beheer-login-hint'

export default function GidsLoginForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')?.trim()
  const [error, setError] = useState<string | null>(null)
  const { busy, startBusy, stopBusy } = useGidsBusyUntilNav()

  useEffect(() => {
    router.prefetch('/beheer')
  }, [router])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    startBusy()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') ?? '').trim()
    const pin = String(fd.get('pin') ?? '').trim()
    try {
      const res = await fetch('/api/gids/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, pin }),
      })
      const data = (await res.json()) as { error?: string; slug?: string; name?: string }
      if (!res.ok) {
        setError(data.error ?? t('errors.loginFailed'))
        stopBusy()
        return
      }
      if (data.slug && data.name) {
        storeGidsBeheerLoginHint(data.slug, data.name)
      }
      const dest =
        returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/beheer'
      window.location.assign(dest)
    } catch {
      setError(t('errors.network'))
      stopBusy()
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-4">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}
        <div>
          <label className="block text-sm font-semibold text-gray-700" htmlFor="name">
            {t('login.formNameLabel')}
          </label>
          <TitleCaseTextInput
            id="name"
            name="name"
            required
            autoComplete="organization"
            disabled={busy}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-60"
            placeholder={t('login.formNamePlaceholder')}
          />
          <p className="mt-1 text-xs text-gray-500">{t('login.formNameHint')}</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700" htmlFor="pin">
            {t('login.formPinLabel')}
          </label>
          <input
            id="pin"
            name="pin"
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            disabled={busy}
            className="vysiongids-change-pin-input disabled:opacity-60"
            size={6}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full max-w-full rounded-xl bg-accent px-6 py-3 font-bold text-white hover:bg-accent/90 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {busy ? <GidsButtonLoadingContent label={t('login.formSubmitBusy')} /> : t('login.formSubmit')}
        </button>
        <p className="text-sm text-gray-600">
          {t('login.claimHint')}{' '}
          <GidsInternalNavLink href="/zoeken" className="font-semibold text-accent hover:underline">
            {t('common.search')}
          </GidsInternalNavLink>
        </p>
        <p className="text-sm text-gray-600">
          {t('login.noAccount')}{' '}
          <GidsInternalNavLink
            href="/zaak-toevoegen"
            className="font-semibold text-accent hover:underline disabled:opacity-60"
            loadingMessage={t('login.addBusinessLoading')}
          >
            {t('login.addBusinessLink')}
          </GidsInternalNavLink>
        </p>
      </form>
      <GidsPageLoadingOverlay open={busy} message={t('login.overlayBusy')} />
    </>
  )
}
