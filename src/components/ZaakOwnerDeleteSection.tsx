'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import VerwijderZaakButton from '@/components/VerwijderZaakButton'

type Props = { slug: string }

export default function ZaakOwnerDeleteSection({ slug }: Props) {
  const [ownerSlug, setOwnerSlug] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    fetch('/api/gids/me')
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; slug?: string }) => {
        if (data.authenticated && data.slug) setOwnerSlug(data.slug)
      })
      .finally(() => setChecked(true))
  }, [])

  if (!checked) return null
  if (ownerSlug !== slug) {
    return (
      <p className="mt-6 text-sm text-gray-600">
        Zaak uit de gids halen?{' '}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Log in
        </Link>{' '}
        en kies <strong>Verwijder je zaak</strong> in beheer.
      </p>
    )
  }

  return (
    <section className="mt-10 rounded-xl border border-red-200 bg-red-50/50 p-5">
      <h2 className="text-base font-bold text-gray-900">Zaak verwijderen</h2>
      <p className="mt-1 text-sm text-gray-600">
        Alles wordt gewist: gegevens, foto&apos;s en reviews. Daarna verdwijnt je pagina uit de gids.
      </p>
      <VerwijderZaakButton expectedSlug={slug} className="mt-4" />
    </section>
  )
}
