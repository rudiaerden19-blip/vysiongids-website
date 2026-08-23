'use client'

import { useLanguage } from '@/i18n/LanguageProvider'
import { localeLabels, type Locale } from '@/i18n/config'

export default function HeaderLanguagePicker({ compact }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div className="vysiongids-lang-picker">
      {!compact ? <span className="vysiongids-lang-picker-label">{t('common.language')}</span> : null}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label={t('common.chooseLanguage')}
        className="vysiongids-lang-picker-select"
      >
        {(Object.keys(localeLabels) as Locale[]).map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </select>
    </div>
  )
}
