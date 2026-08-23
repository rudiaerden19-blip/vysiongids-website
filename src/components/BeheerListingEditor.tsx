'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import BeheerDienstenEditForm from '@/components/BeheerDienstenEditForm'
import BeheerEditForm from '@/components/BeheerEditForm'
import type { Listing } from '@/lib/listing-types'
import { isDienstenListing } from '@/lib/listing-segment'

type Props = {
  initialListing: Listing
}

type MeResponse = {
  authenticated: boolean
  listing?: Listing
  slug?: string
}

/** Formulier direct uit server-props — geen wachten op BeheerClient/API. */
export default function BeheerListingEditor({ initialListing }: Props) {
  const router = useRouter()
  const [listing, setListing] = useState(initialListing)

  const onSaved = useCallback(
    async (newSlug: string) => {
      router.refresh()
      try {
        const r = await fetch('/api/gids/me', { credentials: 'same-origin' })
        const data = (await r.json()) as MeResponse
        if (data.authenticated && data.listing) setListing(data.listing)
      } catch {
        /* behoud huidige listing */
      }
      if (newSlug !== listing.slug) {
        router.refresh()
      }
    },
    [router, listing.slug],
  )

  if (isDienstenListing(listing)) {
    return (
      <BeheerDienstenEditForm
        key={listing.slug + (listing.serviceDescription ?? '')}
        listing={listing}
        onSaved={onSaved}
      />
    )
  }

  return <BeheerEditForm key={listing.slug + (listing.name ?? '')} listing={listing} onSaved={onSaved} />
}
