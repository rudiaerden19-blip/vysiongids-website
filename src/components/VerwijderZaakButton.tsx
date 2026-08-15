'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  /** Alleen tonen als ingelogde zaak overeenkomt (optioneel check client-side) */
  expectedSlug?: string
  className?: string
}

export default function VerwijderZaakButton({ expectedSlug, className }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function removeListing() {
    const ok = confirm(
      'Je zaak definitief uit Vysiongids verwijderen?\n\n' +
        'Dit verwijdert je listing, foto\'s en alle reviews. Dit kan niet ongedaan worden gemaakt.',
    )
    if (!ok) return

    setDeleting(true)
    setError(null)
    try {
      const meRes = await fetch('/api/gids/me')
      const me = (await meRes.json()) as { authenticated?: boolean; slug?: string }
      if (!me.authenticated) {
        setError('Log eerst in met zaaknaam en PIN.')
        router.push('/login')
        return
      }
      if (expectedSlug && me.slug !== expectedSlug) {
        setError('Je bent ingelogd als een andere zaak.')
        return
      }

      const res = await fetch('/api/gids/me', { method: 'DELETE' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Verwijderen mislukt.')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Netwerkfout. Probeer opnieuw.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void removeListing()}
        disabled={deleting}
        className="rounded-lg border border-red-400 bg-red-50 px-5 py-2.5 font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
      >
        {deleting ? 'Bezig…' : 'Verwijder je zaak'}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
