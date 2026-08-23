'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '@/i18n/LanguageProvider'
import type { Listing } from '@/lib/listing-types'

type Props = {
  listing: Listing
  open: boolean
  onClose: () => void
}

export default function ListingClaimModal({ listing, open, onClose }: Props) {
  const { t } = useLanguage()
  const titleId = useId()
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [btwNumber, setBtwNumber] = useState('')
  const [message, setMessage] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [duplicate, setDuplicate] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, loading])

  useEffect(() => {
    if (!open) {
      setError(null)
      setLoading(false)
      setDone(false)
      setDuplicate(false)
      setConfirmationSent(false)
      setAuthorized(false)
    }
  }, [open])

  if (!open) return null

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/gids/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: listing.slug,
          contactName,
          contactEmail,
          contactPhone,
          btwNumber: btwNumber.trim(),
          message: message.trim() || undefined,
          authorized,
        }),
      })
      const data = (await res.json()) as {
        error?: string
        ok?: boolean
        duplicate?: boolean
        confirmationSent?: boolean
      }
      if (!res.ok) {
        setError(data.error ?? t('claim.submitFailed'))
        return
      }
      setDuplicate(Boolean(data.duplicate))
      setConfirmationSent(Boolean(data.confirmationSent))
      setDone(true)
    } catch {
      setError(t('errors.networkRetry'))
    } finally {
      setLoading(false)
    }
  }

  const panel = (
    <div className="vysiongids-job-modal-root vysiongids-claim-modal-root" role="presentation">
      <button
        type="button"
        className="vysiongids-job-modal-backdrop"
        aria-label={t('common.close')}
        onClick={() => !loading && onClose()}
      />
      <div
        className="vysiongids-job-modal-panel vysiongids-claim-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          className="vysiongids-job-modal-close"
          onClick={() => !loading && onClose()}
          aria-label={t('common.close')}
        >
          ×
        </button>

        {done ? (
          <div className="vysiongids-claim-modal-scroll">
            <p className="vysiongids-job-modal-kicker">{t('claim.kicker')}</p>
            <h2 id={titleId} className="vysiongids-job-modal-title">
              {duplicate ? t('claim.successTitleDuplicate') : t('claim.successTitle')}
            </h2>
            <p className="vysiongids-job-modal-text">
              {duplicate
                ? confirmationSent
                  ? t('claim.successBodyDuplicate')
                  : t('claim.successBodyDuplicateNoMail')
                : confirmationSent
                  ? t('claim.successBody')
                  : t('claim.successBodyNoMail')}
            </p>
            <button type="button" className="vysiongids-platform-promo-modal-cta mt-4" onClick={onClose}>
              {t('common.close')}
            </button>
          </div>
        ) : (
          <>
            <div className="vysiongids-claim-modal-scroll">
              <p className="vysiongids-job-modal-kicker">{t('claim.kicker')}</p>
              <h2 id={titleId} className="vysiongids-job-modal-title">
                {t('claim.title')}
              </h2>
              <p className="vysiongids-job-modal-text">{t('claim.lead', { listingName: listing.name })}</p>
              <p className="vysiongids-claim-modal-free-note">{t('claim.freeNote')}</p>
              <p className="vysiongids-job-modal-text">{t('claim.subscriptionNote')}</p>

              <form id="vysiongids-claim-form" onSubmit={onSubmit} className="vysiongids-claim-form">
                <div className="vysiongids-claim-form-fields space-y-3">
                  <div>
                <label className="vysiongids-form-label" htmlFor="claim-contact-name">
                  {t('claim.contactNameLabel')}
                  <span className="vysiongids-form-required" aria-hidden>
                    *
                  </span>
                </label>
                <input
                  id="claim-contact-name"
                  name="contactName"
                  required
                  maxLength={120}
                  className="vysiongids-form-input mt-1 w-full"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="vysiongids-form-label" htmlFor="claim-contact-email">
                  {t('claim.contactEmailLabel')}
                  <span className="vysiongids-form-required" aria-hidden>
                    *
                  </span>
                </label>
                <input
                  id="claim-contact-email"
                  name="contactEmail"
                  type="email"
                  required
                  maxLength={160}
                  className="vysiongids-form-input mt-1 w-full"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="vysiongids-form-label" htmlFor="claim-contact-phone">
                  {t('claim.contactPhoneLabel')}
                  <span className="vysiongids-form-required" aria-hidden>
                    *
                  </span>
                </label>
                <input
                  id="claim-contact-phone"
                  name="contactPhone"
                  type="tel"
                  required
                  maxLength={40}
                  className="vysiongids-form-input mt-1 w-full"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
              <div>
                <label className="vysiongids-form-label" htmlFor="claim-btw">
                  {t('claim.btwLabel')}
                  <span className="vysiongids-form-required" aria-hidden>
                    *
                  </span>
                </label>
                <input
                  id="claim-btw"
                  name="btwNumber"
                  required
                  minLength={8}
                  maxLength={32}
                  className="vysiongids-form-input mt-1 w-full"
                  value={btwNumber}
                  onChange={(e) => setBtwNumber(e.target.value)}
                  placeholder={t('claim.btwPlaceholder')}
                />
              </div>
              <div>
                <label className="vysiongids-form-label" htmlFor="claim-message">
                  {t('claim.messageLabel')}
                </label>
                <textarea
                  id="claim-message"
                  name="message"
                  rows={3}
                  maxLength={2000}
                  className="vysiongids-form-input mt-1 w-full resize-y"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('claim.messagePlaceholder')}
                />
              </div>
              <label className="vysiongids-claim-form-check flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={authorized}
                  onChange={(e) => setAuthorized(e.target.checked)}
                  required
                  form="vysiongids-claim-form"
                />
                <span>{t('claim.authorizedLabel')}</span>
              </label>
                </div>
              </form>
            </div>

            <div className="vysiongids-claim-modal-footer">
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                form="vysiongids-claim-form"
                disabled={loading || !authorized}
                className="vysiongids-platform-promo-modal-cta w-full disabled:opacity-60"
              >
                {loading ? t('common.busy') : t('claim.submit')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(panel, document.body)
}
