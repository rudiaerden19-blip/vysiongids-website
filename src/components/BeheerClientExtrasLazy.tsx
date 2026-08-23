'use client'

import dynamic from 'next/dynamic'
import type { Listing } from '@/lib/listing-types'

const BeheerClientExtras = dynamic(() => import('@/components/BeheerClientExtras'), {
  ssr: false,
  loading: () => null,
})

type Props = {
  listing: Listing
}

export default function BeheerClientExtrasLazy({ listing }: Props) {
  return <BeheerClientExtras listing={listing} />
}
