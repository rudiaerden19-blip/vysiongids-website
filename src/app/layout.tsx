import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import SiteFooter from '@/components/SiteFooter'
import ScrollToTopOnNavigation from '@/components/ScrollToTopOnNavigation'
import { LanguageProvider } from '@/i18n/LanguageProvider'
import DocumentLangSync from '@/i18n/DocumentLangSync'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.vysiongids.be'),
  title: {
    default: 'Vysiongids | Bestel rechtstreeks bij de zaak',
    template: '%s | Vysiongids',
  },
  description:
    'Gids voor restaurants, pizzeria, frituren, kebab en horeca in België. Foto, info en link naar het bestelplatform van de zaak.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-[#f5f5f5] font-sans antialiased text-gray-900`}
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
        suppressHydrationWarning
      >
        <ScrollToTopOnNavigation />
        <LanguageProvider>
          <DocumentLangSync />
          {children}
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  )
}
