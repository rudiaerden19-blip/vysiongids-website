'use client'

import { useRouter } from 'next/navigation'
import GidsPageLoadingOverlay from '@/components/GidsPageLoadingOverlay'
import { useGidsBusyUntilNav } from '@/hooks/use-gids-busy-until-nav'

type Props = {
  href: string
  className?: string
  children: React.ReactNode
  loadingMessage?: string
}

/** Interne link met fullscreen spinner tot de volgende pagina geladen is. */
export default function GidsInternalNavLink({ href, className, children, loadingMessage }: Props) {
  const router = useRouter()
  const { busy, startBusy } = useGidsBusyUntilNav()

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={() => {
          if (busy) return
          startBusy()
          router.push(href)
        }}
      >
        {children}
      </button>
      <GidsPageLoadingOverlay open={busy} message={loadingMessage} />
    </>
  )
}
