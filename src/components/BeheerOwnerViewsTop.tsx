'use client'

import dynamic from 'next/dynamic'

const ListingOwnerDailyViews = dynamic(() => import('@/components/ListingOwnerDailyViews'), {
  ssr: false,
  loading: () => null,
})

type Props = {
  slug: string
}

/** Weergave-statistieken — altijd bovenaan beheer. */
export default function BeheerOwnerViewsTop({ slug }: Props) {
  if (!slug) return null
  return <ListingOwnerDailyViews slug={slug} variant="beheer" />
}
