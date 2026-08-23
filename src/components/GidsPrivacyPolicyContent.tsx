'use client'

import { GIDS_CONTACT } from '@/lib/gids-contact'
import { useLanguage } from '@/i18n/LanguageProvider'

export default function GidsPrivacyPolicyContent() {
  const { t, tList } = useLanguage()
  const section2Items = tList('modals.privacy.section2Items')
  const section3Items = tList('modals.privacy.section3Items')

  return (
    <div className="vysiongids-privacy-policy-content">
      <p className="vysiongids-privacy-policy-lead">{t('modals.privacy.lead')}</p>

      <section>
        <h3>{t('modals.privacy.section1Title')}</h3>
        <p>
          Vysion — {GIDS_CONTACT.street}, {GIDS_CONTACT.cityLine}
          <br />
          {t('common.email')}:{' '}
          <a href={`mailto:${GIDS_CONTACT.email}`} className="vysiongids-privacy-policy-link">
            {GIDS_CONTACT.email}
          </a>
          <br />
          {t('common.phone')}:{' '}
          <a href={`tel:${GIDS_CONTACT.phoneTel}`} className="vysiongids-privacy-policy-link">
            {GIDS_CONTACT.phoneDisplay}
          </a>
        </p>
      </section>

      <section>
        <h3>{t('modals.privacy.section2Title')}</h3>
        <ul>
          {section2Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>{t('modals.privacy.section3Title')}</h3>
        <ul>
          {section3Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>{t('modals.privacy.section4Title')}</h3>
        <p>{t('modals.privacy.section4Body')}</p>
      </section>

      <section>
        <h3>{t('modals.privacy.section5Title')}</h3>
        <p>{t('modals.privacy.section5Body')}</p>
      </section>

      <section>
        <h3>{t('modals.privacy.section6Title')}</h3>
        <p>{t('modals.privacy.section6Body1')}</p>
        <p>
          {t('modals.privacy.section6Body2', { email: GIDS_CONTACT.email })}
        </p>
      </section>

      <section>
        <h3>{t('modals.privacy.section7Title')}</h3>
        <p>{t('modals.privacy.section7Body')}</p>
      </section>

      <section>
        <h3>{t('modals.privacy.section8Title')}</h3>
        <p>{t('modals.privacy.section8Body')}</p>
        <p className="vysiongids-privacy-policy-updated">{t('modals.privacy.lastUpdated')}</p>
      </section>
    </div>
  )
}
