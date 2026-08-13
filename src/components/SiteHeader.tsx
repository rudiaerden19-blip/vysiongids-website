import Link from 'next/link'

export default function SiteHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-accent sm:text-2xl">
          Vysiongids
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <Link href="/zoeken" className="hover:text-accent">
            Alle zaken
          </Link>
          <a
            href="https://www.vysionorder.com"
            className="hidden rounded-full border border-accent px-3 py-1.5 text-accent hover:bg-accent/5 sm:inline-block"
          >
            Bestelplatform
          </a>
        </nav>
      </div>
    </header>
  )
}
