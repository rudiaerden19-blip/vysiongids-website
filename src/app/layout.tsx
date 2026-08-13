import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.vysiongids.be'),
  title: {
    default: 'Vysiongids | Bestel rechtstreeks bij de zaak',
    template: '%s | Vysiongids',
  },
  description:
    'Gids voor frituren, kebab, pizza en horeca in België. Foto, info en link naar het bestelplatform van de zaak.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className={`${inter.variable} min-h-screen bg-[#f5f5f5] font-sans antialiased text-gray-900`}>
        {children}
      </body>
    </html>
  )
}
