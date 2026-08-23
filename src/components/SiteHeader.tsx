'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import HeaderLanguagePicker from '@/components/HeaderLanguagePicker'
import VysionPlatformPromoModal, { type VysionPlatformPromoKind } from '@/components/VysionPlatformPromoModal'
import { useLanguage } from '@/i18n/LanguageProvider'
import { localizedCityLabel, localizedProvinceLabel } from '@/lib/geo-i18n'
import {
  BELGIUM_CITIES,
  BELGIUM_PROVINCES,
  DEFAULT_PROVINCE_SLUG,
  REGION_COOKIE,
  type ProvinceSlug,
} from '@/lib/belgium-locations'

const BACKDROP_STYLE: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 10000,
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'rgba(0, 0, 0, 0.4)',
  cursor: 'default',
}

const MOBILE_MENU_BACKDROP_STYLE: CSSProperties = {
  ...BACKDROP_STYLE,
  zIndex: 10050,
  background: 'rgba(15, 23, 42, 0.45)',
}

function readRegionCookie(): ProvinceSlug {
  const match = document.cookie.match(new RegExp(`(?:^|; )${REGION_COOKIE}=([^;]*)`))
  const raw = match?.[1]
  if (raw && BELGIUM_PROVINCES.some((p) => p.slug === raw)) return raw as ProvinceSlug
  return DEFAULT_PROVINCE_SLUG
}

