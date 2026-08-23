'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import VysionPlatformPromoModal, { type VysionPlatformPromoKind } from '@/components/VysionPlatformPromoModal'
import { GIDS_HORECA_YEARLY_EUR } from '@/lib/gids-premium'
import { GIDS_DIENSTEN_YEARLY_EUR } from '@/lib/gids-diensten-pricing'

type Props = {
  children: React.ReactNode
}

const INTRO_RULE_KEYS = [
  'correctData',
  'pin',
  'photos',
  'orderLink',
  'reviews',
  'delete',
  'zoekertjes',
  'jobs',
  'security',
] as const

export default function ZaakToevoegenIntroGate({ children }: Props) {
  const { t } = useLanguage()
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [platformPromo, setPlatformPromo] = useState<VysionPlatformPromoKind | null>(null)

  const introVars = {
    addBusinessBtn: t('meta.pages.zaakToevoegen'),
    horecaYearlyEur: GIDS_HORECA_YEARLY_EUR,
    navDiensten: t('header.navDiensten'),
    dienstenYearlyEur: GIDS_DIENSTEN_YEARLY_EUR,
  }

  const continueToForm = useCallback(() => setOpen(false), [])

  const dismiss = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push('/')
  }, [router])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, dismiss])

  if (!open) {
    return <>{children}</>
  }

  return (
    <>
      <div className="vysiongids-zaak-intro-backdrop" aria-hidden onClick={dismiss} />
      <div
        className="vysiongids-zaak-intro-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zaak-intro-title"
      >
        <div className="vysiongids-zaak-intro-head">
          <h2 id="zaak-intro-title" className="vysiongids-zaak-intro-title">
            {t('forms.zaakToevoegen.introGateTitle')}
          </h2>
          <button
            type="button"
            className="vysiongids-zaak-intro-close"
            onClick={dismiss}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        <div className="vysiongids-zaak-intro-body">
          <p className="vysiongids-zaak-intro-promo">{t('forms.zaakToevoegen.introGatePromo1', introVars)}</p>
          <p className="vysiongids-zaak-intro-promo">{t('forms.zaakToevoegen.introGatePromo2')}</p>
          <div className="vysiongids-zaak-intro-platform-btns">
            <button
              type="button"
              className="vysiongids-zaak-intro-platform-btn"
              onClick={() => setPlatformPromo('order')}
            >
              {t('forms.zaakToevoegen.introGatePlatformOrder')}
            </button>
            <button
              type="button"
              className="vysiongids-zaak-intro-platform-btn"
              onClick={() => setPlatformPromo('reservations')}
            >
              {t('forms.zaakToevoegen.introGatePlatformReservations')}
            </button>
          </div>
          <p className="vysiongids-zaak-intro-promo">{t('forms.zaakToevoegen.introGatePromo3')}</p>
          <div className="vysiongids-zaak-intro-promo">
            <h3 className="vysiongids-zaak-intro-promo-title">{t('forms.zaakToevoegen.introGateWhatIsTitle')}</h3>
            <p className="vysiongids-zaak-intro-promo-text">
              {t('forms.zaakToevoegen.introGateWhatIsP1', introVars)}
            </p>
            <p className="vysiongids-zaak-intro-promo-text">
              {t('forms.zaakToevoegen.introGateWhatIsP2', introVars)}
            </p>
          </div>
          <div className="vysiongids-zaak-intro-promo">
            <h3 className="vysiongids-zaak-intro-promo-title">{t('forms.zaakToevoegen.introGateHowFindTitle')}</h3>
            <p className="vysiongids-zaak-intro-promo-text">{t('forms.zaakToevoegen.introGateHowFindP1')}</p>
            <p className="vysiongids-zaak-intro-promo-text">{t('forms.zaakToevoegen.introGateHowFindP2')}</p>
          </div>
          <p className="vysiongids-zaak-intro-lead">{t('forms.zaakToevoegen.introGateRulesLead')}</p>
          <ul>
            {INTRO_RULE_KEYS.map((key) => (
              <li key={key}>{t(`forms.zaakToevoegen.introGateRules.${key}`)}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-600">{t('forms.zaakToevoegen.introGateConfirm')}</p>
        </div>
        <div className="vysiongids-zaak-intro-actions">
          <button type="button" className="vysiongids-zaak-intro-btn-primary" onClick={continueToForm}>
            {t('forms.zaakToevoegen.introGateContinue')}
          </button>
          <button type="button" className="vysiongids-zaak-intro-btn-secondary" onClick={dismiss}>
            {t('common.close')}
          </button>
        </div>
      </div>
      <VysionPlatformPromoModal
        kind={platformPromo}
        open={platformPromo !== null}
        onClose={() => setPlatformPromo(null)}
      />
    </>
  )
}
