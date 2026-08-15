'use client'

import dynamic from 'next/dynamic'
import type { ListingMapProps } from '@/components/ListingMap'

/** Leaflet gebruikt window — alleen client-side laden. */
const ListingMap = dynamic(() => import('@/components/ListingMap'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 flex h-[min(420px,55vh)] items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-sm text-gray-500">
      Kaart laden…
    </div>
  ),
})

export default ListingMap
export type { ListingMapProps }