function setRegionCookie(slug: ProvinceSlug) {
  document.cookie = `${REGION_COOKIE}=${slug};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}

function HeaderNavNewBadge({ variant = 'stacked' }: { variant?: 'stacked' | 'inline' }) {
  const { t } = useLanguage()
  return (
    <span
      className={`vysiongids-header-nav-new-badge${variant === 'inline' ? ' vysiongids-header-nav-new-badge--inline' : ''}`}
    >
      {t('common.newBadge')}
    </span>
  )
}

function HeaderNavLink({
  href,
  children,
  isNew,
  onNavigate,
}: {
  href: string
  children: ReactNode
  isNew?: boolean
  onNavigate?: () => void
}) {
  return (
    <Link
      href={href}
      className={isNew ? 'vysiongids-header-nav-link-new' : undefined}
      onClick={onNavigate}
    >
      {isNew ? <HeaderNavNewBadge variant="stacked" /> : null}
      <span className="vysiongids-header-nav-link-label">{children}</span>
    </Link>
  )
}

function HeaderNavLinks({
  onNavigate,
  className,
  onPlatformPromo,
}: {
  onNavigate?: () => void
  className?: string
  onPlatformPromo: (kind: VysionPlatformPromoKind) => void
}) {
  const { t } = useLanguage()
  return (
    <nav className={className ?? 'vysiongids-header-nav'} aria-label={t('header.mainNavAria')}>
      <Link href="/" onClick={onNavigate}>
        {t('header.navHome')}
      </Link>
      <HeaderNavLink href="/jobs" isNew onNavigate={onNavigate}>
        {t('header.navJobs')}
      </HeaderNavLink>
      <HeaderNavLink href="/zoekertjes" isNew onNavigate={onNavigate}>
        {t('header.navZoekertjes')}
      </HeaderNavLink>
      <button
        type="button"
        className="vysiongids-header-nav-platform"
        onClick={() => {
          onPlatformPromo('order')
          onNavigate?.()
        }}
      >
        {t('header.navOnlinePlatform')}
      </button>
      <button
        type="button"
        className="vysiongids-header-nav-platform"
        onClick={() => {
          onPlatformPromo('reservations')
          onNavigate?.()
        }}
      >
        {t('header.navReservations')}
      </button>
      <HeaderNavLink href="/diensten" isNew onNavigate={onNavigate}>
        {t('header.navDiensten')}
      </HeaderNavLink>
      <Link href="/login" onClick={onNavigate}>
        {t('header.navLogin')}
      </Link>
      <span className="vysiongids-header-nav-lang">
        <HeaderLanguagePicker compact />
      </span>
      <Link href="/zaak-toevoegen" className="vysiongids-header-nav-cta" onClick={onNavigate}>
        {t('header.navAddBusiness')}
      </Link>
    </nav>
  )
}

function MobileNavSheet({
  open,
  onClose,
  onPlatformPromo,
}: {
  open: boolean
  onClose: () => void
  onPlatformPromo: (kind: VysionPlatformPromoKind) => void
}) {
  const { t } = useLanguage()
  if (!open) return null

  const mobileNavLinks = [
    { href: '/', label: t('header.navHome') },
    { href: '/jobs', label: t('header.navJobs'), isNew: true as const },
    { href: '/zoekertjes', label: t('header.navZoekertjes'), isNew: true as const },
    { href: '/diensten', label: t('header.navDiensten'), isNew: true as const },
    { href: '/login', label: t('header.navLogin') },
  ]

  const openPlatform = (kind: VysionPlatformPromoKind) => {
    onClose()
    onPlatformPromo(kind)
  }

  return (
    <nav className="vysiongids-mobile-nav-sheet" aria-label={t('header.mobileNavAria')}>
      <div className="vysiongids-mobile-nav-sheet-head">
        <p className="vysiongids-mobile-nav-sheet-title">{t('header.mobileMenuTitle')}</p>
        <button type="button" className="vysiongids-mobile-nav-close" aria-label={t('header.mobileMenuClose')} onClick={onClose}>
          <span aria-hidden>×</span>
        </button>
      </div>
      <ul className="vysiongids-mobile-nav-list">
        {mobileNavLinks.slice(0, 3).map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="vysiongids-mobile-nav-link" onClick={onClose}>
              {item.label}
              {'isNew' in item && item.isNew ? <HeaderNavNewBadge variant="inline" /> : null}
            </Link>
          </li>
        ))}
        <li>
          <button type="button" className="vysiongids-mobile-nav-platform" onClick={() => openPlatform('order')}>
            {t('header.navOnlinePlatform')}
          </button>
        </li>
        <li>
          <button type="button" className="vysiongids-mobile-nav-platform" onClick={() => openPlatform('reservations')}>
            {t('header.navReservations')}
          </button>
        </li>
        {mobileNavLinks.slice(3).map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="vysiongids-mobile-nav-link" onClick={onClose}>
              {item.label}
              {'isNew' in item && item.isNew ? <HeaderNavNewBadge variant="inline" /> : null}
            </Link>
          </li>
        ))}
      </ul>
      <div className="vysiongids-mobile-nav-sheet-foot">
        <div className="vysiongids-mobile-nav-lang-row">
          <span className="vysiongids-mobile-nav-lang-label">{t('common.language')}</span>
          <HeaderLanguagePicker compact />
        </div>
        <Link href="/zaak-toevoegen" className="vysiongids-mobile-nav-cta" onClick={onClose}>
          {t('header.navAddBusiness')}
        </Link>
      </div>
    </nav>
  )
}

function SiteHeaderBar() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [platformPromo, setPlatformPromo] = useState<VysionPlatformPromoKind | null>(null)
  const [region, setRegion] = useState<ProvinceSlug>(DEFAULT_PROVINCE_SLUG)
  const [caretLeftPx, setCaretLeftPx] = useState(100)
  const [panelTopPx, setPanelTopPx] = useState(0)
  const [panelLeftPx, setPanelLeftPx] = useState(16)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const panelBoxRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    setRegion(readRegionCookie())
    const prov = searchParams.get('prov')
    if (prov && BELGIUM_PROVINCES.some((p) => p.slug === prov)) {
      const slug = prov as ProvinceSlug
      setRegion(slug)
      setRegionCookie(slug)
    }
  }, [searchParams])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  const close = useCallback(() => setOpen(false), [])
  const closeMobile = useCallback(() => setMobileMenuOpen(false), [])
  const closePlatformPromo = useCallback(() => setPlatformPromo(null), [])
  const openPlatformPromo = useCallback((kind: VysionPlatformPromoKind) => {
    setOpen(false)
    setMobileMenuOpen(false)
    setPlatformPromo(kind)
  }, [])

  const measurePanel = useCallback(() => {
    const header = headerRef.current
    const trigger = triggerRef.current
    const panel = panelBoxRef.current
    if (!header || !trigger) return

    const headerBottom = header.getBoundingClientRect().bottom
    setPanelTopPx(headerBottom)

    const panelWidth = panel?.offsetWidth ?? Math.min(672, window.innerWidth - 32)
    const triggerCenter = trigger.getBoundingClientRect().left + trigger.getBoundingClientRect().width / 2
    let left = triggerCenter - panelWidth / 2
    left = Math.max(16, Math.min(left, window.innerWidth - panelWidth - 16))
    setPanelLeftPx(left)

    if (panel) {
      const panelLeft = panel.getBoundingClientRect().left
      setCaretLeftPx(Math.round(triggerCenter - panelLeft - 8))
    }
  }, [])

  const openMenu = useCallback(() => {
    setMobileMenuOpen(false)
    measurePanel()
    setOpen(true)
  }, [measurePanel])

  useLayoutEffect(() => {
    if (!open) return
    measurePanel()
    window.addEventListener('resize', measurePanel)
    window.addEventListener('scroll', measurePanel, true)
    return () => {
      window.removeEventListener('resize', measurePanel)
      window.removeEventListener('scroll', measurePanel, true)
    }
  }, [open, measurePanel])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileMenuOpen, closeMobile])

  useEffect(() => {
    closeMobile()
  }, [pathname, closeMobile])

  const pickProvince = useCallback(
    (slug: ProvinceSlug) => {
      setRegion(slug)
      setRegionCookie(slug)
      setOpen(false)
      router.push(`/zoeken?prov=${slug}`)
    },
    [router],
  )

  const regionLabel = localizedProvinceLabel(region, t)
  const onZoekenWithRegion = pathname === '/zoeken' && searchParams.get('prov') === region
  const labelClass =
    'vysiongids-site-header-region-label text-accent text-base font-bold tracking-tight hover:text-accent/85 sm:text-lg'

  const panelStyle: CSSProperties = {
    position: 'fixed',
    top: panelTopPx,
    left: panelLeftPx,
    width: 'min(42rem, calc(100vw - 2rem))',
    zIndex: 10001,
    margin: 0,
    padding: 0,
  }

  const regionOverlay =
    open && mounted && panelTopPx > 0
      ? createPortal(
          <>
            <button type="button" style={BACKDROP_STYLE} aria-label={t('header.closeMenu')} onClick={close} />
            <div style={panelStyle} ref={panelBoxRef}>
              <div className="relative pt-2">
                <div
                  className="absolute -top-2 z-10 h-4 w-4 rotate-45 border-l border-t border-gray-200 bg-white"
                  style={{ left: caretLeftPx }}
                  aria-hidden
                />
                <div
                  className="relative max-h-[min(70vh,28rem)] overflow-y-auto rounded-sm border border-gray-200 bg-white text-gray-800 shadow-xl"
                  role="dialog"
                  aria-label={t('header.regionDialogAria')}
                >
                  <div className="p-4 sm:p-5">
                    <p className="text-sm leading-snug text-gray-600">{t('header.regionIntro')}</p>
                    <p className="mt-3 text-sm text-gray-700">
                      {t('header.regionHomepageLabel')} <span className="font-bold text-accent">{regionLabel}</span>
                      {onZoekenWithRegion ? (
                        <>
                          {' · '}
                          <Link
                            href="/"
                            className="font-semibold text-accent underline hover:no-underline"
                            onClick={close}
                          >
                            {t('header.toNationalHome')}
                          </Link>
                        </>
                      ) : (
                        <>
                          {' · '}
                          <Link
                            href={`/zoeken?prov=${region}`}
                            className="font-semibold text-accent underline hover:no-underline"
                            onClick={close}
                          >
                            {t('header.businessesInRegion', { regionLabel })}
                          </Link>
                        </>
                      )}
                    </p>
                    <div className="mt-4 grid gap-6 border-t border-gray-100 pt-4 sm:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{t('header.citiesHeading')}</h3>
                        <ul className="mt-2 columns-2 gap-x-4 text-sm">
                          {BELGIUM_CITIES.map((city) => (
                            <li key={city.q} className="mb-1.5 break-inside-avoid">
                              <Link
                                href={`/zoeken?q=${encodeURIComponent(city.q)}`}
                                className="text-gray-800 hover:text-accent hover:underline"
                                onClick={close}
                              >
                                {localizedCityLabel(city.q, t)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="sm:border-l sm:border-gray-100 sm:pl-6">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{t('header.provincesHeading')}</h3>
                        <ul className="mt-2 space-y-1 text-sm">
                          {BELGIUM_PROVINCES.map((prov) => (
                            <li key={prov.slug}>
                              <button
                                type="button"
                                className={
                                  prov.slug === region
                                    ? 'font-bold text-accent hover:underline'
                                    : 'text-gray-800 hover:text-accent hover:underline'
                                }
                                onClick={() => pickProvince(prov.slug)}
                              >
                                {localizedProvinceLabel(prov.slug, t)}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <>
      <header ref={headerRef} className="vysiongids-site-header relative shrink-0 border-b border-gray-200 bg-white">
        <div className="vysiongids-site-header-inner">
          <div className="vysiongids-site-header-brand">
            <Link href="/" className="vysiongids-site-logo">
              {t('header.logo')}
            </Link>
            <span className="vysiongids-site-header-sep" aria-hidden>
              {t('common.breadcrumbSeparator')}
            </span>
            <div ref={triggerRef} className="vysiongids-site-header-region">
              <Link href={`/zoeken?prov=${region}`} className={labelClass}>
                {regionLabel}
              </Link>
              <button
                type="button"
                className="vysiongids-region-toggle"
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-label={t('header.regionToggleAria', { regionLabel })}
                onClick={() => (open ? close() : openMenu())}
              >
                <span className={`vysiongids-region-caret ${open ? 'is-open' : ''}`} aria-hidden>
                  ▼
                </span>
              </button>
            </div>
          </div>

          <HeaderNavLinks
            className="vysiongids-header-nav vysiongids-header-nav--desktop"
            onPlatformPromo={openPlatformPromo}
          />

          <button
            type="button"
            className={`vysiongids-mobile-menu-btn${mobileMenuOpen ? ' is-open' : ''}`}
            aria-expanded={mobileMenuOpen}
            aria-controls="vysiongids-mobile-nav"
            aria-label={mobileMenuOpen ? t('header.mobileMenuClose') : t('header.mobileMenuOpen')}
            onClick={() => {
              setMobileMenuOpen((v) => {
                const next = !v
                if (next) setOpen(false)
                return next
              })
            }}
          >
            <span className="vysiongids-mobile-menu-icon" aria-hidden />
          </button>
        </div>
      </header>
      {mobileMenuOpen && mounted
        ? createPortal(
            <>
              <button
                type="button"
                style={MOBILE_MENU_BACKDROP_STYLE}
                aria-label={t('header.closeMenu')}
                onClick={closeMobile}
              />
              <div id="vysiongids-mobile-nav" role="dialog" aria-modal="true" aria-label={t('header.mobileNavAria')}>
                <MobileNavSheet open={mobileMenuOpen} onClose={closeMobile} onPlatformPromo={openPlatformPromo} />
              </div>
            </>,
            document.body,
          )
        : null}
      <VysionPlatformPromoModal
        kind={platformPromo}
        open={platformPromo !== null}
        onClose={closePlatformPromo}
      />
      {regionOverlay}
    </>
  )
}

function SiteHeaderFallback() {
  const { t } = useLanguage()
  return (
    <header className="vysiongids-site-header relative shrink-0 border-b border-gray-200 bg-white">
      <div className="vysiongids-site-header-inner">
        <Link href="/" className="vysiongids-site-logo">
          {t('header.logo')}
        </Link>
      </div>
    </header>
  )
}

export default function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderFallback />}>
      <SiteHeaderBar />
    </Suspense>
  )
}
