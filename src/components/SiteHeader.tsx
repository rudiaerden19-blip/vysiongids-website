'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import HeaderLanguagePicker from '@/components/HeaderLanguagePicker'
import {
  BELGIUM_CITIES,
  BELGIUM_PROVINCES,
  DEFAULT_PROVINCE_SLUG,
  REGION_COOKIE,
  provinceLabel,
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

function readRegionCookie(): ProvinceSlug {
  const match = document.cookie.match(new RegExp(`(?:^|; )${REGION_COOKIE}=([^;]*)`))
  const raw = match?.[1]
  if (raw && BELGIUM_PROVINCES.some((p) => p.slug === raw)) return raw as ProvinceSlug
  return DEFAULT_PROVINCE_SLUG
}

function setRegionCookie(slug: ProvinceSlug) {
  document.cookie = `${REGION_COOKIE}=${slug};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}

function SiteHeaderBar() {
  const [open, setOpen] = useState(false)
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

  const close = useCallback(() => setOpen(false), [])

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

  const pickProvince = useCallback(
    (slug: ProvinceSlug) => {
      setRegion(slug)
      setRegionCookie(slug)
      setOpen(false)
      router.push(`/zoeken?prov=${slug}`)
    },
    [router],
  )

  const regionLabel = provinceLabel(region)
  const onZoekenWithRegion = pathname === '/zoeken' && searchParams.get('prov') === region
  const labelClass = 'text-accent text-base font-bold tracking-tight hover:text-accent/85 sm:text-lg'

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
            <button type="button" style={BACKDROP_STYLE} aria-label="Sluit menu" onClick={close} />
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
                  aria-label="Kies stad of provincie"
                >
                  <div className="p-4 sm:p-5">
                    <p className="text-sm leading-snug text-gray-600">
                      Alle zaken in België: foto, info, beoordelingen en bestellen bij de zaak zelf.
                    </p>
                    <p className="mt-3 text-sm text-gray-700">
                      Uw homepagina: <span className="font-bold text-accent">{regionLabel}</span>
                      {onZoekenWithRegion ? (
                        <>
                          {' · '}
                          <Link
                            href="/"
                            className="font-semibold text-accent underline hover:no-underline"
                            onClick={close}
                          >
                            naar nationale homepagina
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
                            zaken in {regionLabel}
                          </Link>
                        </>
                      )}
                    </p>
                    <div className="mt-4 grid gap-6 border-t border-gray-100 pt-4 sm:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Steden</h3>
                        <ul className="mt-2 columns-2 gap-x-4 text-sm">
                          {BELGIUM_CITIES.map((city) => (
                            <li key={city.q} className="mb-1.5 break-inside-avoid">
                              <Link
                                href={`/zoeken?q=${encodeURIComponent(city.q)}`}
                                className="text-gray-800 hover:text-accent hover:underline"
                                onClick={close}
                              >
                                {city.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="sm:border-l sm:border-gray-100 sm:pl-6">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">Provincies</h3>
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
                                {prov.label}
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
      <header
        ref={headerRef}
        className="relative shrink-0 border-b border-gray-200 bg-white"
        style={{ zIndex: 10002 }}
      >
        <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-6 px-4 py-4 sm:px-8 sm:py-5 lg:px-10">
          <div className="flex min-w-0 flex-wrap items-center gap-y-2">
            <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-accent sm:text-2xl">
              Vysiongids
            </Link>
            <span className="mx-2 text-gray-300 sm:mx-3" aria-hidden>
              |
            </span>
            <div ref={triggerRef} className="ml-[1cm] inline-flex items-center gap-0.5 sm:gap-1">
              <Link href={`/zoeken?prov=${region}`} className={labelClass}>
                {regionLabel}
              </Link>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-accent hover:bg-accent/5"
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-label={`${regionLabel}: kies stad of provincie`}
                onClick={() => (open ? close() : openMenu())}
              >
                <span
                  className={`inline-block text-[0.6rem] leading-none transition-transform ${open ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
            </div>
          </div>
          <nav
            className="vysiongids-header-nav shrink-0"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <Link href="/sterrenzaken" style={{ padding: '0.35rem 1.15rem' }}>
              Sterrenzaken
            </Link>
            <Link href="/cadeaubonnen" style={{ padding: '0.35rem 1.15rem' }}>
              Cadeaubonnen
            </Link>
            <Link href="/login" style={{ padding: '0.35rem 1.15rem' }}>
              Login
            </Link>
            <span style={{ display: 'inline-flex', padding: '0.35rem 0.75rem 0.35rem 1rem' }}>
              <HeaderLanguagePicker />
            </span>
            <Link
              href="/zaak-toevoegen"
              style={{
                display: 'inline-block',
                marginLeft: '0.75rem',
                borderRadius: '9999px',
                backgroundColor: '#0e5d82',
                color: '#ffffff',
                padding: '0.5rem 1.35rem',
                fontSize: '1rem',
                fontWeight: 600,
                lineHeight: 1.5,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Zaak toevoegen
            </Link>
          </nav>
        </div>
      </header>
      {regionOverlay}
    </>
  )
}

function SiteHeaderFallback() {
  return (
    <header className="relative shrink-0 border-b border-gray-200 bg-white" style={{ zIndex: 10002 }}>
      <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-accent sm:text-2xl">
          Vysiongids
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
