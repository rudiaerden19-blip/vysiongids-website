import { fetchPublishedListingCountFromDb } from '@/lib/gids-listings-db'
import { actieveZakenDisplay, zoekactiesPerDagDisplay } from '@/lib/gids-public-stats'

/** Demo-seed in 002 (Blonkys + Bar Lies) telt niet boven basis 430; elke extra zaak +1. */
const DEMO_SEED_LISTING_COUNT = 2

export async function getHomePublicStats() {
  const dbCount = await fetchPublishedListingCountFromDb()
  const extra = Math.max(0, dbCount - DEMO_SEED_LISTING_COUNT)
  return {
    activeZaken: actieveZakenDisplay(extra),
    zoekactiesPerDag: zoekactiesPerDagDisplay(),
  }
}
