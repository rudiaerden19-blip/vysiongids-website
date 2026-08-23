import dynamic from 'next/dynamic'
import BeheerListingEditor from '@/components/BeheerListingEditor'
import { BeheerMenuCardLink } from '@/components/BeheerPageIntroServer'
import { fetchListingForBeheerAdmin } from '@/lib/gids-listings-db'
import { isDienstenListing } from '@/lib/listing-segment'

const BeheerClientExtras = dynamic(() => import('@/components/BeheerClientExtras'), {
  ssr: false,
  loading: () => null,
})

type Props = {
  listingId: string
}

/** Zware listing-fetch + formulier — streamt na snelle beheer-shell. */
export async function BeheerListingAndExtras({ listingId }: Props) {
  const listing = await fetchListingForBeheerAdmin(listingId)
  if (!listing) return null

  return (
    <>
      <BeheerListingEditor initialListing={listing} />
      {!isDienstenListing(listing) ? <BeheerMenuCardLink /> : null}
      <BeheerClientExtras listing={listing} />
    </>
  )
}
