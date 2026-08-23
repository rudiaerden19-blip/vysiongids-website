'use client'

import { useLanguage } from '@/i18n/LanguageProvider'

export default function HomeHeroHeadlines() {
  const { t } = useLanguage()
  return (
    <>
      <h1
        className="vysiongids-hero-title-bar"
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          padding: 0,
          background: 'transparent',
          color: '#0e5d82',
          fontSize: 'clamp(2.75rem, 8vw, 4.75rem)',
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          margin: 0,
          textShadow: '0 1px 8px rgba(255,255,255,0.85), 0 0 2px rgba(255,255,255,0.9)',
        }}
      >
        {t('home.heroTitle')}
      </h1>
      <p
        style={{
          marginTop: '1.25rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          marginBottom: 0,
          maxWidth: '56rem',
          fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
          fontWeight: 500,
          color: '#ffffff',
          textShadow: '0 1px 10px rgba(0,0,0,0.85)',
        }}
      >
        {t('home.heroLead')}
      </p>
    </>
  )
}
