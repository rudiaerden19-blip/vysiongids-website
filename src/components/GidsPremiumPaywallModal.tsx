'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { GIDS_PREMIUM_YEARLY_EUR } from '@/lib/gids-premium'

type Props = {
  open: boolean
  onClose: () => void
  listingName?: string
}

type Prefill = {
  contactName?: string
  zaakName?: string
  phone?: string
  email?: string
  authenticated?: boolean
}

export default function GidsPremiumPaywallModal({ open, onClose, listingName }: Props) {
  const { t } = useLanguage()
  const titleId = useId()
  const [contactName, setContactName] = useState('')
  const [zaakName, setZaakName] = useState(listingName ?? '')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)

  useEffect(() => {
    setZaakName((prev) => listingName ?? prev)
  }, [listingName])

  useEffect(() => {
    if (!open) return
    setError(null)
    setNeedsLogin(false)
    void (async () => {
      try {
        const r = await fetch('/api/gids/me', { credentials: 'same-origin' })
        if (!r.ok) {
          setNeedsLogin(true)
          return
        }
        const data = (await r.json()) as {
          authenticated?: boolean
          name?: string
          listing?: { name?: string; phone?: string; email?: string }
        }
        if (!data.authenticated) {
          setNeedsLogin(true)
          return
        }
        const pre: Prefill = {
          authenticated: true,
          contactName: data.name,
          zaakName: data.listing?.name ?? data.name ?? listingName,
          phone: data.listing?.phone ?? '',
          email: data.listing?.email ?? '',
        }
        if (pre.contactName) setContactName(pre.contactName)
        if (pre.zaakName) setZaakName(pre.zaakName)
        if (pre.phone) setPhone(pre.phone)
        if (pre.email) setEmail(pre.email)
      } catch {
        setNeedsLogin(true)
      }
    })()
  }, [open, listingName])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  async function onPremiumNemen() {
    setError(null)
    setSubmitting(true)
    try {
      const r = await fetch('/api/gids/premium/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          contactName,
          zaakName,
          phone,
          email,
        }),
      })
      const data = (await r.json().catch(() => ({}))) as { error?: string; url?: string }
      if (r.status === 401) {
        setNeedsLogin(true)
        setError(data.error ?? 'Log eerst in via Login.')
        return
      }
      if (!r.ok || !data.url) {
        setError(data.error ?? 'Betaling starten mislukt.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Netwerkfout. Probeer opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const panel = (
    <div className="vysiongids-job-modal-root vysiongids-premium-modal-root" role="presentation">
      <button type="button" className="vysiongids-job-modal-backdrop" aria-label={t('common.close')} onClick={onClose} />
      <div
        className="vysiongids-job-modal-panel vysiongids-premium-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button type="button" className="vysiongids-job-modal-close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
        <div className="vysiongids-premium-modal-scroll">
          <p className="vysiongids-job-modal-kicker">{t('common.premium')}</p>
          <h2 id={titleId} className="vysiongids-job-modal-title">
            Vysiongids-lidmaatschap
          </h2>
          <p className="vysiongids-premium-modal-text">
            Je <strong>zaakkaart</strong> staat gratis in de gids. Alleen <strong>vacatures</strong> en{' '}
            <strong>zoekertjes</strong> vereisen premium: <strong>€{GIDS_PREMIUM_YEARLY_EUR} per jaar</strong> (Stripe).
          </p>

          {needsLogin ? (
            <p className="mt-3 text-sm text-amber-900">
              <a href="/login" className="font-semibold text-accent underline">
                Log in
              </a>{' '}
              met je zaak voordat je betaalt.
            </p>
          ) : null}

          <div className="vysiongids-premium-modal-form mt-4 space-y-3">
          <div>
            <label className="vysiongids-form-label text-sm" htmlFor="premiumContactName">
              Naam
            </label>
            <input
              id="premiumContactName"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="vysiongids-form-input mt-1 w-full text-sm"
              autoComplete="name"
              required
            />
          </div>
          <div>
            <label className="vysiongids-form-label text-sm" htmlFor="premiumZaakName">
              Zaak
            </label>
            <input
              id="premiumZaakName"
              type="text"
              value={zaakName}
              onChange={(e) => setZaakName(e.target.value)}
              className="vysiongids-form-input mt-1 w-full text-sm"
              required
            />
          </div>
          <div>
            <label className="vysiongids-form-label text-sm" htmlFor="premiumPhone">
              Telefoon
            </label>
            <input
              id="premiumPhone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="vysiongids-form-input mt-1 w-full text-sm"
              autoComplete="tel"
              required
            />
          </div>
          <div>
            <label className="vysiongids-form-label text-sm" htmlFor="premiumEmail">
              E-mail
            </label>
            <input
              id="premiumEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="vysiongids-form-input mt-1 w-full text-sm"
              autoComplete="email"
              required
            />
          </div>
        </div>

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="vysiongids-job-card-actions vysiongids-premium-modal-actions">
          <button
            type="button"
            disabled={submitting || needsLogin}
            className="vysiongids-job-card-btn vysiongids-job-card-btn--phone"
            onClick={() => void onPremiumNemen()}
          >
            {submitting ? t('modals.premiumPaywall.submitBusy') : t('modals.premiumPaywall.submit')}
          </button>
          <button type="button" className="vysiongids-job-card-btn vysiongids-job-card-btn--email" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(panel, document.body)
}
