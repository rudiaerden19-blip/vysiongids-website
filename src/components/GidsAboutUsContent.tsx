'use client'

import { GIDS_CONTACT } from '@/lib/gids-contact'
import { useLanguage } from '@/i18n/LanguageProvider'

export default function GidsAboutUsContent() {
  const { t } = useLanguage()
  return (
    <div className="vysiongids-privacy-policy-content">
      <p className="vysiongids-privacy-policy-lead">{t('modals.about.lead')}</p>

      <section>
        <h3>{t('modals.about.whatWeDoTitle')}</h3>
        <p>{t('modals.about.whatWeDoBody')}</p>
      </section>

      <section>
        <h3>{t('modals.about.forVisitorsTitle')}</h3>
        <p>{t('modals.about.forVisitorsBody')}</p>
      </section>

      <section>
        <h3>{t('modals.about.forHorecaTitle')}</h3>
        <p>{t('modals.about.forHorecaBody')}</p>
      </section>

      <section>
        <h3>{t('modals.about.vysionTitle')}</h3>
        <p>
          {t('modals.about.vysionBody', {
            street: GIDS_CONTACT.street,
            cityLine: GIDS_CONTACT.cityLine,
            email: GIDS_CONTACT.email,
          })}
        </p>
      </section>
    </div>
  )
}
