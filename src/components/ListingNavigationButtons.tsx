import type { Listing } from '@/lib/listing-types'
import { formatListingAddress, getListingCoordinates } from '@/lib/listings'

export function listingGoogleMapsUrl(listing: Listing): string {
  const q = formatListingAddress(listing)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function listingWazeUrl(listing: Listing): string {
  const { lat, lng } = getListingCoordinates(listing)
  const q = formatListingAddress(listing)
  return `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes&q=${encodeURIComponent(q)}`
}

type NavProps = {
  listing: Listing
  compact?: boolean
}

export default function ListingNavigationButtons({ listing, compact }: NavProps) {
  const google = listingGoogleMapsUrl(listing)
  const waze = listingWazeUrl(listing)
  const stack = compact ? 'flex flex-col gap-2' : 'flex flex-col gap-2 sm:flex-row sm:flex-wrap'
  const btn =
    'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-accent hover:text-accent'

  return (
    <div className={stack}>
      <a href={google} target="_blank" rel="noopener noreferrer" className={btn}>
        Google Maps
      </a>
      <a
        href={waze}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-lg bg-[#33ccff] px-4 py-2.5 text-sm font-bold text-[#0d1621] transition hover:brightness-95"
      >
        Rij met Waze
      </a>
    </div>
  )
}
