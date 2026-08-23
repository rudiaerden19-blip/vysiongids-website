'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useState } from 'react'
import GidsAboutModal from '@/components/GidsAboutModal'
import GidsContactModal from '@/components/GidsContactModal'
import GidsPrivacyModal from '@/components/GidsPrivacyModal'
import { useLanguage } from '@/i18n/LanguageProvider'

const FOOTER_CITIES = [
  'Brussel',
  'Antwerpen',
  'Gent',
  'Brugge',
  'Leuven',
  'Hasselt',
  'Luik',
] as const

function cityHref(city: string) {
  return `/zoeken?q=${encodeURIComponent(city)}`
}

function SocialIcon({ label, href, children }: { label: string; href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="vysiongids-footer-social"
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

function FooterModalLink({ children, onOpen }: { children: ReactNode; onOpen: () => void }) {
  return (
    <button type="button" className="vysiongids-site-footer-contact-btn" onClick={onOpen}>
      {children}
    </button>
  )
}

export default function SiteFooter() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()
  const [contactOpen, setContactOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  return (
    <>
      <footer className="vysiongids-site-footer">
        <div className="vysiongids-site-footer-inner">
          <div className="vysiongids-site-footer-grid">
            <div className="vysiongids-site-footer-col">
              <h3 className="vysiongids-site-footer-heading">{t('footer.perCityHeading')}</h3>
              <ul className="vysiongids-site-footer-list">
                {FOOTER_CITIES.map((city) => (
                  <li key={city}>
                    <Link href={cityHref(city)}>{t('footer.horecaInCity', { city })}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="vysiongids-site-footer-col">
              <h3 className="vysiongids-site-footer-heading">{t('footer.vysiongidsHeading')}</h3>
              <ul className="vysiongids-site-footer-list">
                <li>
                  <FooterModalLink onOpen={() => setAboutOpen(true)}>{t('footer.aboutUs')}</FooterModalLink>
                </li>
                <li>
                  <FooterModalLink onOpen={() => setPrivacyOpen(true)}>{t('footer.privacyPolicy')}</FooterModalLink>
                </li>
                <li>
                  <FooterModalLink onOpen={() => setContactOpen(true)}>{t('footer.contact')}</FooterModalLink>
                </li>
              </ul>
            </div>

            <div className="vysiongids-site-footer-col vysiongids-site-footer-col--spaced">
              <ul className="vysiongids-site-footer-list vysiongids-site-footer-list--offset">
                <li>
                  <Link href="/zoeken">{t('footer.horecaPerCity')}</Link>
                </li>
                <li>
                  <Link href="/jobs">{t('footer.jobs')}</Link>
                </li>
                <li>
                  <Link href="/zoekertjes">{t('footer.zoekertjes')}</Link>
                </li>
              </ul>
            </div>

            <div className="vysiongids-site-footer-col">
              <h3 className="vysiongids-site-footer-heading">{t('footer.forHorecaHeading')}</h3>
              <ul className="vysiongids-site-footer-list">
                <li>
                  <Link href="/login">{t('footer.login')}</Link>
                </li>
                <li>
                  <FooterModalLink onOpen={() => setContactOpen(true)}>{t('footer.contact')}</FooterModalLink>
                </li>
                <li>
                  <Link href="/zaak-toevoegen">{t('footer.publicityOnVysiongids')}</Link>
                </li>
                <li>
                  <a href="https://www.vysionorder.com">{t('footer.websiteAndOrderPlatform')}</a>
                </li>
                <li>
                  <Link href="/zaak-toevoegen">{t('footer.addBusiness')}</Link>
                </li>
              </ul>
              <div className="vysiongids-site-footer-socials">
                <SocialIcon label={t('footer.socialFacebook')} href="https://www.facebook.com/">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M14 9h3V6h-3c-2.8 0-4.5 1.7-4.5 4.6V14H7v3h2.5v8h3.4v-8H16l.6-3h-3.1v-2.2c0-.9.3-1.4 1.4-1.4z" />
                  </svg>
                </SocialIcon>
                <SocialIcon label={t('footer.socialLinkedIn')} href="https://www.linkedin.com/">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M6.5 8.7H9v12H6.5v-12zM7.8 4.5a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2zM11 8.7h2.4v1.6h.1c.3-.6 1.2-1.7 2.5-1.7 2.7 0 3.2 1.8 3.2 4.1v7H16.4v-6.2c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3v6.3H11V8.7z" />
                  </svg>
                </SocialIcon>
                <SocialIcon label={t('footer.socialInstagram')} href="https://www.instagram.com/">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 3h8a5 5 0 015 5v8a5 5 0 01-5 5H8a5 5 0 01-5-5V8a5 5 0 015-5zm0 2a3 3 0 00-3 3v8a3 3 0 003 3h8a3 3 0 003-3V8a3 3 0 00-3-3H8zm4 3.5A4.5 4.5 0 1112 17a4.5 4.5 0 010-9zm0 2a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm5.1-2.4a1 1 0 110 2 1 1 0 010-2z" />
                  </svg>
                </SocialIcon>
              </div>
            </div>
          </div>

          <p className="vysiongids-site-footer-copy">
            {t('footer.copyright', { year: String(year) })}
          </p>
        </div>
      </footer>
      <GidsContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <GidsPrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <GidsAboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  )
}
